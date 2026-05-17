import express from "express";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";

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

app.post("/run", auth, async (req, res) => {
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { connectUrl, systemPrompt, task, steps } = parsed.data;

  const logs = [];
  const log = (level, message, data) => {
    const entry = { ts: new Date().toISOString(), level, message, ...(data ? { data } : {}) };
    logs.push(entry);
    console.log(`[${level}] ${message}`, data ?? "");
  };

  let stagehand;
  const extracted = [];

  try {
    log("info", "Initializing Stagehand", { task });
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
    const page = stagehand.page;

    for (let i = 0; i < steps.length; i++) {
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
          await new Promise((r) => setTimeout(r, step.ms));
        }
      } catch (stepErr) {
        log("error", `step ${i + 1} failed`, { message: String(stepErr?.message ?? stepErr) });
        throw stepErr;
      }
    }

    log("info", "Run finished");
    return res.json({
      ok: true,
      logs,
      result: { extracted, currentUrl: page.url() },
    });
  } catch (err) {
    log("error", "Run failed", { message: String(err?.message ?? err) });
    return res.status(500).json({
      ok: false,
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
  }
});

app.listen(PORT, () => {
  console.log(`Stagehand worker listening on :${PORT}`);
});