import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function randomPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "") + "!Aa1";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anon = createClient(supabaseUrl, anonKey);
    const { data: { user: caller } } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin");
    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { approvalId, email, fullName, agencyName, password } = body ?? {};
    if (!email || !fullName || !agencyName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create the agency first
    const { data: agency, error: agencyErr } = await admin
      .from("agencies")
      .insert({ name: agencyName })
      .select("id")
      .single();
    if (agencyErr) throw agencyErr;

    const finalPassword = password || randomPassword();

    // Create the auth user. Trigger will create profile but with a NEW agency. We'll fix it.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: "agency",
        agency_id: agency.id,
      },
    });

    let userId = created?.user?.id;
    if (createErr) {
      // If exists, look up
      if (createErr.message?.toLowerCase().includes("already")) {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!found) {
          await admin.from("agencies").delete().eq("id", agency.id);
          throw new Error("User exists but cannot be located");
        }
        userId = found.id;
      } else {
        await admin.from("agencies").delete().eq("id", agency.id);
        throw createErr;
      }
    }

    // Ensure profile points to the intended agency (handle_new_user may have created a fresh agency for new signups)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, agency_id")
      .eq("id", userId!)
      .maybeSingle();

    if (existingProfile) {
      // If the trigger spawned a different agency for this user, delete the orphan after pointing the profile to ours
      const orphanAgencyId = existingProfile.agency_id && existingProfile.agency_id !== agency.id ? existingProfile.agency_id : null;
      await admin.from("profiles").update({
        agency_id: agency.id,
        user_type: "agency",
        full_name: fullName,
        email,
      }).eq("id", userId!);
      if (orphanAgencyId) {
        // Only delete if no other profiles use it
        const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("agency_id", orphanAgencyId);
        if ((count ?? 0) === 0) {
          await admin.from("agencies").delete().eq("id", orphanAgencyId);
        }
      }
    } else {
      await admin.from("profiles").insert({
        id: userId!,
        email,
        full_name: fullName,
        user_type: "agency",
        agency_id: agency.id,
      });
    }

    // Mark approval row provisioned
    if (approvalId) {
      await admin.from("agency_approvals").update({
        status: "provisioned",
        approved_by: caller.id,
        approved_at: new Date().toISOString(),
        created_user_id: userId,
        created_agency_id: agency.id,
      }).eq("id", approvalId);
    } else {
      await admin.from("agency_approvals").insert({
        email, full_name: fullName, agency_name: agencyName,
        status: "provisioned", approved_by: caller.id, approved_at: new Date().toISOString(),
        created_user_id: userId, created_agency_id: agency.id,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      agencyId: agency.id,
      email,
      tempPassword: finalPassword,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});