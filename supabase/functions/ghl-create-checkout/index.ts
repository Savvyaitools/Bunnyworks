import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GHL_API_BASE = "https://services.leadconnectorhq.com";

const TIER_PRICES: Record<string, { name: string; amount: number }> = {
  core: { name: "Core Plan", amount: 6900 },
  scale: { name: "Scale Plan", amount: 12900 },
  pro: { name: "Pro Plan", amount: 24900 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GHL_API_KEY = Deno.env.get("GHL_API_KEY");
    if (!GHL_API_KEY) {
      throw new Error("GHL_API_KEY is not configured");
    }

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

    // Verify calling user
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile and agency
    const { data: profile } = await callerClient
      .from("profiles")
      .select("agency_id, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile?.agency_id) {
      return new Response(JSON.stringify({ error: "No agency found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tier } = await req.json();
    const tierConfig = TIER_PRICES[tier];
    if (!tierConfig) {
      return new Response(JSON.stringify({ error: "Invalid tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get or create GHL contact
    const { data: agency } = await adminClient
      .from("agencies")
      .select("id, ghl_contact_id, ghl_location_id, name")
      .eq("id", profile.agency_id)
      .single();

    let ghlContactId = agency?.ghl_contact_id;

    if (!ghlContactId) {
      // Search for existing contact first
      const searchRes = await fetch(
        `${GHL_API_BASE}/contacts/search/duplicate?email=${encodeURIComponent(user.email!)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
        }
      );

      const searchData = await searchRes.json();
      
      if (searchData.contact?.id) {
        ghlContactId = searchData.contact.id;
      } else {
        // Create new contact in GHL
        const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
          body: JSON.stringify({
            email: user.email,
            name: profile.full_name || agency?.name || "Agency Owner",
            tags: ["creator-os", `tier-${tier}`],
            customFields: [
              { key: "agency_id", value: profile.agency_id },
            ],
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          console.error("GHL create contact error:", createData);
          throw new Error(`Failed to create GHL contact: ${JSON.stringify(createData)}`);
        }
        ghlContactId = createData.contact?.id;
      }

      // Store GHL contact ID
      if (ghlContactId) {
        await adminClient
          .from("agencies")
          .update({ ghl_contact_id: ghlContactId })
          .eq("id", profile.agency_id);
      }
    }

    // Log the payment event
    await adminClient.from("payment_events").insert({
      agency_id: profile.agency_id,
      event_type: "checkout_initiated",
      status: "pending",
      amount: tierConfig.amount,
      metadata: {
        tier,
        ghl_contact_id: ghlContactId,
        user_email: user.email,
      },
    });

    // Return checkout info - GHL handles Stripe checkout via its hosted pages
    // The frontend will redirect to the GHL payment link
    return new Response(
      JSON.stringify({
        success: true,
        contactId: ghlContactId,
        tier,
        amount: tierConfig.amount,
        message: "Contact synced to GHL. Redirecting to checkout.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("GHL checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
