import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofGet, ofPost } from "../_shared/of-api-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Connects an OnlyFans account via OnlyFansAPI.com.
 *
 * Body:
 *   {
 *     creator_id: string (uuid),
 *     mode: "email_password" | "raw_data" | "lookup",
 *     // for email_password
 *     email?: string,
 *     password?: string,
 *     two_fa_code?: string,
 *     // for raw_data
 *     raw_data?: Record<string, unknown>,
 *     // for lookup (already-authenticated account_id)
 *     of_account_id?: string,
 *   }
 *
 * Returns: { ok, of_account_id, of_username, status, two_fa_required? }
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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { creator_id, mode } = body ?? {};
    if (!creator_id || !mode) return json({ error: "creator_id and mode required" }, 400);

    // Verify caller has access to creator (RLS on creators table enforces agency scope)
    const { data: creator, error: creatorErr } = await supabase
      .from("creators")
      .select("id, agency_id, name")
      .eq("id", creator_id)
      .maybeSingle();
    if (creatorErr || !creator) return json({ error: "Creator not found" }, 404);

    let ofAccountId: string | null = null;
    let ofUsername: string | null = null;
    let twoFaRequired = false;

    if (mode === "email_password") {
      const { email, password, two_fa_code } = body;
      if (!email || !password) return json({ error: "email and password required" }, 400);
      const resp = await ofPost<any>(`/accounts`, {
        type: "email_password",
        email,
        password,
        two_fa_code: two_fa_code || undefined,
      });
      const data = resp?.data ?? resp;
      if (data?.requires_2fa || data?.status === "2fa_required") {
        return json({ ok: false, two_fa_required: true });
      }
      ofAccountId = String(data?.id ?? data?.account_id ?? "");
      ofUsername = data?.username ?? data?.user?.username ?? null;
    } else if (mode === "raw_data") {
      const { raw_data } = body;
      if (!raw_data) return json({ error: "raw_data required" }, 400);
      const resp = await ofPost<any>(`/accounts`, { type: "raw_data", raw_data });
      const data = resp?.data ?? resp;
      ofAccountId = String(data?.id ?? data?.account_id ?? "");
      ofUsername = data?.username ?? data?.user?.username ?? null;
    } else if (mode === "lookup") {
      const { of_account_id } = body;
      if (!of_account_id) return json({ error: "of_account_id required" }, 400);
      const resp = await ofGet<any>(`/${of_account_id}/me`);
      const data = resp?.data ?? resp;
      ofAccountId = String(of_account_id);
      ofUsername = data?.username ?? data?.user?.username ?? null;
    } else {
      return json({ error: "invalid mode" }, 400);
    }

    if (!ofAccountId) return json({ error: "OnlyFansAPI did not return an account id" }, 502);

    // Upsert the social account record so chat/sync functions can resolve it.
    const { error: upErr } = await supabase
      .from("creator_social_accounts")
      .upsert(
        {
          creator_id,
          platform: "onlyfans",
          username: ofUsername ?? "unknown",
          profile_url: ofUsername ? `https://onlyfans.com/${ofUsername}` : null,
          account_type: "creator_managed",
          of_account_id: ofAccountId,
          of_connected_at: new Date().toISOString(),
          of_connection_status: "connected",
          of_last_error: null,
          of_last_error_at: null,
        },
        { onConflict: "creator_id,platform" },
      );
    if (upErr) throw upErr;

    return json({
      ok: true,
      of_account_id: ofAccountId,
      of_username: ofUsername,
      status: "connected",
      two_fa_required: twoFaRequired,
    });
  } catch (err: any) {
    console.error("of-connect-account error", err);
    return json({ error: err.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}