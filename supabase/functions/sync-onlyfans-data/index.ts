import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONLYFANS_API_BASE = "https://app.onlyfansapi.com/api";

// Cache TTL in milliseconds
const CACHE_TTL = {
  earnings: 4 * 60 * 60 * 1000,      // 4 hours
  fans: 1 * 60 * 60 * 1000,          // 1 hour
  chats: 5 * 60 * 1000,              // 5 minutes
  vault: 24 * 60 * 60 * 1000,        // 24 hours
  account: 6 * 60 * 60 * 1000,       // 6 hours
  posts: 2 * 60 * 60 * 1000,         // 2 hours
};

interface SyncResult {
  accountId: string;
  earnings: boolean;
  fans: boolean;
  chats: boolean;
  error?: string;
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function callOnlyFansAPI(apiKey: string, endpoint: string) {
  const url = `${ONLYFANS_API_BASE}${endpoint}`;
  console.log(`Calling OnlyFans API: GET ${url}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error for ${endpoint}:`, errorText);
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

async function isCacheStale(
  supabase: SupabaseClient,
  accountId: string,
  cacheKey: string,
  ttlMs: number
): Promise<boolean> {
  const { data } = await supabase
    .from("of_cache")
    .select("cached_at")
    .eq("of_account_id", accountId)
    .eq("cache_key", cacheKey)
    .single();
  
  if (!data) return true;
  
  const cachedAt = new Date(data.cached_at).getTime();
  const now = Date.now();
  return (now - cachedAt) > ttlMs;
}

async function syncEarnings(
  supabase: SupabaseClient,
  apiKey: string,
  accountId: string,
  _agencyId: string
): Promise<boolean> {
  const cacheKey = "earnings";
  
  // Check if cache is stale
  const isStale = await isCacheStale(supabase, accountId, cacheKey, CACHE_TTL.earnings);
  if (!isStale) {
    console.log(`[${accountId}] Earnings cache is fresh, skipping`);
    return false;
  }
  
  console.log(`[${accountId}] Syncing earnings...`);
  const data = await callOnlyFansAPI(apiKey, `/${accountId}/payouts/earning-statistics`);
  
  // Update cache
  await supabase.from("of_cache").upsert({
    of_account_id: accountId,
    cache_key: cacheKey,
    data: data,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL.earnings).toISOString(),
  }, { onConflict: "of_account_id,cache_key" });
  
  console.log(`[${accountId}] Earnings synced successfully`);
  return true;
}

async function syncFans(
  supabase: SupabaseClient,
  apiKey: string,
  accountId: string,
  agencyId: string
): Promise<boolean> {
  const cacheKey = "fans";
  
  const isStale = await isCacheStale(supabase, accountId, cacheKey, CACHE_TTL.fans);
  if (!isStale) {
    console.log(`[${accountId}] Fans cache is fresh, skipping`);
    return false;
  }
  
  console.log(`[${accountId}] Syncing fans...`);
  
  // OnlyFans API has a max limit of 20 for fans endpoints
  const activeFans = await callOnlyFansAPI(apiKey, `/${accountId}/fans/active?limit=20`);
  const expiredFans = await callOnlyFansAPI(apiKey, `/${accountId}/fans/expired?limit=20`);
  
  // Upsert fans to of_fans table
  // deno-lint-ignore no-explicit-any
  const allFans: any[] = [
    // deno-lint-ignore no-explicit-any
    ...(activeFans.data || []).map((f: any) => ({ ...f, is_active: true })),
    // deno-lint-ignore no-explicit-any
    ...(expiredFans.data || []).map((f: any) => ({ ...f, is_active: false })),
  ];
  
  for (const fan of allFans) {
    await supabase.from("of_fans").upsert({
      agency_id: agencyId,
      of_account_id: accountId,
      of_fan_id: fan.id?.toString() || fan.username,
      name: fan.name || fan.username,
      username: fan.username,
      avatar_url: fan.avatar,
      subscribed_at: fan.subscribed_at,
      expires_at: fan.expires_at,
      total_spent: fan.total_spent || 0,
      is_active: fan.is_active,
      renew_on: fan.renew_on || false,
      metadata: { raw: fan },
      synced_at: new Date().toISOString(),
    }, { onConflict: "of_account_id,of_fan_id" });
  }
  
  // Update cache
  await supabase.from("of_cache").upsert({
    of_account_id: accountId,
    cache_key: cacheKey,
    data: { active: activeFans, expired: expiredFans, total: allFans.length },
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL.fans).toISOString(),
  }, { onConflict: "of_account_id,cache_key" });
  
