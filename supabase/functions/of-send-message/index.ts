import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofPost } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Body: {
 *   chat_id: string (uuid of of_chats),
 *   text: string,
 *   price?: number,
 *   media_ids?: string[],
 *   lock_message?: boolean
 * }
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

    const { chat_id, text, price = 0, media_ids = [], lock_message } = await req.json();
    if (!chat_id || (!text && media_ids.length === 0)) {
      return json({ error: "chat_id and text or media required" }, 400);
    }
    if (typeof text === "string" && text.length > 4000) {
      return json({ error: "text too long" }, 400);
    }

    const { data: chat, error: chatErr } = await supabase
      .from("of_chats")
      .select("id, agency_id, of_account_id, of_fan_id")
      .eq("id", chat_id)
      .maybeSingle();
    if (chatErr || !chat) return json({ error: "Chat not found" }, 404);

    // Optimistic local insert
    const optimisticId = crypto.randomUUID();
    await supabase.from("of_messages").insert({
      id: optimisticId,
      agency_id: chat.agency_id,
      chat_id: chat.id,
      direction: "out",
      body: text ?? "",
      price,
      is_ppv: price > 0,
      sent_by_user_id: userData.user.id,
      status: "sending",
    });

    try {
      const apiResp = await ofPost<{ data: any }>(
        `/${chat.of_account_id}/chats/${chat.of_fan_id}/messages`,
        {
          text: text ?? "",
          price: price > 0 ? price : undefined,
          mediaFiles: media_ids,
          lockedText: lock_message ?? (price > 0),
        },
      );

      const m = apiResp?.data ?? {};
      await supabase
        .from("of_messages")
        .update({
          of_message_id: m.id ? String(m.id) : null,
          status: "sent",
          created_at: m.createdAt ?? m.created_at ?? new Date().toISOString(),
        })
        .eq("id", optimisticId);

      // Bump chat preview
      await supabase
        .from("of_chats")
        .update({
          last_message_text: text ?? "",
          last_message_at: new Date().toISOString(),
          last_message_is_from_me: true,
        })
        .eq("id", chat.id);

      return json({ ok: true, message_id: optimisticId });
    } catch (sendErr: any) {
      await supabase
        .from("of_messages")
        .update({ status: "failed" })
        .eq("id", optimisticId);
      throw sendErr;
    }
  } catch (err: any) {
    console.error("of-send-message error", err);
    return json({ error: err.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
