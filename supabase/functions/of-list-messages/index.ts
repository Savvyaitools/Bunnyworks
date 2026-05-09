import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofGet } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Body: { chat_id: string }  (uuid of of_chats row)
 * Pulls last messages for the chat from OnlyFansAPI and upserts into of_messages.
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

    const { chat_id, limit = 50 } = await req.json();
    if (!chat_id) return json({ error: "chat_id required" }, 400);

    const { data: chat, error: chatErr } = await supabase
      .from("of_chats")
      .select("id, agency_id, of_account_id, of_chat_id, of_fan_id")
      .eq("id", chat_id)
      .maybeSingle();

    if (chatErr || !chat) return json({ error: "Chat not found" }, 404);

    const apiResp = await ofGet<{ data: any[] }>(
      `/${chat.of_account_id}/chats/${chat.of_chat_id}/messages`,
      { limit },
    );

    const msgs = Array.isArray(apiResp?.data) ? apiResp.data : [];
    const rows = msgs.map((m: any) => ({
      agency_id: chat.agency_id,
      chat_id: chat.id,
      of_message_id: String(m.id),
      direction: m.fromUser?.id && String(m.fromUser.id) === chat.of_fan_id ? "in" : "out",
      body: m.text ?? "",
      price: Number(m.price ?? 0),
      is_ppv: Boolean(m.price && Number(m.price) > 0),
      is_unlocked: Boolean(m.isOpened ?? m.is_opened ?? false),
      media: Array.isArray(m.media) ? m.media : [],
      status: "sent",
      created_at: m.createdAt ?? m.created_at ?? new Date().toISOString(),
      read_at: m.isOpened ? (m.changedAt ?? null) : null,
    }));

    if (rows.length) {
      const { error: upErr } = await supabase
        .from("of_messages")
        .upsert(rows, { onConflict: "chat_id,of_message_id" });
      if (upErr) throw upErr;
    }

    return json({ ok: true, synced: rows.length });
  } catch (err: any) {
    console.error("of-list-messages error", err);
    return json({ error: err.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
