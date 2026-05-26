import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofGet } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Body: { chat_id: string, months?: number }  (uuid of of_chats row)
 * Pulls messages for the chat from OnlyFansAPI back to `months` ago
 * (default 6 months) by paginating with skip/limit, and upserts into
 * of_messages. Hard caps: 60 pages × 100 = 6000 messages per chat per call
 * to keep the function within edge timeout budgets.
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

    const { chat_id, months = 6, force = false, mode } = await req.json();
    if (!chat_id) return json({ error: "chat_id required" }, 400);

    const { data: chat, error: chatErr } = await supabase
      .from("of_chats")
      .select("id, agency_id, of_account_id, of_chat_id, of_fan_id, synced_at")
      .eq("id", chat_id)
      .maybeSingle();

    if (chatErr || !chat) return json({ error: "Chat not found" }, 404);

    // Skip noisy resyncs: if synced in the last 2 minutes and not forced, no-op.
    if (!force) {
      const lastSync = chat.synced_at ? new Date(chat.synced_at).getTime() : 0;
      if (Date.now() - lastSync < 2 * 60 * 1000) {
        return json({ ok: true, synced: 0, skipped: true, reason: "fresh" });
      }
    }

    // Incremental mode: only pull new messages since the latest stored one.
    // Full mode: 6-month backfill (default for first sync / explicit force).
    const isFirstSync = !chat.synced_at;
    const effectiveMode = mode ?? (isFirstSync || force ? "full" : "incremental");

    let knownNewestMs = 0;
    if (effectiveMode === "incremental") {
      const { data: newest } = await supabase
        .from("of_messages")
        .select("created_at")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      knownNewestMs = newest?.created_at ? new Date(newest.created_at).getTime() : 0;
    }

    const PAGE_SIZE = 100;
    const MAX_PAGES = effectiveMode === "incremental" ? 5 : 60; // 6,000 msg cap on full sync
    const monthsBack = Math.max(1, Math.min(Number(months) || 6, 24));
    const cutoffMs = Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000;

    const allRows: any[] = [];
    let pages = 0;
    let reachedCutoff = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const apiResp = await ofGet<{ data: any[] }>(
        `/${chat.of_account_id}/chats/${chat.of_chat_id}/messages`,
        { limit: PAGE_SIZE, skip: page * PAGE_SIZE, skip_users: "none", order: "desc" },
      );
      const msgs = Array.isArray(apiResp?.data) ? apiResp.data : [];
      pages++;
      if (msgs.length === 0) break;

      for (const m of msgs) {
        const createdAt = m.createdAt ?? m.created_at ?? new Date().toISOString();
        const createdMs = new Date(createdAt).getTime();
        if (createdMs < cutoffMs) {
          reachedCutoff = true;
          continue; // skip — older than window
        }
        if (effectiveMode === "incremental" && createdMs <= knownNewestMs) {
          reachedCutoff = true;
          continue; // already have it
        }
        allRows.push({
          agency_id: chat.agency_id,
          chat_id: chat.id,
          of_message_id: String(m.id),
          direction: typeof m.isSentByMe === "boolean"
            ? (m.isSentByMe ? "out" : "in")
            : m.fromUser?.id && String(m.fromUser.id) === chat.of_fan_id ? "in" : "out",
          body: stripHtml(m.text ?? m.message ?? ""),
          price: Number(m.price ?? 0),
          is_ppv: Boolean(m.price && Number(m.price) > 0),
          is_unlocked: Boolean(m.isOpened ?? m.is_opened ?? false),
          media: Array.isArray(m.media) ? m.media : [],
          status: "sent",
          created_at: createdAt,
          read_at: m.isOpened ? (m.changedAt ?? null) : null,
        });
      }

      // Stop if this page already crossed the cutoff or returned a short page.
      if (reachedCutoff || msgs.length < PAGE_SIZE) break;
    }

    // Upsert in chunks of 500 to stay friendly with PostgREST payload limits.
    let synced = 0;
    for (let i = 0; i < allRows.length; i += 500) {
      const chunk = allRows.slice(i, i + 500);
      const { error: upErr } = await supabase
        .from("of_messages")
        .upsert(chunk, { onConflict: "chat_id,of_message_id" });
      if (upErr) throw upErr;
      synced += chunk.length;
    }

    // Stamp synced_at so subsequent opens skip / go incremental.
    await supabase
      .from("of_chats")
      .update({ synced_at: new Date().toISOString() })
      .eq("id", chat.id);

    return json({ ok: true, synced, pages, months: monthsBack, mode: effectiveMode });
  } catch (err: any) {
    console.error("of-list-messages error", err);
    return json({ error: err.message ?? "Unknown error" }, 500);
  }
});

function stripHtml(value: unknown) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, "").trim() : value ?? "";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
