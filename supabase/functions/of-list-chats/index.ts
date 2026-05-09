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
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const { of_account_id, limit = 50, offset = 0 } = await req.json();
    if (!of_account_id) return json({ error: "of_account_id required" }, 400);

    // Resolve agency_id + creator_id from creator_social_accounts
    const { data: account, error: accErr } = await supabase
      .from("creator_social_accounts")
      .select("creator_id, of_account_id, creators!inner(agency_id)")
      .eq("of_account_id", of_account_id)
      .eq("platform", "onlyfans")
      .maybeSingle();

    if (accErr || !account) return json({ error: "OnlyFans account not found" }, 404);
    const agencyId = (account as any).creators.agency_id;
    const creatorId = account.creator_id;

    const apiResp = await ofGet<{ data: any[]; meta?: any }>(
      `/${of_account_id}/chats`,
      { limit, offset },
    );

    const chats = Array.isArray(apiResp?.data) ? apiResp.data : [];
    const rows = chats.map((c: any) => ({
      agency_id: agencyId,
      creator_id: creatorId,
      of_account_id,
      of_chat_id: String(c.id ?? c.chat_id ?? c.withUser?.id),
      of_fan_id: String(c.withUser?.id ?? c.with_user?.id ?? ""),
      fan_name: c.withUser?.name ?? c.with_user?.name ?? null,
      fan_username: c.withUser?.username ?? c.with_user?.username ?? null,
      fan_avatar: c.withUser?.avatar ?? c.with_user?.avatar ?? null,
      last_message_text: c.lastMessage?.text ?? c.last_message?.text ?? null,
      last_message_at: c.lastMessage?.createdAt ?? c.last_message?.created_at ?? null,
      last_message_is_from_me: c.lastMessage?.fromUser?.id != null
        ? c.lastMessage.fromUser.id !== c.withUser?.id
        : null,
      unread_count: c.unreadMessagesCount ?? c.unread ?? 0,
      lifetime_spend: Number(c.withUser?.spendings?.total ?? 0),
      is_subscribed: Boolean(c.withUser?.isSubscribed ?? c.with_user?.isSubscribed),
      subscribed_until: c.withUser?.subscribedUntil ?? null,
      synced_at: new Date().toISOString(),
    }));

    if (rows.length) {
      const { error: upErr } = await supabase
        .from("of_chats")
        .upsert(rows, { onConflict: "of_account_id,of_chat_id" });
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
