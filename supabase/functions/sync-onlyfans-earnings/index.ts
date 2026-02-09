import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONLYFANS_API_BASE = "https://app.onlyfansapi.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting OnlyFans earnings sync job...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("ONLYFANS_API_KEY");

    if (!apiKey) {
      console.error("ONLYFANS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "OnlyFans API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all connected OnlyFans accounts
    const { data: accounts, error: fetchError } = await supabase
      .from("creator_social_accounts")
      .select("id, creator_id, of_account_id, username")
      .eq("platform", "onlyfans")
      .not("of_account_id", "is", null);

    if (fetchError) {
      console.error("Error fetching accounts:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${accounts?.length || 0} OnlyFans accounts to sync`);

    const results: { accountId: string; success: boolean; error?: string }[] = [];

    for (const account of accounts || []) {
      try {
        console.log(`Syncing earnings for account: ${account.of_account_id}`);

        // Fetch earnings from OnlyFans API
        const response = await fetch(
          `${ONLYFANS_API_BASE}/${account.of_account_id}/payouts/earning-statistics`,
          {
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error for ${account.of_account_id}:`, errorText);
          results.push({ accountId: account.of_account_id, success: false, error: errorText });
          continue;
        }

        const earnings = await response.json();
        console.log(`Earnings data for ${account.of_account_id}:`, earnings);

        // Calculate period (current month)
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // Parse the actual API response structure
        const monthsData = earnings?.data?.list?.months || {};
        const totalData = earnings?.data?.list?.total || {};
        
        // Get current month timestamp (first of the month at midnight UTC)
        const currentMonthTimestamp = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
        
        // Find current month's data from the months object
        let currentMonthNet = 0;
        let currentMonthTips = 0;
        let currentMonthSubs = 0;
        let currentMonthMessages = 0;
        
        // Look for the current month in the API response
        for (const [timestamp, monthData] of Object.entries(monthsData)) {
          const monthDate = new Date(parseInt(timestamp) * 1000);
          if (monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear()) {
            const data = monthData as { total_net?: number; tips?: { net?: number }[]; subscribes?: { net?: number }[]; chat_messages?: { net?: number }[] };
            currentMonthNet = data.total_net || 0;
            currentMonthTips = data.tips?.reduce((sum: number, t: { net?: number }) => sum + (t.net || 0), 0) || 0;
            currentMonthSubs = data.subscribes?.reduce((sum: number, s: { net?: number }) => sum + (s.net || 0), 0) || 0;
            currentMonthMessages = data.chat_messages?.reduce((sum: number, m: { net?: number }) => sum + (m.net || 0), 0) || 0;
            break;
          }
        }
        
        // Also store all-time totals for reference
        const allTimeTips = totalData?.tips?.total_net || 0;
        const allTimeSubs = totalData?.subscribes?.total_net || 0;
        const allTimeMessages = totalData?.chat_messages?.total_net || 0;
        const allTimeTotal = totalData?.all?.total_net || 0;

        console.log(`Current month net: $${currentMonthNet}, All-time total: $${allTimeTotal}`);

        // Check if we already have an earning record for this period
        const { data: existingEarning } = await supabase
          .from("creator_earnings")
          .select("id")
          .eq("creator_id", account.creator_id)
          .eq("platform", "onlyfans")
          .gte("period_start", periodStart)
          .lte("period_end", periodEnd)
          .maybeSingle();

        const earningPayload = {
          amount: currentMonthNet,
          tips: currentMonthTips,
          subscriptions: currentMonthSubs,
          messages_revenue: currentMonthMessages,
          referrals: 0,
          notes: `Auto-synced: Tips: $${currentMonthTips.toFixed(2)}, Subs: $${currentMonthSubs.toFixed(2)}, Messages: $${currentMonthMessages.toFixed(2)} | All-time: $${allTimeTotal.toFixed(2)}`,
        };

        if (existingEarning) {
          await supabase
            .from("creator_earnings")
            .update(earningPayload)
            .eq("id", existingEarning.id);

          console.log(`Updated earnings for ${account.of_account_id}: $${currentMonthNet}`);
        } else {
          await supabase
            .from("creator_earnings")
            .insert({
              creator_id: account.creator_id,
              platform: "onlyfans",
              period_start: periodStart,
              period_end: periodEnd,
              ...earningPayload,
            });

          console.log(`Inserted new earnings for ${account.of_account_id}: $${currentMonthNet}`);
        }

        // Update last synced timestamp
        await supabase
          .from("creator_social_accounts")
          .update({ of_last_synced_at: new Date().toISOString() })
          .eq("id", account.id);

        results.push({ accountId: account.of_account_id, success: true });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error syncing ${account.of_account_id}:`, errorMsg);
        results.push({ accountId: account.of_account_id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Sync complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Sync complete",
        total: results.length,
        success: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Sync job error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
