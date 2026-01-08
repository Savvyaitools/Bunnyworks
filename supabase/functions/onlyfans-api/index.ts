import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONLYFANS_API_BASE = "https://app.onlyfansapi.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ONLYFANS_API_KEY");
    if (!apiKey) {
      console.error("ONLYFANS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "OnlyFans API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, accountId, ...params } = await req.json();
    console.log(`OnlyFans API action: ${action}, accountId: ${accountId}`);

    let endpoint = "";
    let method = "GET";
    let body: Record<string, unknown> | null = null;

    switch (action) {
      case "authenticate":
        endpoint = "/authenticate";
        method = "POST";
        body = {
          email: params.email,
          password: params.password,
          ...(params.code && { code: params.code }),
          ...(params.force_connect && { force_connect: true }),
        };
        break;

      case "get-earnings":
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}/payouts/earning-statistics`;
        break;

      case "list-transactions":
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const txParams = new URLSearchParams();
        if (params.limit) txParams.set("limit", params.limit.toString());
        if (params.offset) txParams.set("offset", params.offset.toString());
        endpoint = `/${accountId}/payouts/transactions${txParams.toString() ? "?" + txParams.toString() : ""}`;
        break;

      case "list-fans":
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const fanParams = new URLSearchParams();
        if (params.limit) fanParams.set("limit", params.limit.toString());
        if (params.offset) fanParams.set("offset", params.offset.toString());
        endpoint = `/${accountId}/fans${fanParams.toString() ? "?" + fanParams.toString() : ""}`;
        break;

      case "get-account-info":
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}`;
        break;

      case "list-accounts":
        endpoint = "/accounts";
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const url = `${ONLYFANS_API_BASE}${endpoint}`;
    console.log(`Calling OnlyFans API: ${method} ${url}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    
    console.log(`OnlyFans API response status: ${response.status}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      console.error("OnlyFans API error:", responseData);
      
      // Handle duplicate account specially - return 200 with duplicate info
      if (responseData.error === "duplicate_account" && responseData.existing_account) {
        console.log("Duplicate account detected, returning existing account info");
        return new Response(
          JSON.stringify({ 
            duplicate_account: true,
            existing_account: responseData.existing_account,
            message: responseData.message
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: responseData.message || responseData.error || "API request failed",
          details: responseData 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
