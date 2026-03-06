require("dotenv").config();
const express = require("express");
const { Stagehand } = require("@browserbasehq/stagehand");

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

// ── Auth middleware ──────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use("/api", authMiddleware);

// ── Health check (public) ────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Helper: create a Stagehand instance ─────────────────────────
async function createStagehand(contextId) {
  const config = {
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    browserbaseSessionCreateParams: {
      browserSettings: {
        context: contextId ? { id: contextId, persist: true } : undefined,
        advancedStealth: true,
      },
      keepAlive: false,
      timeout: 180,
    },
    modelName: "gpt-4o",
    modelClientOptions: {
      apiKey: "not-needed", // We use extract() which works without external LLM
    },
    enableCaching: false,
    headless: true,
  };

  const stagehand = new Stagehand(config);
  await stagehand.init();
  return stagehand;
}

// ── POST /api/scrape-earnings ────────────────────────────────────
// Scrapes OnlyFans earnings page using a saved browser context
app.post("/api/scrape-earnings", async (req, res) => {
  const { contextId, creatorId } = req.body;

  if (!contextId) {
    return res.status(400).json({ error: "contextId is required" });
  }

  let stagehand;
  try {
    console.log(`[${creatorId || "unknown"}] Starting earnings scrape...`);
    stagehand = await createStagehand(contextId);
    const page = stagehand.page;

    // Navigate to earnings page
    await page.goto("https://onlyfans.com/my/statistics/statements/earnings", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check if we're logged in (not redirected to login page)
    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("onlyfans.com/?")) {
      console.log(`[${creatorId}] Not logged in, session expired`);
      return res.json({
        success: false,
        error: "Session expired - not logged in",
        needsReauth: true,
      });
    }

    // Try to extract earnings data using Stagehand's AI extract
    let earnings = null;

    try {
      earnings = await page.extract({
        instruction:
          "Extract the earnings/financial data from this OnlyFans statistics page. Look for total earnings, tips, subscriptions, messages revenue, referrals, and posts revenue. All values should be numbers in USD.",
        schema: {
          type: "object",
          properties: {
            total: { type: "number", description: "Total earnings in USD" },
            tips: { type: "number", description: "Tips earnings in USD" },
            subscriptions: { type: "number", description: "Subscriptions earnings in USD" },
            messages: { type: "number", description: "Messages/chat earnings in USD" },
            referrals: { type: "number", description: "Referral earnings in USD" },
            posts: { type: "number", description: "Posts earnings in USD" },
          },
          required: ["total"],
        },
      });
    } catch (extractErr) {
      console.warn(`[${creatorId}] Stagehand extract failed, trying DOM fallback:`, extractErr.message);
    }

    // Fallback: grab raw page text for server-side parsing
    if (!earnings || !earnings.total) {
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 8000));
      earnings = parseEarningsFromText(bodyText);
    }

    console.log(`[${creatorId}] Scrape complete:`, earnings);

    return res.json({
      success: true,
      earnings: {
        total: earnings?.total || 0,
        tips: earnings?.tips || 0,
        subscriptions: earnings?.subscriptions || 0,
        messages: earnings?.messages || 0,
        referrals: earnings?.referrals || 0,
        posts: earnings?.posts || 0,
      },
    });
  } catch (err) {
    console.error(`[${creatorId}] Scrape error:`, err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (stagehand) {
      try { await stagehand.close(); } catch {}
    }
  }
});

// ── POST /api/check-login ────────────────────────────────────────
// Checks if a saved browser context is still authenticated on OnlyFans
app.post("/api/check-login", async (req, res) => {
  const { contextId, creatorId } = req.body;

  if (!contextId) {
    return res.status(400).json({ error: "contextId is required" });
  }

  let stagehand;
  try {
    stagehand = await createStagehand(contextId);
    const page = stagehand.page;

    await page.goto("https://onlyfans.com/my/settings", {
      waitUntil: "networkidle",
      timeout: 20000,
    });

    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes("/login") && !currentUrl.includes("onlyfans.com/?");

    let username = null;
    if (isLoggedIn) {
      try {
        username = await page.evaluate(() => {
          const el = document.querySelector('[class*="username"], .g-user-name, .m-native-custom-select__value');
          return el ? el.textContent.trim() : null;
        });
      } catch {}
    }

    return res.json({ success: true, isLoggedIn, username });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (stagehand) {
      try { await stagehand.close(); } catch {}
    }
  }
});

// ── Regex fallback parser ────────────────────────────────────────
function parseEarningsFromText(text) {
  if (!text) return null;

  const parseAmount = (labels) => {
    for (const label of labels) {
      const patterns = [
        new RegExp(label + `\\s*\\n\\s*\\$\\s*([\\d,]+\\.?\\d*)`, "i"),
        new RegExp(label + `[:\\s]+\\$\\s*([\\d,]+\\.?\\d*)`, "i"),
      ];
      for (const p of patterns) {
        const m = text.match(p);
        if (m) {
          const v = parseFloat(m[1].replace(/,/g, ""));
          if (!isNaN(v) && v > 0) return v;
        }
      }
    }
    return 0;
  };

  const total = parseAmount(["total", "net", "earnings"]);
  const tips = parseAmount(["tips"]);
  const subscriptions = parseAmount(["subscriptions"]);
  const messages = parseAmount(["messages", "chat"]);
  const referrals = parseAmount(["referrals"]);
  const posts = parseAmount(["posts"]);

  return {
    total: total || tips + subscriptions + messages + referrals + posts,
    tips, subscriptions, messages, referrals, posts,
  };
}

// ── Start server ─────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🐰 Stagehand server running on port ${PORT}`);
});
