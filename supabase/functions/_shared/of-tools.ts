/**
 * Agency-scoped OnlyFans tool wrappers for AI agents.
 * Use the service-role supabase client; agencyId must be verified by the caller.
 */
import { ofPost } from "./of-api-client.ts";
import { syncOfAccount as runSync } from "./of-sync.ts";

export interface OfToolContext {
  supabase: any;
  agencyId: string;
}

/** Send a 1:1 DM (optionally PPV) to a fan on behalf of a creator. */
export async function toolSendMessage(
  ctx: OfToolContext,
  args: { chat_id: string; text: string; price?: number; lock_message?: boolean; media_ids?: string[]; sent_by_user_id?: string | null },
): Promise<{ ok: true; message_id: string } | { ok: false; error: string }> {
  const { supabase, agencyId } = ctx;
  const price = Number(args.price ?? 0);
  if (!args.chat_id || (!args.text && !(args.media_ids?.length))) return { ok: false, error: "chat_id and text/media required" };
  if (args.text && args.text.length > 4000) return { ok: false, error: "text too long" };
  if (price < 0 || price > 200) return { ok: false, error: "price out of range" };

  const { data: chat, error } = await supabase
    .from("of_chats")
    .select("id, agency_id, of_account_id, of_fan_id")
    .eq("id", args.chat_id)
    .maybeSingle();
  if (error || !chat) return { ok: false, error: "chat not found" };
  if (chat.agency_id !== agencyId) return { ok: false, error: "forbidden: chat not in agency" };

  const optimisticId = crypto.randomUUID();
  await supabase.from("of_messages").insert({
    id: optimisticId,
    agency_id: agencyId,
    chat_id: chat.id,
    direction: "out",
    body: args.text ?? "",
    price,
    is_ppv: price > 0,
    sent_by_user_id: args.sent_by_user_id ?? null,
    status: "sending",
  });

  try {
    const resp = await ofPost<{ data: any }>(
      `/${chat.of_account_id}/chats/${chat.of_fan_id}/messages`,
      {
        text: args.text ?? "",
        price: price > 0 ? price : undefined,
        mediaFiles: args.media_ids ?? [],
        lockedText: args.lock_message ?? (price > 0),
      },
    );
    const m = resp?.data ?? {};
    await supabase.from("of_messages").update({
      of_message_id: m.id ? String(m.id) : null,
      status: "sent",
      created_at: m.createdAt ?? m.created_at ?? new Date().toISOString(),
    }).eq("id", optimisticId);
    await supabase.from("of_chats").update({
      last_message_text: args.text ?? "",
      last_message_at: new Date().toISOString(),
      last_message_is_from_me: true,
    }).eq("id", chat.id);
    return { ok: true, message_id: optimisticId };
  } catch (e: any) {
    await supabase.from("of_messages").update({ status: "failed" }).eq("id", optimisticId);
    return { ok: false, error: e?.message ?? "send failed" };
  }
}

/** Trigger a full sync of an OF account (chats / fans / earnings). */
export async function toolSyncAccount(
  ctx: OfToolContext,
  args: { of_account_id: string },
): Promise<{ ok: true; result: any } | { ok: false; error: string }> {
  const { supabase, agencyId } = ctx;
  if (!args.of_account_id) return { ok: false, error: "of_account_id required" };
  const { data: acc } = await supabase
    .from("creator_social_accounts")
    .select("id, creator_id, of_account_id, creators!inner(agency_id)")
    .eq("of_account_id", args.of_account_id)
    .ilike("platform", "onlyfans")
    .maybeSingle();
  if (!acc || (acc as any).creators?.agency_id !== agencyId) {
    return { ok: false, error: "of account not in agency" };
  }
  try {
    const result = await runSync(supabase, {
      id: (acc as any).id,
      creator_id: (acc as any).creator_id,
      of_account_id: (acc as any).of_account_id,
      agency_id: agencyId,
    }, "manual");
    return { ok: true, result };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "sync failed" };
  }
}

/** Trigger mass message via the dedicated edge function (re-uses its logic & limits). */
export async function toolMassMessage(
  ctx: OfToolContext,
  authHeader: string,
  args: {
    of_account_id: string;
    text: string;
    price?: number;
    lock_message?: boolean;
    media_ids?: string[];
    audience: any;
    max_recipients?: number;
    send_interval_ms?: number;
  },
): Promise<{ ok: true; result: any } | { ok: false; error: string }> {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/of-mass-message`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify(args),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: body?.error ?? `mass-message ${r.status}` };
    return { ok: true, result: body };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "mass-message failed" };
  }
}
