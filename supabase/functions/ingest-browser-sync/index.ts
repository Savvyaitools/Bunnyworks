import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-token",
};

interface BrowserSyncPayload {
  creator_id: string;
  platform: string;
  metrics: {
    earnings?: number;
    subscribers?: number;
    tips?: number;
    [key: string]: any;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get sync token from header
    const syncToken = req.headers.get("x-sync-token");
    
    if (!syncToken) {
      console.error("Missing sync token in request");
      return new Response(
        JSON.stringify({ error: "Missing sync token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload: BrowserSyncPayload = await req.json();
    console.log("Received browser sync payload:", JSON.stringify(payload));

    // Validate required fields
    if (!payload.creator_id || !payload.platform || !payload.metrics) {
      console.error("Invalid payload structure:", payload);
      return new Response(
        JSON.stringify({ error: "Invalid payload: creator_id, platform, and metrics are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for token validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token and check expiration
    console.log("Validating sync token...");
    const { data: tokenData, error: tokenError } = await supabase
      .from("browser_sync_tokens")
      .select("id, agency_id, expires_at, used_at")
      .eq("token", syncToken)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token validation failed:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired sync token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      console.error("Token expired at:", tokenData.expires_at);
      return new Response(
        JSON.stringify({ error: "Sync token has expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify creator belongs to the agency
    console.log("Verifying creator belongs to agency:", tokenData.agency_id);
    const { data: creatorData, error: creatorError } = await supabase
      .from("creators")
      .select("id, name, agency_id")
      .eq("id", payload.creator_id)
      .eq("agency_id", tokenData.agency_id)
      .single();

    if (creatorError || !creatorData) {
      console.error("Creator verification failed:", creatorError);
      return new Response(
        JSON.stringify({ error: "Creator not found or does not belong to your agency" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if browser sync is enabled for this agency
    const { data: agencyData, error: agencyError } = await supabase
      .from("agencies")
      .select("browser_sync_enabled")
      .eq("id", tokenData.agency_id)
      .single();

    if (agencyError || !agencyData?.browser_sync_enabled) {
      console.error("Browser sync not enabled for agency");
      return new Response(
        JSON.stringify({ error: "Browser sync is not enabled for this agency" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert data import record
    console.log("Creating data import record for creator:", creatorData.name);
    const { data: importData, error: importError } = await supabase
      .from("data_imports")
      .insert({
        agency_id: tokenData.agency_id,
        creator_id: payload.creator_id,
        file_name: `browser-sync-${payload.platform}-${new Date().toISOString()}`,
        file_path: "browser-sync",
        source: "chrome_extension",
        raw_payload: payload,
        status: "pending_review",
        confidence_score: 100, // Direct from extension, no OCR needed
      })
      .select()
      .single();

    if (importError) {
      console.error("Failed to create import record:", importError);
      return new Response(
        JSON.stringify({ error: "Failed to save sync data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as used (but don't invalidate - can be used multiple times until expiry)
    await supabase
      .from("browser_sync_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    console.log("Browser sync successful. Import ID:", importData.id);

    return new Response(
      JSON.stringify({
        success: true,
        import_id: importData.id,
        message: "Data synced successfully",
        creator: creatorData.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Browser sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
