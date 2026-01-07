import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-token",
};

interface SyncPayload {
  token: string;
  action: "validate" | "sync";
  data?: {
    screenshot?: string;
    url?: string;
    title?: string;
    platform?: string;
    timestamp?: string;
    creator_id?: string;
    metrics?: Record<string, any>;
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
    // Parse request body
    const payload: SyncPayload = await req.json();
    console.log("Received browser sync request, action:", payload.action);

    // Get token from body or header
    const syncToken = payload.token || req.headers.get("x-sync-token");
    
    if (!syncToken) {
      console.error("Missing sync token in request");
      return new Response(
        JSON.stringify({ error: "Missing sync token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "Invalid or expired sync token", valid: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      console.error("Token expired at:", tokenData.expires_at);
      return new Response(
        JSON.stringify({ error: "Sync token has expired", valid: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if browser sync is enabled for this agency
    const { data: agencyData, error: agencyError } = await supabase
      .from("agencies")
      .select("browser_sync_enabled, name")
      .eq("id", tokenData.agency_id)
      .single();

    if (agencyError || !agencyData?.browser_sync_enabled) {
      console.error("Browser sync not enabled for agency");
      return new Response(
        JSON.stringify({ error: "Browser sync is not enabled for this agency", valid: false }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle validate action - just check if token is valid
    if (payload.action === "validate") {
      console.log("Token validated successfully for agency:", agencyData.name);
      return new Response(
        JSON.stringify({
          valid: true,
          agency: agencyData.name,
          expires_at: tokenData.expires_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle sync action - save screenshot/data
    if (payload.action === "sync") {
      if (!payload.data) {
        return new Response(
          JSON.stringify({ error: "Missing sync data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { screenshot, url, title, platform, timestamp } = payload.data;
      
      // Generate a unique filename
      const fileName = `browser-sync-${platform || 'unknown'}-${Date.now()}.png`;
      
      // If screenshot is provided, upload to storage
      let filePath = "browser-sync";
      if (screenshot && screenshot.startsWith("data:image")) {
        try {
          // Convert base64 to blob
          const base64Data = screenshot.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Upload to storage
          const storagePath = `${tokenData.agency_id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("data-imports")
            .upload(storagePath, binaryData, {
              contentType: "image/png",
              upsert: false,
            });
          
          if (uploadError) {
            console.error("Failed to upload screenshot:", uploadError);
            // Continue anyway, just won't have the screenshot stored
          } else {
            filePath = storagePath;
            console.log("Screenshot uploaded to:", storagePath);
          }
        } catch (uploadErr) {
          console.error("Screenshot processing error:", uploadErr);
        }
      }

      // Create data import record
      console.log("Creating data import record for browser sync");
      const { data: importData, error: importError } = await supabase
        .from("data_imports")
        .insert({
          agency_id: tokenData.agency_id,
          file_name: fileName,
          file_path: filePath,
          source: "chrome_extension",
          raw_payload: {
            url,
            title,
            platform,
            timestamp,
            synced_at: new Date().toISOString(),
          },
          status: "pending",
          confidence_score: null, // Will be set after AI processing
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

      // Mark token as used
      await supabase
        .from("browser_sync_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      console.log("Browser sync successful. Import ID:", importData.id);

      return new Response(
        JSON.stringify({
          success: true,
          import_id: importData.id,
          message: "Data synced successfully. Check your import queue for processing.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Browser sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
