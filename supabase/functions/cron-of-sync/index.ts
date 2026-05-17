import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { syncOfAccount } from "../_shared/of-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Hourly cron worker. For every connected OF account whose last sync is older
 * than the agency's `of_sync_frequency_hours` setting, run the full sync.
 *
 * Uses the service role so RLS is bypassed. Public-callable but does no work
 * for callers without the cron schedule's apikey (no side effects beyond DB).
 * Caps work per run to avoid runaway invocations.
 */
const MAX_PER_RUN = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1) Pull all connected OF accounts with their agency frequency
  const { data: accounts, error } = await sb
    .from("creator_social_accounts")
    .select(
      "id, creator_id, of_account_id, of_last_synced_at, creators!inner(agency_id, agencies!inner(of_sync_frequency_hours))",
    )
    .ilike("platform", "onlyfans")
    .not("of_account_id", "is", null);

  if (error) {
    console.error("[cron-of-sync] query failed", error);
    return json({ error: error.message }, 500);
  }

  const now = Date.now();
  const due = (accounts ?? []).filter((a: any) => {
    const freq = Number(a.creators?.agencies?.of_sync_frequency_hours ?? 24);
    if (freq <= 0) return false; // 0 = disabled
    if (!a.of_last_synced_at) return true;
    const ageHrs = (now - new Date(a.of_last_synced_at).getTime()) / 36e5;
    return ageHrs >= freq;
  }).slice(0, MAX_PER_RUN);

  console.log(`[cron-of-sync] ${accounts?.length ?? 0} connected · ${due.length} due`);

  let ok = 0;
  let failed = 0;
  for (const a of due) {
    const res = await syncOfAccount(sb, {
      id: a.id,
      creator_id: a.creator_id,
      of_account_id: a.of_account_id,
      agency_id: (a as any).creators.agency_id,
    }, "scheduled");
    if (res.ok) ok++;
    else failed++;
  }

  return json({
    ok: true,
    total_connected: accounts?.length ?? 0,
    due: due.length,
    synced: ok,
    failed,
    duration_ms: Date.now() - started,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}