  console.log(`[${accountId}] Synced ${allFans.length} fans`);
  return true;
}

async function syncChats(
  supabase: SupabaseClient,
  apiKey: string,
  accountId: string,
  agencyId: string
): Promise<boolean> {
  const cacheKey = "chats";
  
  const isStale = await isCacheStale(supabase, accountId, cacheKey, CACHE_TTL.chats);
  if (!isStale) {
    console.log(`[${accountId}] Chats cache is fresh, skipping`);
    return false;
  }
  
  console.log(`[${accountId}] Syncing chats...`);
  const chats = await callOnlyFansAPI(apiKey, `/${accountId}/chats?limit=20`);
  
  // Upsert chats to of_chats table
  // deno-lint-ignore no-explicit-any
  for (const chat of (chats.data || []) as any[]) {
    await supabase.from("of_chats").upsert({
      agency_id: agencyId,
      of_account_id: accountId,
      of_chat_id: chat.id?.toString(),
      of_fan_id: chat.with_user?.id?.toString(),
      fan_name: chat.with_user?.name || chat.with_user?.username,
      fan_username: chat.with_user?.username,
      fan_avatar: chat.with_user?.avatar,
      last_message_text: chat.last_message?.text,
      last_message_at: chat.last_message?.created_at,
      last_message_is_from_me: chat.last_message?.is_from_me,
      unread_count: chat.unread_count || 0,
      is_pinned: chat.is_pinned || false,
      synced_at: new Date().toISOString(),
    }, { onConflict: "of_account_id,of_chat_id" });
  }
  
  // Update cache
  await supabase.from("of_cache").upsert({
    of_account_id: accountId,
    cache_key: cacheKey,
    data: chats,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL.chats).toISOString(),
  }, { onConflict: "of_account_id,cache_key" });
  
  console.log(`[${accountId}] Synced ${chats.data?.length || 0} chats`);
  return true;
}

async function syncAccountData(
  supabase: SupabaseClient,
  apiKey: string,
  accountId: string,
  agencyId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    accountId,
    earnings: false,
    fans: false,
    chats: false,
  };
  
  // Sync each type independently - don't let one failure stop the others
  try {
    result.earnings = await syncEarnings(supabase, apiKey, accountId, agencyId);
  } catch (err) {
    console.error(`[${accountId}] Earnings sync error:`, err);
  }
  
  try {
    result.fans = await syncFans(supabase, apiKey, accountId, agencyId);
  } catch (err) {
    console.error(`[${accountId}] Fans sync error:`, err);
  }
  
  try {
    result.chats = await syncChats(supabase, apiKey, accountId, agencyId);
  } catch (err) {
    console.error(`[${accountId}] Chats sync error:`, err);
    result.error = err instanceof Error ? err.message : "Unknown error";
  }
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Starting OnlyFans data sync...");
    
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
    
    // Get all connected OF accounts
    const { data: socialAccounts, error: fetchError } = await supabase
      .from("creator_social_accounts")
      .select(`
        of_account_id,
        creator_id,
        creators!inner(agency_id)
      `)
      .not("of_account_id", "is", null);
    
    if (fetchError) {
      console.error("Failed to fetch social accounts:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${socialAccounts?.length || 0} connected accounts to sync`);
    
    const results: SyncResult[] = [];
    
    // Process accounts sequentially to avoid rate limiting
    // deno-lint-ignore no-explicit-any
    for (const account of (socialAccounts || []) as any[]) {
      if (!account.of_account_id) continue;
      
      const agencyId = account.creators?.agency_id;
      if (!agencyId) continue;
      
      const result = await syncAccountData(
        supabase,
        apiKey,
        account.of_account_id,
        agencyId
      );
      results.push(result);
      
      // Small delay between accounts to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clean up expired cache entries
    await supabase.from("of_cache").delete().lt("expires_at", new Date().toISOString());
    
    console.log("Sync completed:", JSON.stringify(results));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: results.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
