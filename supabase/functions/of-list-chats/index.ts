import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofGet } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Fetches chats from OnlyFansAPI for a given account and upserts into of_chats.
 * Body: { of_account_id: string, limit?: number, offset?: number }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { of_account_id, limit = 50, offset = 0 } = await req.json().catch(() => ({}));
    if (!of_account_id) return json({ error: "of_account_id required" }, 400);

    // Resolve agency_id + creator_id from creator_social_accounts
    const { data: account, error: accErr } = await supabase
      .from("creator_social_accounts")
      .select("creator_id, of_account_id, creators!inner(agency_id)")
      .eq("of_account_id", of_account_id)
      .ilike("platform", "onlyfans")
      .maybeSingle();

    if (accErr || !account) return json({ error: "OnlyFans account not found" }, 404);
    const agencyId = (account as any).creators.agency_id;
    const creatorId = account.creator_id;

    const apiResp = await ofGet<{ data: any[]; meta?: any }>(
      `/${of_account_id}/chats`,
      { limit: Math.min(Number(limit) || 50, 100), offset: Number(offset) || 0, skip_users: "none", order: "recent" },
    );

    const chats = Array.isArray(apiResp?.data) ? apiResp.data : [];
    const rows = chats.map((c: any) => toChatRow(c, agencyId, creatorId, of_account_id)).filter(Boolean);

    // Dedupe rows by conflict key to avoid Postgres "ON CONFLICT ... cannot
    // affect row a second time" when the upstream API returns dupes.
    const dedupedRows = Array.from(
      new Map(rows.map((r: any) => [`${r.of_account_id}::${r.of_chat_id}`, r])).values()
    );
    if (dedupedRows.length) {
      const { error: upErr } = await supabase
        .from("of_chats")
        .upsert(dedupedRows, { onConflict: "of_account_id,of_chat_id" });
      if (upErr) throw upErr;
    }

    return json({ ok: true, synced: rows.length });
  } catch (err: any) {
    console.error("of-list-chats error", err);
    return json({ error: err.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
