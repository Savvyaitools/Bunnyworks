import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofPost } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Audience =
  | { type: "all_active" }
  | { type: "subscribed" }
  | { type: "min_spend"; min_spend: number }
  | { type: "chat_ids"; chat_ids: string[] };

interface Body {
  of_account_id: string;
  text: string;
  price?: number;
  lock_message?: boolean;
  media_ids?: string[];
  audience: Audience;
  /** Max recipients hard cap (defense in depth). Default 500. */
  max_recipients?: number;
  /** Delay between sends in ms. Default 1500 to stay under rate limits. */
  send_interval_ms?: number;
}

/**
 * Mass-message / PPV blast across many chats on one OF account.
 * Resolves the audience from of_chats (RLS-scoped to the caller's agency),
 * sends sequentially with a small interval to respect OnlyFans rate limits,
 * writes each send into of_messages, and returns counts.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.of_account_id || !body.audience) return json({ error: "of_account_id and audience required" }, 400);
    if (!body.text && (!body.media_ids || body.media_ids.length === 0)) {
      return json({ error: "text or media required" }, 400);
    }
    if (typeof body.text === "string" && body.text.length > 4000) {
      return json({ error: "text too long" }, 400);
    }
    const price = Number(body.price ?? 0);
    if (price < 0 || price > 200) return json({ error: "price out of range (0-200)" }, 400);
    const maxRecipients = Math.min(Math.max(Number(body.max_recipients ?? 500), 1), 1000);
    const interval = Math.min(Math.max(Number(body.send_interval_ms ?? 1500), 500), 10000);

    // Resolve the OF account (RLS will filter by agency)
    const { data: account, error: accErr } = await supabase
      .from("creator_social_accounts")
      .select("id, creator_id, of_account_id, creators!inner(agency_id)")
      .eq("of_account_id", body.of_account_id)
      .ilike("platform", "onlyfans")
      .maybeSingle();
    if (accErr || !account) return json({ error: "OnlyFans account not found" }, 404);
    const agencyId = (account as any).creators.agency_id as string;

    // Build audience query
    let q = supabase
      .from("of_chats")
      .select("id, of_fan_id, fan_username, lifetime_spend, is_subscribed")
      .eq("of_account_id", body.of_account_id);

    const aud = body.audience;
    if (aud.type === "subscribed") q = q.eq("is_subscribed", true);
    if (aud.type === "min_spend") q = q.gte("lifetime_spend", Number(aud.min_spend) || 0);
    if (aud.type === "chat_ids") {
      const ids = Array.isArray(aud.chat_ids) ? aud.chat_ids.slice(0, maxRecipients) : [];
      if (ids.length === 0) return json({ error: "chat_ids must be non-empty" }, 400);
      q = q.in("id", ids);
    }
    q = q.limit(maxRecipients);

    const { data: targets, error: targetsErr } = await q;
    if (targetsErr) return json({ error: targetsErr.message }, 500);
    if (!targets || targets.length === 0) {
      return json({ ok: true, total: 0, sent: 0, failed: 0, message: "No recipients matched" });
    }

    const total = targets.length;
    let sent = 0;
    let failed = 0;
    const failures: Array<{ chat_id: string; error: string }> = [];

    // Create a campaign row for tracking (optional table; ignore if missing)
    let campaignId: string | null = null;
    try {
      const { data: campaign } = await supabase
        .from("of_mass_campaigns")
        .insert({
          agency_id: agencyId,
          of_account_id: body.of_account_id,
          created_by: userData.user.id,
          text: body.text,
          price,
          is_ppv: price > 0,
          audience_type: aud.type,
          audience_meta: aud,
          total_recipients: total,
          status: "running",
        })
        .select("id")
        .maybeSingle();
      campaignId = campaign?.id ?? null;
    } catch { /* table optional */ }

    for (const t of targets) {
      try {
        const apiResp = await ofPost<{ data: any }>(
          `/${body.of_account_id}/chats/${t.of_fan_id}/messages`,
          {
            text: body.text ?? "",
            price: price > 0 ? price : undefined,
            mediaFiles: body.media_ids ?? [],
            lockedText: body.lock_message ?? (price > 0),
          },
        );
        const m = apiResp?.data ?? {};

        await supabase.from("of_messages").insert({
          agency_id: agencyId,
          chat_id: t.id,
          direction: "out",
          body: body.text ?? "",
          price,
          is_ppv: price > 0,
          sent_by_user_id: userData.user.id,
          status: "sent",
          of_message_id: m.id ? String(m.id) : null,
          campaign_id: campaignId,
        });

        await supabase
          .from("of_chats")
          .update({
            last_message_text: body.text ?? "",
            last_message_at: new Date().toISOString(),
            last_message_is_from_me: true,
          })
          .eq("id", t.id);

        sent++;
      } catch (err: any) {
        failed++;
        const msg = String(err?.message ?? err).slice(0, 500);
        failures.push({ chat_id: t.id, error: msg });
        try {
          await supabase.from("of_messages").insert({
            agency_id: agencyId,
            chat_id: t.id,
            direction: "out",
            body: body.text ?? "",
            price,
            is_ppv: price > 0,
            sent_by_user_id: userData.user.id,
            status: "failed",
            error_message: msg,
            campaign_id: campaignId,
          });
        } catch { /* swallow */ }
      }

      // pace
      if (interval > 0) await new Promise((r) => setTimeout(r, interval));
    }

    if (campaignId) {
      await supabase
        .from("of_mass_campaigns")
        .update({
          status: failed === total ? "failed" : failed > 0 ? "partial" : "completed",
          sent_count: sent,
          failed_count: failed,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    }

    return json({ ok: true, total, sent, failed, campaign_id: campaignId, failures: failures.slice(0, 10) });
  } catch (err: any) {
    console.error("of-mass-message error", err);
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}