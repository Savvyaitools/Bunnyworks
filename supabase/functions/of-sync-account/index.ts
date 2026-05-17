import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofGet } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Master sync for a connected OnlyFans account.
 * Pulls fresh chats, fans (subscribers) and the current-period earnings
 * statement, upserts them, and updates the account health pointers.
 *
 * Body: { of_account_id: string }
 * Returns: { ok, of_account_id, chats, fans, earnings_amount, last_synced_at }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  let socialAccountId: string | null = null;
  let agencyId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const { of_account_id } = await req.json().catch(() => ({}));
    if (!of_account_id) return json({ error: "of_account_id required" }, 400);

    // Resolve the social-account row via RLS (caller must own this creator)
    const { data: account, error: accErr } = await supabase
      .from("creator_social_accounts")
      .select("id, creator_id, of_account_id, creators!inner(agency_id)")
      .eq("of_account_id", of_account_id)
      .ilike("platform", "onlyfans")
      .maybeSingle();

    if (accErr || !account) return json({ error: "OnlyFans account not found" }, 404);
    socialAccountId = account.id as string;
    agencyId = (account as any).creators.agency_id as string;
    const creatorId = account.creator_id as string;

    // 1) Chats ---------------------------------------------------------------
    let chatsSynced = 0;
    try {
      const resp = await ofGet<{ data: any[] }>(`/${of_account_id}/chats`, { limit: 100, offset: 0 });
      const chats = Array.isArray(resp?.data) ? resp.data : [];
      const rows = chats.map((c: any) => ({
        agency_id: agencyId!,
        creator_id: creatorId,
        of_account_id,
        of_chat_id: String(c.id ?? c.chat_id ?? c.withUser?.id),
        of_fan_id: String(c.withUser?.id ?? c.with_user?.id ?? ""),
        fan_name: c.withUser?.name ?? c.with_user?.name ?? null,
        fan_username: c.withUser?.username ?? c.with_user?.username ?? null,
        fan_avatar: c.withUser?.avatar ?? c.with_user?.avatar ?? null,
        last_message_text: c.lastMessage?.text ?? c.last_message?.text ?? null,
        last_message_at: c.lastMessage?.createdAt ?? c.last_message?.created_at ?? null,
        last_message_is_from_me:
          c.lastMessage?.fromUser?.id != null ? c.lastMessage.fromUser.id !== c.withUser?.id : null,
        unread_count: c.unreadMessagesCount ?? c.unread ?? 0,
        lifetime_spend: Number(c.withUser?.spendings?.total ?? 0),
        is_subscribed: Boolean(c.withUser?.isSubscribed ?? c.with_user?.isSubscribed),
        subscribed_until: c.withUser?.subscribedUntil ?? null,
        synced_at: new Date().toISOString(),
      }));
      if (rows.length) {
        const { error } = await supabase
          .from("of_chats")
          .upsert(rows, { onConflict: "of_account_id,of_chat_id" });
        if (error) throw error;
        chatsSynced = rows.length;
      }
    } catch (err) {
      console.error("[of-sync-account] chats sync failed", err);
    }

    // 2) Fans / subscribers --------------------------------------------------
    let fansSynced = 0;
    try {
      const resp = await ofGet<{ data: any[] }>(`/${of_account_id}/fans/active`, { limit: 100 });
      const fans = Array.isArray(resp?.data) ? resp.data : [];
      const rows = fans.map((f: any) => ({
        agency_id: agencyId!,
        creator_id: creatorId,
        of_account_id,
        of_fan_id: String(f.id ?? f.user_id),
        name: f.name ?? null,
        username: f.username ?? null,
        avatar_url: f.avatar ?? null,
        subscribed_at: f.subscribedAt ?? f.subscribed_at ?? null,
        expires_at: f.subscribedUntil ?? f.expires_at ?? null,
        total_spent: Number(f.spendings?.total ?? f.total_spent ?? 0),
        is_active: true,
        renew_on: Boolean(f.renewOn ?? f.renew_on),
        synced_at: new Date().toISOString(),
      }));
      if (rows.length) {
        const { error } = await supabase
          .from("of_fans")
          .upsert(rows, { onConflict: "of_account_id,of_fan_id" });
        if (error) throw error;
        fansSynced = rows.length;
      }
    } catch (err) {
      console.error("[of-sync-account] fans sync failed", err);
    }

    // 3) Earnings (current 30-day period) -----------------------------------
    let earningsAmount = 0;
    try {
      const resp = await ofGet<any>(`/${of_account_id}/payouts/stats`);
      const stats = resp?.data ?? resp ?? {};
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 30);

      const subscriptions = Number(stats?.subscriptions?.gross ?? stats?.subscriptions ?? 0);
      const tips = Number(stats?.tips?.gross ?? stats?.tips ?? 0);
      const messages = Number(stats?.messages?.gross ?? stats?.messages ?? 0);
      const referrals = Number(stats?.referrals?.gross ?? stats?.referrals ?? 0);
      const gross = Number(stats?.total?.gross ?? subscriptions + tips + messages + referrals);
      const net = Number(stats?.total?.net ?? gross * 0.8);
      earningsAmount = net;

      const periodStartStr = periodStart.toISOString().slice(0, 10);
      const periodEndStr = periodEnd.toISOString().slice(0, 10);

      // Upsert-by-key: delete same-period rows then insert fresh, to avoid duplicates
      await supabase
        .from("creator_earnings")
        .delete()
        .eq("creator_id", creatorId)
        .eq("period_start", periodStartStr)
        .eq("period_end", periodEndStr);

      const { error } = await supabase.from("creator_earnings").insert({
        creator_id: creatorId,
        amount: net,
        period_start: periodStartStr,
        period_end: periodEndStr,
        platform: "onlyfans",
        subscriptions,
        tips,
        messages_revenue: messages,
        referrals,
        notes: JSON.stringify({ source: "of-api", gross, raw: stats?.total ?? null }),
      });
      if (error) throw error;
    } catch (err) {
      console.error("[of-sync-account] earnings sync failed", err);
    }

    // 4) Update health pointers ---------------------------------------------
    const nowIso = new Date().toISOString();
    await supabase
      .from("creator_social_accounts")
      .update({
        of_last_synced_at: nowIso,
        of_connection_status: "healthy",
        of_last_error: null,
        of_last_error_at: null,
        of_sync_retry_count: 0,
      })
      .eq("id", socialAccountId);

    await supabase.from("of_sync_logs").insert({
      social_account_id: socialAccountId,
      agency_id: agencyId,
      sync_type: "manual",
      status: "success",
      items_synced: chatsSynced + fansSynced,
      duration_ms: Date.now() - started,
    });

    return json({
      ok: true,
      of_account_id,
      chats: chatsSynced,
      fans: fansSynced,
      earnings_amount: earningsAmount,
      last_synced_at: nowIso,
    });
  } catch (err: any) {
    console.error("of-sync-account fatal", err);
    if (socialAccountId && agencyId) {
      try {
        const sb = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await sb.from("of_sync_logs").insert({
          social_account_id: socialAccountId,
          agency_id: agencyId,
          sync_type: "manual",
          status: "failed",
          error_message: String(err?.message ?? err).slice(0, 1000),
          duration_ms: Date.now() - started,
        });
        await sb
          .from("creator_social_accounts")
          .update({
            of_connection_status: "error",
            of_last_error: String(err?.message ?? err).slice(0, 500),
            of_last_error_at: new Date().toISOString(),
          })
          .eq("id", socialAccountId);
      } catch { /* swallow */ }
    }
    return json({ error: err?.message ?? "sync failed" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}