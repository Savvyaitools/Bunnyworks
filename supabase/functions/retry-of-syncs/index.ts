import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONLYFANS_API_BASE = "https://app.onlyfansapi.com/api";

// Retry delays in milliseconds: 5min, 15min, 1hr, 4hr, 24hr
const RETRY_DELAYS = [
  5 * 60 * 1000,       // 5 minutes
  15 * 60 * 1000,      // 15 minutes
  60 * 60 * 1000,      // 1 hour
  4 * 60 * 60 * 1000,  // 4 hours
  24 * 60 * 60 * 1000, // 24 hours
];

const MAX_RETRIES = 5;

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function logSyncAttempt(
  supabase: SupabaseClient,
  socialAccountId: string,
  agencyId: string,
  syncType: string,
  status: string,
  errorCode?: string,
  errorMessage?: string,
  itemsSynced: number = 0,
  durationMs?: number
) {
  try {
    await supabase.from("of_sync_logs").insert({
      social_account_id: socialAccountId,
      agency_id: agencyId,
      sync_type: syncType,
      status,
      error_code: errorCode,
      error_message: errorMessage,
      items_synced: itemsSynced,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.error("Failed to log sync attempt:", err);
  }
}

async function updateConnectionStatus(
  supabase: SupabaseClient,
  socialAccountId: string,
  status: string,
  error?: string,
  retryCount?: number
) {
  const updates: Record<string, unknown> = {
    of_connection_status: status,
    updated_at: new Date().toISOString(),
  };

  if (error) {
    updates.of_last_error = error;
    updates.of_last_error_at = new Date().toISOString();
  }

  if (status === "healthy") {
    updates.of_last_synced_at = new Date().toISOString();
    updates.of_last_error = null;
    updates.of_sync_retry_count = 0;
    updates.of_next_retry_at = null;
  } else if (status === "error" && retryCount !== undefined) {
    updates.of_sync_retry_count = retryCount;
    
    // Calculate next retry time if under max retries
    if (retryCount < MAX_RETRIES) {
      const delayMs = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
      updates.of_next_retry_at = new Date(Date.now() + delayMs).toISOString();
    } else {
      updates.of_next_retry_at = null; // No more retries
    }
  } else if (status === "expired") {
    // Expired sessions require manual reconnection
    updates.of_next_retry_at = null;
  }

  await supabase
    .from("creator_social_accounts")
    .update(updates)
    .eq("id", socialAccountId);
}

async function trySync(
  supabase: SupabaseClient,
  apiKey: string,
  account: { id: string; of_account_id: string; agency_id: string; of_sync_retry_count: number }
): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    console.log(`[${account.of_account_id}] Attempting sync (retry ${account.of_sync_retry_count})...`);
    
    // Test connection by fetching account info
    const testUrl = `${ONLYFANS_API_BASE}/${account.of_account_id}`;
    const response = await fetch(testUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // Classify the error
      const statusCode = response.status;
      const errorMessage = errorData.message || errorData.error || "Unknown error";
      
      // 401/422 with session errors = expired
      if (statusCode === 401 || statusCode === 422) {
        if (errorMessage.toLowerCase().includes("session") || 
            errorMessage.toLowerCase().includes("unauthorized") ||
            errorMessage.toLowerCase().includes("authentication")) {
          console.log(`[${account.of_account_id}] Session expired`);
          await updateConnectionStatus(supabase, account.id, "expired", errorMessage);
          await logSyncAttempt(
            supabase,
            account.id,
            account.agency_id,
            "retry",
            "failed",
            `HTTP_${statusCode}`,
            errorMessage,
            0,
            durationMs
          );
          return false;
        }
      }

      // Other errors - increment retry count
      const newRetryCount = (account.of_sync_retry_count || 0) + 1;
      console.log(`[${account.of_account_id}] Sync error (attempt ${newRetryCount}/${MAX_RETRIES}): ${errorMessage}`);
      
      await updateConnectionStatus(supabase, account.id, "error", errorMessage, newRetryCount);
      await logSyncAttempt(
        supabase,
        account.id,
        account.agency_id,
        "retry",
        "failed",
        `HTTP_${statusCode}`,
        errorMessage,
        0,
        durationMs
      );
      
      return false;
    }

    // Success! Update status to healthy
    console.log(`[${account.of_account_id}] Sync successful`);
    await updateConnectionStatus(supabase, account.id, "healthy");
    await logSyncAttempt(
      supabase,
      account.id,
      account.agency_id,
      "retry",
      "success",
      undefined,
      undefined,
      1,
      durationMs
    );
    
    return true;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Network error";
    const newRetryCount = (account.of_sync_retry_count || 0) + 1;
    
    console.error(`[${account.of_account_id}] Sync exception:`, err);
    
    await updateConnectionStatus(supabase, account.id, "error", errorMessage, newRetryCount);
    await logSyncAttempt(
      supabase,
      account.id,
      account.agency_id,
      "retry",
      "failed",
      "EXCEPTION",
      errorMessage,
      0,
      durationMs
    );
    
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting OnlyFans retry sync job...");

    const apiKey = Deno.env.get("ONLYFANS_API_KEY");
    if (!apiKey) {
      console.error("ONLYFANS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find accounts that need retry
    const now = new Date().toISOString();
    const { data: accountsToRetry, error: fetchError } = await supabase
      .from("creator_social_accounts")
      .select(`
        id,
        of_account_id,
        of_sync_retry_count,
        creators!inner(agency_id)
      `)
      .eq("of_connection_status", "error")
      .lt("of_next_retry_at", now)
      .lt("of_sync_retry_count", MAX_RETRIES)
      .not("of_account_id", "is", null);

    if (fetchError) {
      console.error("Failed to fetch accounts to retry:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${accountsToRetry?.length || 0} accounts to retry`);

    let successCount = 0;
    let failCount = 0;

    // deno-lint-ignore no-explicit-any
    for (const account of (accountsToRetry || []) as any[]) {
      if (!account.of_account_id) continue;
      
      const agencyId = account.creators?.agency_id;
      if (!agencyId) continue;

      const success = await trySync(supabase, apiKey, {
        id: account.id,
        of_account_id: account.of_account_id,
        agency_id: agencyId,
        of_sync_retry_count: account.of_sync_retry_count || 0,
      });

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between accounts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Retry sync completed: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        retried: (accountsToRetry?.length || 0),
        successful: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Retry sync error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
