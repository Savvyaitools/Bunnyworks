import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APIFY_BASE = "https://api.apify.com/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY_API_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "APIFY_API_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { actorId, input, maxItems, timeoutSecs } = await req.json();

    if (!actorId) {
      return new Response(
        JSON.stringify({ success: false, error: "actorId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Running Apify actor: ${actorId}`);

    // Start actor run and wait for it to finish (synchronous call)
    const runRes = await fetch(
      `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}&timeout=${timeoutSecs || 120}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input || {}),
      }
    );

    if (!runRes.ok) {
      const errText = await runRes.text();
      console.error(`Apify error [${runRes.status}]:`, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Apify actor failed: ${runRes.status}`, details: errText }),
        { status: runRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let items = await runRes.json();

    // Limit items if requested
    if (maxItems && Array.isArray(items)) {
      items = items.slice(0, maxItems);
    }

    console.log(`Actor ${actorId} returned ${Array.isArray(items) ? items.length : 0} items`);

    return new Response(
      JSON.stringify({ success: true, data: items }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("apify-actor error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
