import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the webhook signature for verification
    const signature = req.headers.get("x-webhook-signature");
    console.log("Received webhook with signature:", signature ? "present" : "missing");

    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    // Extract event data
    const { 
      event_type, 
      account_id: ofAccountId, 
      data 
    } = payload;

    if (!event_type || !ofAccountId) {
      return new Response(
        JSON.stringify({ error: "Missing event_type or account_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for webhook processing
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the creator and agency linked to this OF account
    const { data: socialAccount } = await supabase
      .from("creator_social_accounts")
      .select("creator_id")
      .eq("of_account_id", ofAccountId)
      .single();

    if (!socialAccount) {
      console.log("No social account found for OF account:", ofAccountId);
      return new Response(
        JSON.stringify({ error: "Account not found", received: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get creator's agency_id
    const { data: creator } = await supabase
      .from("creators")
      .select("agency_id")
      .eq("id", socialAccount.creator_id)
      .single();

    if (!creator?.agency_id) {
      console.log("Creator or agency not found for creator:", socialAccount.creator_id);
      return new Response(
        JSON.stringify({ error: "Creator not found", received: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agencyId = creator.agency_id;
    const creatorId = socialAccount.creator_id;

    // Store the event
    const { error: insertError } = await supabase
      .from("onlyfans_events")
      .insert({
        agency_id: agencyId,
        of_account_id: ofAccountId,
        creator_id: creatorId,
        event_type,
        payload: data || {},
      });

    if (insertError) {
      console.error("Failed to insert event:", insertError);
    }

    // Process specific event types
    switch (event_type) {
      case "new_subscription":
        console.log("New subscription event:", data);
        // Could update creator stats, send notification, etc.
        break;

      case "subscription_expired":
        console.log("Subscription expired event:", data);
        break;

      case "tip_received":
        console.log("Tip received event:", data);
        break;

      case "new_message":
        console.log("New message event:", data);
        break;

      case "purchase":
        console.log("Purchase event:", data);
        // Update tracking link revenue if applicable
        if (data?.tracking_code) {
          await supabase
            .from("tracking_links")
            .update({
              revenue: supabase.rpc("increment_revenue", { amount: data.amount || 0 }),
              conversions: supabase.rpc("increment_conversions"),
            })
            .eq("code", data.tracking_code)
            .eq("agency_id", agencyId);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    return new Response(
      JSON.stringify({ success: true, event_type, processed: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
