import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { syncOfAccount } from "../_shared/of-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Master sync for a connected OnlyFans account.
 * Body: { of_account_id: string }   (caller must own the creator)
 * Returns: { ok, of_account_id, chats, fans, earnings_amount, last_synced_at }
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

    const { of_account_id } = await req.json().catch(() => ({}));
    if (!of_account_id) return json({ error: "of_account_id required" }, 400);

    const { data: account, error: accErr } = await supabase
      .from("creator_social_accounts")
      .select("id, creator_id, of_account_id, creators!inner(agency_id)")
      .eq("of_account_id", of_account_id)
      .ilike("platform", "onlyfans")
      .maybeSingle();

    if (accErr || !account) return json({ error: "OnlyFans account not found" }, 404);

    const result = await syncOfAccount(supabase, {
      id: account.id as string,
      creator_id: account.creator_id as string,
      of_account_id,
      agency_id: (account as any).creators.agency_id as string,
    }, "manual");

    return json({ of_account_id, ...result }, result.ok ? 200 : 500);
  } catch (err: any) {
    console.error("of-sync-account fatal", err);
    return json({ error: err?.message ?? "sync failed" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}