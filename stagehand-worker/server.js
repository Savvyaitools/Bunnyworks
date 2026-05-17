import express from "express";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 8080;
const WORKER_TOKEN = process.env.WORKER_TOKEN; // shared secret with the edge function

const StepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("goto"), url: z.string().url() }),
  z.object({ type: z.literal("act"), instruction: z.string().min(1) }),
  z.object({
    type: z.literal("extract"),
    instruction: z.string().min(1),
    schema: z.record(z.any()).optional(),
  }),
  z.object({ type: z.literal("wait"), ms: z.number().int().min(0).max(60_000) }),
]);

const BodySchema = z.object({
  runId: z.string().min(1).max(128).optional(),
  connectUrl: z.string().url(),
  systemPrompt: z.string().optional(),
  task: z.string().optional(),
  steps: z.array(StepSchema).min(1),
});

function auth(req, res, next) {
  if (!WORKER_TOKEN) return next();
  const header = req.header("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (token !== WORKER_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * In-memory registry of in-progress runs so DELETE /run/:id can cancel them.
 * For multi-instance deployments, replace with Redis or a DB-backed registry.
 */
const activeRuns = new Map(); // runId -> { stagehand, cancelled, startedAt, task }

function isCancelled(runId) {
  return activeRuns.get(runId)?.cancelled === true;
}

app.post("/run", auth, async (req, res) => {
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { connectUrl, systemPrompt, task, steps } = parsed.data;
  const runId = parsed.data.runId || randomUUID();

  if (activeRuns.has(runId)) {
    return res.status(409).json({ error: "runId already in progress", runId });
  }

  const logs = [];
  const log = (level, message, data) => {
    const entry = { ts: new Date().toISOString(), level, message, ...(data ? { data } : {}) };
    logs.push(entry);
    console.log(`[${level}] ${message}`, data ?? "");
  };

  let stagehand;
  const extracted = [];
  const entry = { stagehand: null, cancelled: false, startedAt: Date.now(), task };
  activeRuns.set(runId, entry);

  try {
    log("info", "Initializing Stagehand", { task, runId });
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      browserbaseSessionID: undefined,
      // connect over CDP to an already-created Browserbase session
      localBrowserLaunchOptions: undefined,
      modelName: process.env.STAGEHAND_MODEL || "gpt-4o-mini",
      modelClientOptions: process.env.OPENAI_API_KEY
        ? { apiKey: process.env.OPENAI_API_KEY }
        : undefined,
      systemPrompt,
      verbose: 1,
      logger: (msg) => log("stagehand", msg?.message ?? String(msg), msg?.auxiliary),
      browserbaseSessionCreateParams: undefined,
      // pass the pre-created Browserbase session connect URL
      cdpUrl: connectUrl,
    });

    await stagehand.init();
    entry.stagehand = stagehand;

    if (isCancelled(runId)) {
      throw new Error("cancelled");
    }

    const page = stagehand.page;

    for (let i = 0; i < steps.length; i++) {
      if (isCancelled(runId)) {
        log("warn", `Run cancelled before step ${i + 1}`);
        throw new Error("cancelled");
      }

      const step = steps[i];
      log("info", `step ${i + 1}/${steps.length}: ${step.type}`, step);

      try {
        if (step.type === "goto") {
          await page.goto(step.url, { waitUntil: "domcontentloaded" });
        } else if (step.type === "act") {
          const result = await page.act(step.instruction);
          log("info", "act result", result);
        } else if (step.type === "extract") {
          const result = await page.extract({
            instruction: step.instruction,
            schema: step.schema,
          });
          extracted.push({ step: i, instruction: step.instruction, result });
          log("info", "extract result", result);
        } else if (step.type === "wait") {
          // Poll cancellation roughly every 250ms during waits
          const deadline = Date.now() + step.ms;
          while (Date.now() < deadline) {
            if (isCancelled(runId)) break;
            await new Promise((r) => setTimeout(r, Math.min(250, deadline - Date.now())));
          }
        }
      } catch (stepErr) {
        log("error", `step ${i + 1} failed`, { message: String(stepErr?.message ?? stepErr) });
        throw stepErr;
      }
    }

    log("info", "Run finished", { runId });
    return res.json({
      ok: true,
      runId,
      logs,
      result: { extracted, currentUrl: page.url() },
    });
  } catch (err) {
    const cancelled = isCancelled(runId) || err?.message === "cancelled";
    log(cancelled ? "warn" : "error", cancelled ? "Run cancelled" : "Run failed", {
      message: String(err?.message ?? err),
    });
    return res.status(cancelled ? 499 : 500).json({
      ok: false,
      runId,
      cancelled,
      logs,
      result: { extracted },
      error: String(err?.message ?? err),
    });
  } finally {
    try {
      await stagehand?.close();
    } catch (closeErr) {
      console.error("close error", closeErr);
    }
    activeRuns.delete(runId);
  }
});

app.get("/run/:id", auth, (req, res) => {
  const entry = activeRuns.get(req.params.id);
  if (!entry) return res.status(404).json({ error: "not found" });
  res.json({
    runId: req.params.id,
    task: entry.task,
    startedAt: new Date(entry.startedAt).toISOString(),
    cancelled: entry.cancelled,
  });
});

app.delete("/run/:id", auth, async (req, res) => {
  const runId = req.params.id;
  const entry = activeRuns.get(runId);
  if (!entry) {
    return res.status(404).json({ ok: false, error: "run not found or already finished", runId });
  }
  if (entry.cancelled) {
    return res.json({ ok: true, runId, alreadyCancelled: true });
  }

  entry.cancelled = true;
  console.log(`[cancel] run ${runId}`);

  // Best-effort: tear down the Stagehand session immediately so any in-flight
  // act/extract/goto rejects and the POST /run handler can return.
  try {
    await entry.stagehand?.close();
  } catch (err) {
    console.error(`[cancel] close error for ${runId}:`, err);
  }

  res.json({ ok: true, runId, cancelled: true });
});

app.listen(PORT, () => {
  console.log(`Stagehand worker listening on :${PORT}`);
});