import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Simulate the full parsing logic from the edge function
function parseEarnings(rawText: string) {
  let bestTotal = 0, tips = 0, subs = 0, messages = 0, referrals = 0, posts = 0;

  // Check if result is from XHR interception (pre-parsed JSON)
  try {
    const xhrData = JSON.parse(rawText);
    if (xhrData._source === "xhr") {
      return { bestTotal: xhrData.total || 0, tips: xhrData.tips || 0, subs: xhrData.subs || 0, messages: xhrData.messages || 0, referrals: xhrData.referrals || 0, posts: xhrData.posts || 0, source: "xhr" };
    }
  } catch {}

  // DOM text parsing
  const parseAmount = (labels: string[]): number => {
    for (const label of labels) {
      const nlPat = new RegExp(label + `\\s*\\n\\s*\\$\\s*([\\d,]+\\.?\\d*)`, "i");
      const nlMatch = rawText.match(nlPat);
      if (nlMatch) {
        const val = parseFloat(nlMatch[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) return val;
      }
      const inlinePat = new RegExp(label + `[:\\s]+\\$\\s*([\\d,]+\\.?\\d*)`, "i");
      const inlineMatch = rawText.match(inlinePat);
      if (inlineMatch) {
        const val = parseFloat(inlineMatch[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return 0;
  };

  const totalEarnings = parseAmount(["total", "net", "earnings", "total earnings", "net earnings"]);
  tips = parseAmount(["tips"]);
  subs = parseAmount(["subscriptions", "subscription"]);
  messages = parseAmount(["messages", "messaging", "chat messages", "chat"]);
  referrals = parseAmount(["referrals", "referral"]);
  posts = parseAmount(["posts", "post"]);

  let fallbackTotal = 0;
  if (!totalEarnings) {
    const allAmounts = [...rawText.matchAll(/\$\s*([\d,]+\.?\d{0,2})/g)]
      .map(m => parseFloat(m[1].replace(/,/g, "")))
      .filter(v => !isNaN(v) && v > 0);
    if (allAmounts.length > 0) fallbackTotal = Math.max(...allAmounts);
  }

  bestTotal = totalEarnings || (tips + subs + messages + referrals + posts) || fallbackTotal;
  return { bestTotal, tips, subs, messages, referrals, posts, source: "dom", totalEarnings, fallbackTotal };
}

// === XHR JSON tests ===
Deno.test("parses XHR-intercepted JSON data", () => {
  const json = JSON.stringify({ _source: "xhr", total: 8180.89, tips: 668, subs: 930.40, messages: 6582.49, posts: 0, referrals: 0 });
  const r = parseEarnings(json);
  assertEquals(r.source, "xhr");
  assertEquals(r.bestTotal, 8180.89);
  assertEquals(r.tips, 668);
  assertEquals(r.subs, 930.40);
  assertEquals(r.messages, 6582.49);
});

// === DOM text tests ===
Deno.test("parses newline-separated OF earnings", () => {
  const text = `Statements\nEarnings\nTotal\n$8,180.89\nSubscriptions\n$930.40\nTips\n$668.00\nMessages\n$6,582.49\nReferrals\n$0.00\nPosts\n$0.00`;
  const r = parseEarnings(text);
  assertEquals(r.source, "dom");
  assertEquals(r.bestTotal, 8180.89);
  assertEquals(r.subs, 930.40);
  assertEquals(r.tips, 668);
  assertEquals(r.messages, 6582.49);
});

Deno.test("parses inline colon format", () => {
  const text = `Earnings: $5,432.10 | Tips: $200.00 | Subscriptions: $1,000.00 | Messages: $4,232.10`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 5432.10);
  assertEquals(r.tips, 200);
  assertEquals(r.subs, 1000);
});

Deno.test("uses fallback for unlabeled amounts", () => {
  const text = `Some page content with $1,234.56 and $567.89 shown in cards`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 1234.56);
});

Deno.test("handles spacing variations", () => {
  const text = `Total\n$ 3,456.78\nTips\n$ 100.00\nSubscriptions\n$ 500.00\nMessages\n$ 2,856.78`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 3456.78);
  assertEquals(r.tips, 100);
});

Deno.test("handles tab-like format", () => {
  const text = `Net Earnings  $12,345.67\nChat Messages  $8,000.00\nSubscriptions  $3,000.00\nTips  $1,345.67`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 12345.67);
});

Deno.test("handles empty page gracefully", () => {
  const r = parseEarnings(`Loading...`);
  assertEquals(r.bestTotal, 0);
});

// === Realistic OF DOM text scenarios ===
Deno.test("handles OF-style compact text with periods", () => {
  const text = `OnlyFans\nStatements\nEarnings\nSubscriptions\n$1,245.00\nTips\n$389.50\nMessages\n$4,200.00\nPosts\n$150.00\nReferrals\n$0.00\nStream\n$0.00\nTotal\n$5,984.50`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 5984.50);
  assertEquals(r.subs, 1245);
  assertEquals(r.tips, 389.50);
  assertEquals(r.messages, 4200);
  assertEquals(r.posts, 150);
});

Deno.test("handles OF text where total appears first", () => {
  const text = `Total $10,500.00\nSubscriptions $3,000.00\nTips $2,500.00\nMessages $5,000.00`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 10500);
});
