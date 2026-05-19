import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ofGet, ofPost, ofPut } from "../_shared/of-api-client.ts";

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
 *     mode: "email_password" | "lookup",
 *     // for email_password (initial submit)
 *     email?: string,
 *     password?: string,
 *     // for email_password (2FA continuation)
 *     attempt_id?: string,
 *     two_fa_code?: string,
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
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

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

    if (mode === "email_password") {
      const { email, password, attempt_id, two_fa_code } = body;

      // Step 1: start auth if no attempt yet
      let activeAttempt: string | undefined = attempt_id;
      if (!activeAttempt) {
        if (!email || !password) return json({ error: "email and password required" }, 400);
        const start = await ofPost<any>(`/authenticate`, { email, password });
        activeAttempt = start?.attempt_id ?? start?.data?.attempt_id;
        if (!activeAttempt) return json({ error: "Auth provider did not return attempt id" }, 502);
      }

      // Step 2: if 2FA code supplied, submit it
      if (two_fa_code) {
        await ofPut<any>(`/authenticate/${activeAttempt}`, { code: two_fa_code });
      }

      // Step 3: poll for completion
      const result = await pollAuth(activeAttempt);
      if (result.status === "needs_otp") {
        return json({ ok: false, two_fa_required: true, attempt_id: activeAttempt });
      }
      if (result.status === "needs_face_otp") {
        return json({
          ok: false,
          face_verification_required: true,
          attempt_id: activeAttempt,
          face_otp_verification_url: result.faceUrl,
        });
      }
      if (result.status === "failed") {
        return json({ ok: false, error: result.error ?? "Authentication failed" }, 400);
      }
      ofAccountId = result.accountId;
      ofUsername = result.username;
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

type PollResult =
  | { status: "completed"; accountId: string; username: string | null }
  | { status: "needs_otp" }
  | { status: "needs_face_otp"; faceUrl?: string }
  | { status: "failed"; error?: string };

async function pollAuth(attemptId: string): Promise<PollResult> {
  // Poll up to ~25s (15 * 1.7s) — edge function timeout is well above this.
  const max = 15;
  for (let i = 0; i < max; i++) {
    const resp = await ofGet<any>(`/authenticate/${attemptId}`);
    const d = resp?.data ?? resp ?? {};
    const state = d.state;
    const last = d.lastAttempt ?? {};

    if (state === "needs-otp" || state === "needs-app-otp") {
      return { status: "needs_otp" };
    }
    if (last?.needs_face_otp) {
      return { status: "needs_face_otp", faceUrl: last?.face_otp_verification_url };
    }
    if (d.completed_at) {
      if (last?.success === false) {
        return { status: "failed", error: last?.error_message ?? last?.error_code };
      }
      const acc = d.account ?? last?.account ?? {};
      const id = String(d.account_id ?? acc.id ?? acc.account_id ?? "");
      const username = acc.username ?? acc.user?.username ?? d.username ?? null;
      if (!id) return { status: "failed", error: "Auth completed but no account id returned" };
      return { status: "completed", accountId: id, username };
    }
    await new Promise((r) => setTimeout(r, 1700));
  }
  return { status: "failed", error: "Authentication timed out" };
}