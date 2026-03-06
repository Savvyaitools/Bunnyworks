import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "action is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serverUrl = Deno.env.get("STAGEHAND_SERVER_URL");
    const apiKey = Deno.env.get("STAGEHAND_API_KEY");

    if (!serverUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Stagehand server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map actions to Stagehand server endpoints
    const endpointMap: Record<string, { path: string; method: string }> = {
      "scrape-earnings": { path: "/api/scrape-earnings", method: "POST" },
      "check-login": { path: "/api/check-login", method: "POST" },
      health: { path: "/health", method: "GET" },
    };

    const endpoint = endpointMap[action];
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to Stagehand server
    const url = `${serverUrl.replace(/\/$/, "")}${endpoint.path}`;
    const fetchOpts: RequestInit = {
      method: endpoint.method,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    };

    if (endpoint.method === "POST") {
      fetchOpts.body = JSON.stringify(params);
    }

    console.log(`[stagehand-proxy] ${action} → ${url}`);

    const resp = await fetch(url, fetchOpts);
    const data = await resp.json();

    // If scrape-earnings succeeded, upsert to creator_earnings
    if (action === "scrape-earnings" && data.success && data.earnings?.total > 0) {
      const svc = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const e = data.earnings;

      const { data: existing } = await svc
        .from("creator_earnings")
        .select("id")
        .eq("creator_id", params.creatorId)
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd)
        .maybeSingle();

      const payload = {
        creator_id: params.creatorId,
        amount: e.total,
        tips: e.tips || 0,
        subscriptions: e.subscriptions || 0,
        messages_revenue: e.messages || 0,
        referrals: e.referrals || 0,
        period_start: periodStart,
        period_end: periodEnd,
        platform: "onlyfans",
        notes: `Stagehand scrape on ${now.toISOString().split("T")[0]}`,
      };

      if (existing) {
        await svc.from("creator_earnings").update(payload).eq("id", existing.id);
      } else {
        await svc.from("creator_earnings").insert(payload);
      }

      console.log(`[stagehand-proxy] Upserted earnings $${e.total} for ${params.creatorId}`);
    }

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[stagehand-proxy] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
