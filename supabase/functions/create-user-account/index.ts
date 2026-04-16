import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user's token
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user: callerUser }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = callerUser.id;

    // Use admin client to bypass RLS for profile lookup + user creation
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfiles } = await adminClient
      .from("profiles")
      .select("user_type, agency_id")
      .eq("id", callerId)
      .limit(1);

    const callerProfile = callerProfiles?.[0] ?? null;

    if (!callerProfile || callerProfile.user_type !== "agency") {
      return new Response(JSON.stringify({ error: "Only agency owners can create accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, fullName, userType, agencyId } = await req.json();

    if (!email || !password || !fullName || !userType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetAgencyId = agencyId || callerProfile.agency_id;
    if (targetAgencyId !== callerProfile.agency_id) {
      return new Response(JSON.stringify({ error: "Agency mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: userType,
        agency_id: targetAgencyId,
      },
    });

    if (createError) {
      // If user already exists, look them up by email and return their ID
      if (createError.message?.includes("already") && createError.message?.includes("registered")) {
        const { data: listData } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1,
          filter: email,
        });
        const existingUser = listData?.users?.[0];
        if (existingUser) {
          return new Response(
            JSON.stringify({ user: { id: existingUser.id, email: existingUser.email }, existing: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ user: { id: newUser.user.id, email: newUser.user.email } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
