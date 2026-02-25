import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Simulate the parsing logic from the edge function
function parseEarnings(rawText: string) {
  const parseAmount = (labels: string[]): number => {
    for (const label of labels) {
      // Pattern 1: "Label\n$1,234.56" (newline-separated)
      const nlPat = new RegExp(label + `\\s*\\n\\s*\\$\\s*([\\d,]+\\.?\\d*)`, "i");
      const nlMatch = rawText.match(nlPat);
      if (nlMatch) {
        const val = parseFloat(nlMatch[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) return val;
      }
      // Pattern 2: "Label: $1,234.56" or "Label $1,234.56" (inline)
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
  const tips = parseAmount(["tips"]);
  const subs = parseAmount(["subscriptions", "subscription"]);
  const messages = parseAmount(["messages", "messaging", "chat messages", "chat"]);
  const referrals = parseAmount(["referrals", "referral"]);
  const posts = parseAmount(["posts", "post"]);

  let fallbackTotal = 0;
  if (!totalEarnings) {
    const allAmounts = [...rawText.matchAll(/\$\s*([\d,]+\.?\d{0,2})/g)]
      .map(m => parseFloat(m[1].replace(/,/g, "")))
      .filter(v => !isNaN(v) && v > 0);
    if (allAmounts.length > 0) fallbackTotal = Math.max(...allAmounts);
  }

  const bestTotal = totalEarnings || (tips + subs + messages + referrals + posts) || fallbackTotal;
  return { bestTotal, totalEarnings, tips, subs, messages, referrals, posts, fallbackTotal };
}

// Test 1: OF-style newline-separated format (most likely DOM innerText format)
Deno.test("parses newline-separated OF earnings", () => {
  const text = `Statements
Earnings
Total
$8,180.89
Subscriptions
$930.40
Tips
$668.00
Messages
$6,582.49
Referrals
$0.00
Posts
$0.00`;

  const r = parseEarnings(text);
  assertEquals(r.totalEarnings, 8180.89);
  assertEquals(r.subs, 930.40);
  assertEquals(r.tips, 668.00);
  assertEquals(r.messages, 6582.49);
  assertEquals(r.bestTotal, 8180.89);
});

// Test 2: Inline colon format
Deno.test("parses inline colon format", () => {
  const text = `Earnings: $5,432.10 | Tips: $200.00 | Subscriptions: $1,000.00 | Messages: $4,232.10`;
  const r = parseEarnings(text);
  assertEquals(r.totalEarnings, 5432.10);
  assertEquals(r.tips, 200);
  assertEquals(r.subs, 1000);
  assertEquals(r.messages, 4232.10);
});

// Test 3: No labels, just dollar amounts (fallback)
Deno.test("uses fallback for unlabeled amounts", () => {
  const text = `Some page content with $1,234.56 and $567.89 shown in cards`;
  const r = parseEarnings(text);
  assertEquals(r.fallbackTotal, 1234.56);
  assertEquals(r.bestTotal, 1234.56);
});

// Test 4: Mixed format with spacing variations
Deno.test("handles spacing variations", () => {
  const text = `Total\n$ 3,456.78\nTips\n$ 100.00\nSubscriptions\n$ 500.00\nMessages\n$ 2,856.78`;
  const r = parseEarnings(text);
  assertEquals(r.totalEarnings, 3456.78);
  assertEquals(r.tips, 100);
  assertEquals(r.subs, 500);
  assertEquals(r.messages, 2856.78);
});

// Test 5: Tab-based earnings breakdown (another possible OF format)
Deno.test("handles tab-like format", () => {
  const text = `Net Earnings  $12,345.67
Chat Messages  $8,000.00
Subscriptions  $3,000.00
Tips  $1,345.67`;
  const r = parseEarnings(text);
  assertEquals(r.totalEarnings, 12345.67);
  assertEquals(r.tips, 1345.67);
  assertEquals(r.subs, 3000);
});

// Test 6: Empty/loading page
Deno.test("handles empty page gracefully", () => {
  const text = `Loading...`;
  const r = parseEarnings(text);
  assertEquals(r.bestTotal, 0);
});
