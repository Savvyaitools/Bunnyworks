import { ofGet } from "./of-api-client.ts";

export interface SyncAccountInput {
  id: string;            // creator_social_accounts.id
  creator_id: string;
  of_account_id: string;
  agency_id: string;
}

export interface SyncAccountResult {
  ok: boolean;
  chats: number;
  fans: number;
  earnings_amount: number;
  last_synced_at: string;
  error?: string;
}

/**
 * Runs a full sync (chats / fans / earnings) for a single connected OF account
 * using whatever supabase client is passed in (user-scoped or service-role).
 * Updates health pointers on success / failure and writes an of_sync_logs row.
 */
export async function syncOfAccount(
  supabase: any,
  account: SyncAccountInput,
  syncType: "manual" | "scheduled" = "manual",
): Promise<SyncAccountResult> {
  const started = Date.now();
  const { id: socialAccountId, creator_id: creatorId, of_account_id, agency_id: agencyId } = account;

  try {
    // 1) Chats
    let chatsSynced = 0;
    try {
      const resp = await ofGet<{ data: any[] }>(`/${of_account_id}/chats`, { limit: 100, offset: 0 });
      const chats = Array.isArray(resp?.data) ? resp.data : [];
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
        last_message_is_from_me:
          c.lastMessage?.fromUser?.id != null ? c.lastMessage.fromUser.id !== c.withUser?.id : null,
        unread_count: c.unreadMessagesCount ?? c.unread ?? 0,
        lifetime_spend: Number(c.withUser?.spendings?.total ?? 0),
        is_subscribed: Boolean(c.withUser?.isSubscribed ?? c.with_user?.isSubscribed),
        subscribed_until: c.withUser?.subscribedUntil ?? null,
        synced_at: new Date().toISOString(),
      }));
      const dedupedChats = Array.from(
        new Map(rows.map((r: any) => [`${r.of_account_id}::${r.of_chat_id}`, r])).values()
      );
      if (dedupedChats.length) {
        const { error } = await supabase
          .from("of_chats")
          .upsert(dedupedChats, { onConflict: "of_account_id,of_chat_id" });
        if (error) throw error;
        chatsSynced = dedupedChats.length;
      }
    } catch (err) {
      console.error("[of-sync] chats failed", of_account_id, err);
    }

    // 2) Fans
    let fansSynced = 0;
    try {
      const resp = await ofGet<{ data: any[] }>(`/${of_account_id}/fans/active`, { limit: 100 });
      const fans = Array.isArray(resp?.data) ? resp.data : [];
      const rows = fans.map((f: any) => ({
        agency_id: agencyId,
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
      const dedupedFans = Array.from(
        new Map(rows.map((r: any) => [`${r.of_account_id}::${r.of_fan_id}`, r])).values()
      );
      if (dedupedFans.length) {
        const { error } = await supabase
          .from("of_fans")
          .upsert(dedupedFans, { onConflict: "of_account_id,of_fan_id" });
        if (error) throw error;
        fansSynced = dedupedFans.length;
      }
    } catch (err) {
      console.error("[of-sync] fans failed", of_account_id, err);
    }

    // 3) Earnings (last 30 days)
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
      console.error("[of-sync] earnings failed", of_account_id, err);
    }

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
      sync_type: syncType,
      status: "success",
      items_synced: chatsSynced + fansSynced,
      duration_ms: Date.now() - started,
    });

    return {
      ok: true,
      chats: chatsSynced,
      fans: fansSynced,
      earnings_amount: earningsAmount,
      last_synced_at: nowIso,
    };
  } catch (err: any) {
    const msg = String(err?.message ?? err).slice(0, 500);
    try {
      await supabase.from("of_sync_logs").insert({
        social_account_id: socialAccountId,
        agency_id: agencyId,
        sync_type: syncType,
        status: "failed",
        error_message: msg.slice(0, 1000),
        duration_ms: Date.now() - started,
      });
      await supabase
        .from("creator_social_accounts")
        .update({
          of_connection_status: "error",
          of_last_error: msg,
          of_last_error_at: new Date().toISOString(),
        })
        .eq("id", socialAccountId);
    } catch { /* swallow */ }
    return {
      ok: false,
      chats: 0,
      fans: 0,
      earnings_amount: 0,
      last_synced_at: new Date().toISOString(),
      error: msg,
    };
  }
}