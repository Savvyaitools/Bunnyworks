import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HYPERBEAM_API_URL = "https://engine.hyperbeam.com/v0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HYPERBEAM_API_KEY = Deno.env.get("HYPERBEAM_API_KEY");
    if (!HYPERBEAM_API_KEY) {
      throw new Error("HYPERBEAM_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { action, ...params } = await req.json();

    console.log(`Hyperbeam action: ${action} by user: ${userId}`);

    switch (action) {
      case "create_admin_session":
        return await createAdminSession(supabase, HYPERBEAM_API_KEY, userId, params);
      case "save_profile":
        return await saveProfile(supabase, HYPERBEAM_API_KEY, params);
      case "launch_chatter_session":
        return await launchChatterSession(supabase, HYPERBEAM_API_KEY, userId, params);
      case "terminate_session":
        return await terminateSession(supabase, HYPERBEAM_API_KEY, params);
      case "get_session_status":
        return await getSessionStatus(supabase, HYPERBEAM_API_KEY, params);
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in hyperbeam-session:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Create admin session for initial OnlyFans login
async function createAdminSession(supabase: any, apiKey: string, userId: string, params: any) {
  let { creatorId, platform, agencyId, session_link_id } = params;

  // If session_link_id is provided, look up the session link to get creatorId, platform, agencyId
  if (session_link_id) {
    const { data: sessionLink, error: linkError } = await supabase
      .from("creator_session_links")
      .select("creator_id, platform, agency_id")
      .eq("id", session_link_id)
      .single();

    if (linkError || !sessionLink) {
      console.error("Failed to find session link:", linkError);
      return new Response(JSON.stringify({ error: "Session link not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    creatorId = sessionLink.creator_id;
    platform = sessionLink.platform;
    agencyId = sessionLink.agency_id;
  }

  if (!creatorId || !platform || !agencyId) {
    return new Response(JSON.stringify({ error: "creatorId, platform, and agencyId are required (or provide session_link_id)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startUrl = platform === "onlyfans" 
    ? "https://onlyfans.com" 
    : "https://fansly.com";

  console.log(`Creating Hyperbeam admin session for creator ${creatorId} on ${platform}`);

  // Create Hyperbeam session with profile persistence
  const hbResponse = await fetch(`${HYPERBEAM_API_URL}/vm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start_url: startUrl,
      profile: { save: true },
      kiosk: false,
      ublock: true,
      width: 1280,
      height: 800,
      timeout: {
        absolute: 3600,
        inactive: 600,
        warning: 60,
      },
    }),
  });

  if (!hbResponse.ok) {
    const errorText = await hbResponse.text();
    console.error("Hyperbeam API error:", errorText);

    // Return 200 so the client can display the real error message (Supabase client hides bodies for non-2xx)
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Hyperbeam API rejected VM creation. " +
          (errorText.includes("err_api_restricted")
            ? "Your Hyperbeam account has a restricted feature enabled in this request. Please contact Hyperbeam to enable it on your account (the API returned err_api_restricted)."
            : errorText),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const hbData = await hbResponse.json();
  console.log("Hyperbeam session created:", hbData.session_id);

  // Check if session link already exists
  const { data: existingLink } = await supabase
    .from("creator_session_links")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .single();

  let sessionLink;
  
  if (existingLink) {
    // Update existing
    const { data, error } = await supabase
      .from("creator_session_links")
      .update({
        hyperbeam_session_id: hbData.session_id,
        hyperbeam_admin_token: hbData.admin_token,
        session_status: "authenticating",
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingLink.id)
      .select()
      .single();
    
    if (error) {
      console.error("Database update error:", error);
      throw new Error("Failed to update session link");
    }
    sessionLink = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("creator_session_links")
      .insert({
        creator_id: creatorId,
        agency_id: agencyId,
        platform,
        created_by: userId,
        encrypted_session: "hyperbeam",
        hyperbeam_session_id: hbData.session_id,
        hyperbeam_admin_token: hbData.admin_token,
        session_status: "authenticating",
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      throw new Error("Failed to save session link");
    }
    sessionLink = data;
  }

  // Track active session
  await supabase.from("active_browser_sessions").insert({
    session_link_id: sessionLink.id,
    agency_id: agencyId,
    hyperbeam_session_id: hbData.session_id,
    embed_url: hbData.embed_url,
    admin_token: hbData.admin_token,
    session_type: "admin",
  });

  return new Response(JSON.stringify({
    success: true,
    sessionLinkId: sessionLink.id,
    embedUrl: hbData.embed_url,
    sessionId: hbData.session_id,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Save profile after admin has logged in
async function saveProfile(supabase: any, apiKey: string, params: any) {
  // Accept both camelCase and snake_case params
  const sessionLinkId = params.sessionLinkId || params.session_link_id;
  let hyperbeamSessionId = params.hyperbeamSessionId || params.hyperbeam_session_id;

  if (!sessionLinkId) {
    return new Response(JSON.stringify({ error: "sessionLinkId or session_link_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // If hyperbeamSessionId not provided, look it up from the session link
  if (!hyperbeamSessionId) {
    const { data: sessionLink, error } = await supabase
      .from("creator_session_links")
      .select("hyperbeam_session_id")
      .eq("id", sessionLinkId)
      .single();

    if (error || !sessionLink?.hyperbeam_session_id) {
      return new Response(JSON.stringify({ error: "No active Hyperbeam session found for this session link" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    hyperbeamSessionId = sessionLink.hyperbeam_session_id;
  }

  console.log(`Saving profile for session ${hyperbeamSessionId}`);

  // Get the profile ID from Hyperbeam
  const hbResponse = await fetch(`${HYPERBEAM_API_URL}/vm/${hyperbeamSessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!hbResponse.ok) {
    const errorText = await hbResponse.text();
    console.error("Failed to get session info:", errorText);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Hyperbeam API rejected fetching VM details. " +
          (errorText.includes("err_api_restricted")
            ? "Your Hyperbeam account has a restricted feature enabled. Please contact Hyperbeam to enable it (err_api_restricted)."
            : errorText),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const hbData = await hbResponse.json();
  const profileId = hbData.profile_id;

  console.log("Retrieved profile ID:", profileId);

  if (!profileId) {
    throw new Error("No profile ID available. Session may not have profile saving enabled.");
  }

  // Update session link with profile ID
  const { error: dbError } = await supabase
    .from("creator_session_links")
    .update({
      hyperbeam_profile_id: profileId,
      session_status: "authenticated",
      last_saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionLinkId);

  if (dbError) {
    console.error("Database error:", dbError);
    throw new Error("Failed to save profile ID");
  }

  // Terminate the admin session (profile is saved)
  await fetch(`${HYPERBEAM_API_URL}/vm/${hyperbeamSessionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  // Mark active session as ended
  await supabase
    .from("active_browser_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("hyperbeam_session_id", hyperbeamSessionId);

  return new Response(JSON.stringify({
    success: true,
    profileId,
    message: "Profile saved successfully. Session can now be used by chatters.",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Launch session for chatter with saved profile
async function launchChatterSession(supabase: any, apiKey: string, userId: string, params: any) {
  const { sessionLinkId, chatterId } = params;

  if (!sessionLinkId || !chatterId) {
    return new Response(JSON.stringify({ error: "sessionLinkId and chatterId are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Launching chatter session for ${chatterId} on session ${sessionLinkId}`);

  // Verify chatter is assigned to this session
  const { data: assignment, error: assignError } = await supabase
    .from("session_link_assignments")
    .select("*, session_link:creator_session_links(*)")
    .eq("session_link_id", sessionLinkId)
    .eq("chatter_id", chatterId)
    .single();

  if (assignError || !assignment) {
    console.error("Assignment check failed:", assignError);
    return new Response(JSON.stringify({ error: "Not authorized for this session" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sessionLink = assignment.session_link;

  // Check session is valid
  if (!sessionLink.is_active) {
    return new Response(JSON.stringify({ error: "Session has been revoked" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (new Date(sessionLink.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Session has expired" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!sessionLink.hyperbeam_profile_id) {
    return new Response(JSON.stringify({ error: "Session not authenticated yet" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startUrl = sessionLink.platform === "onlyfans" 
    ? "https://onlyfans.com/my/chats" 
    : "https://fansly.com/messages";

  // Create Hyperbeam session with saved profile
  const hbResponse = await fetch(`${HYPERBEAM_API_URL}/vm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start_url: startUrl,
      profile: { load: sessionLink.hyperbeam_profile_id },
      kiosk: true,
      ublock: true,
      width: 1920,
      height: 1080,
      timeout: {
        absolute: 28800,
        inactive: 1800,
        warning: 300,
      },
    }),
  });

  if (!hbResponse.ok) {
    const errorText = await hbResponse.text();
    console.error("Hyperbeam API error:", errorText);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Hyperbeam API rejected VM creation for chatter session. " +
          (errorText.includes("err_api_restricted")
            ? "Your Hyperbeam account has a restricted feature enabled in this request. Please contact Hyperbeam to enable it (err_api_restricted)."
            : errorText),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const hbData = await hbResponse.json();
  console.log("Chatter session created:", hbData.session_id);

  // Track active session
  await supabase.from("active_browser_sessions").insert({
    session_link_id: sessionLinkId,
    chatter_id: chatterId,
    agency_id: sessionLink.agency_id,
    hyperbeam_session_id: hbData.session_id,
    embed_url: hbData.embed_url,
    session_type: "chatter",
  });

  // Update assignment access count
  await supabase
    .from("session_link_assignments")
    .update({
      accessed_at: new Date().toISOString(),
      access_count: (assignment.access_count || 0) + 1,
    })
    .eq("id", assignment.id);

  // Log access
  await supabase.from("session_access_logs").insert({
    session_link_id: sessionLinkId,
    chatter_id: chatterId,
    action: "launch",
  });

  return new Response(JSON.stringify({
    success: true,
    embedUrl: hbData.embed_url,
    sessionId: hbData.session_id,
    platform: sessionLink.platform,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Terminate an active session
async function terminateSession(supabase: any, apiKey: string, params: any) {
  // Accept both camelCase and snake_case params
  const sessionLinkId = params.sessionLinkId || params.session_link_id;
  let hyperbeamSessionId = params.hyperbeamSessionId || params.hyperbeam_session_id;
  const activeSessionId = params.activeSessionId || params.active_session_id;

  // If hyperbeamSessionId not provided but sessionLinkId is, look it up
  if (!hyperbeamSessionId && sessionLinkId) {
    const { data: sessionLink } = await supabase
      .from("creator_session_links")
      .select("hyperbeam_session_id")
      .eq("id", sessionLinkId)
      .single();

    hyperbeamSessionId = sessionLink?.hyperbeam_session_id;
  }

  if (!hyperbeamSessionId) {
    return new Response(JSON.stringify({ error: "hyperbeamSessionId or session_link_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Terminating session ${hyperbeamSessionId}`);

  // Terminate in Hyperbeam
  const deleteResponse = await fetch(`${HYPERBEAM_API_URL}/vm/${hyperbeamSessionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!deleteResponse.ok) {
    console.log("Session may already be terminated");
  }

  // Update database
  if (activeSessionId) {
    await supabase
      .from("active_browser_sessions")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", activeSessionId);
  } else {
    await supabase
      .from("active_browser_sessions")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("hyperbeam_session_id", hyperbeamSessionId);
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Session terminated",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Get session status
async function getSessionStatus(supabase: any, apiKey: string, params: any) {
  // Accept both camelCase and snake_case params
  const sessionLinkId = params.sessionLinkId || params.session_link_id;
  let hyperbeamSessionId = params.hyperbeamSessionId || params.hyperbeam_session_id;

  // If hyperbeamSessionId not provided but sessionLinkId is, look it up
  if (!hyperbeamSessionId && sessionLinkId) {
    const { data: sessionLink } = await supabase
      .from("creator_session_links")
      .select("hyperbeam_session_id")
      .eq("id", sessionLinkId)
      .single();

    hyperbeamSessionId = sessionLink?.hyperbeam_session_id;
  }

  if (!hyperbeamSessionId) {
    return new Response(JSON.stringify({ error: "hyperbeamSessionId or session_link_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hbResponse = await fetch(`${HYPERBEAM_API_URL}/vm/${hyperbeamSessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!hbResponse.ok) {
    return new Response(JSON.stringify({ 
      active: false, 
      error: "Session not found or expired" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hbData = await hbResponse.json();

  return new Response(JSON.stringify({
    active: true,
    profileId: hbData.profile_id,
    createdAt: hbData.created_at,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
