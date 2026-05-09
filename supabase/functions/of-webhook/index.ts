import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Public OnlyFansAPI webhook receiver.
 * - Verifies HMAC against ONLYFANSAPI_WEBHOOK_SECRET
 * - Logs raw event to of_webhook_events
 * - For chat events, upserts into of_messages / of_chats
 */
const ENC = new TextEncoder();

async function verifyHmac(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENC.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Constant-time-ish compare
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const sig = req.headers.get("x-onlyfansapi-signature") ?? req.headers.get("x-signature");
  const secret = Deno.env.get("ONLYFANSAPI_WEBHOOK_SECRET");

  let signatureValid = false;
  if (secret) {
    signatureValid = await verifyHmac(rawBody, sig, secret);
  }

  let payload: any = null;
  try { payload = JSON.parse(rawBody); } catch { /* ignore */ }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const eventType = payload?.event ?? payload?.type ?? "unknown";
  const ofAccountId = payload?.account_id ?? payload?.data?.account_id ?? null;

  await supabase.from("of_webhook_events").insert({
    event_type: eventType,
    of_account_id: ofAccountId,
    payload: payload ?? { raw: rawBody.slice(0, 4000) },
    signature_valid: signatureValid,
    processed_at: signatureValid ? new Date().toISOString() : null,
    error_message: signatureValid ? null : "Invalid or missing signature",
  });

  if (!signatureValid) return new Response("invalid signature", { status: 401 });

  // Route chat / message events into of_messages + of_chats
  try {
    if (eventType === "messages.received" || eventType === "messages.sent") {
      const m = payload.data ?? {};
      const ofChatId = String(m.chatId ?? m.chat_id ?? m.fromUser?.id ?? "");
      if (ofAccountId && ofChatId) {
        const { data: chat } = await supabase
          .from("of_chats")
          .select("id, agency_id")
          .eq("of_account_id", ofAccountId)
          .eq("of_chat_id", ofChatId)
          .maybeSingle();

        if (chat) {
          await supabase
            .from("of_messages")
            .upsert({
              agency_id: chat.agency_id,
              chat_id: chat.id,
              of_message_id: String(m.id),
              direction: eventType === "messages.received" ? "in" : "out",
              body: m.text ?? "",
              price: Number(m.price ?? 0),
              is_ppv: Boolean(m.price && Number(m.price) > 0),
              is_unlocked: Boolean(m.isOpened ?? false),
              media: Array.isArray(m.media) ? m.media : [],
              status: "sent",
              created_at: m.createdAt ?? new Date().toISOString(),
            }, { onConflict: "chat_id,of_message_id" });

          await supabase
            .from("of_chats")
            .update({
              last_message_text: m.text ?? "",
              last_message_at: m.createdAt ?? new Date().toISOString(),
              last_message_is_from_me: eventType === "messages.sent",
              unread_count: eventType === "messages.received"
                ? (chat as any).unread_count + 1 || 1
                : 0,
            })
            .eq("id", chat.id);
        }
      }
    }
  } catch (err) {
    console.error("of-webhook routing error", err);
  }

  return new Response("ok", { status: 200 });
});
