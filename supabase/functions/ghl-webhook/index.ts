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
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    console.log("GHL webhook received:", JSON.stringify(payload));

    const eventType = payload.type || payload.event;
    const contactId = payload.contact_id || payload.contactId;
    const orderId = payload.order_id || payload.orderId;
    const subscriptionId = payload.subscription_id || payload.subscriptionId;
    const amount = payload.amount || payload.total_amount || 0;

    if (!contactId) {
      console.warn("No contact ID in webhook payload");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find agency by GHL contact ID
    const { data: agency } = await adminClient
      .from("agencies")
      .select("id, subscription_tier")
      .eq("ghl_contact_id", contactId)
      .maybeSingle();

    if (!agency) {
      console.warn("No agency found for GHL contact:", contactId);
      return new Response(JSON.stringify({ received: true, warning: "agency not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine tier from amount (in cents)
    const amountNum = Number(amount);
    let tier = agency.subscription_tier;
    if (amountNum >= 24900) tier = "pro";
    else if (amountNum >= 12900) tier = "scale";
    else if (amountNum >= 6900) tier = "core";

    // Map max creators/employees from tier
    const tierLimits: Record<string, { maxCreators: number; maxEmployees: number }> = {
      core: { maxCreators: 1, maxEmployees: 5 },
      scale: { maxCreators: 2, maxEmployees: 10 },
      pro: { maxCreators: 4, maxEmployees: 15 },
      enterprise: { maxCreators: 9999, maxEmployees: 9999 },
    };

    const limits = tierLimits[tier] || tierLimits.core;

    // Handle different event types
    if (
      eventType === "payment_received" ||
      eventType === "order.completed" ||
      eventType === "subscription.created" ||
      eventType === "InvoicePaymentReceived"
    ) {
      await adminClient
        .from("agencies")
        .update({
          subscription_status: "active",
          subscription_tier: tier,
          subscription_started_at: new Date().toISOString(),
          max_creators: limits.maxCreators,
          max_employees: limits.maxEmployees,
        })
        .eq("id", agency.id);

      await adminClient.from("payment_events").insert({
        agency_id: agency.id,
        event_type: eventType,
        ghl_order_id: orderId,
        ghl_subscription_id: subscriptionId,
        amount: amountNum,
        status: "completed",
        metadata: payload,
      });

      console.log(`Agency ${agency.id} upgraded to ${tier}`);
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "payment_failed" ||
      eventType === "SubscriptionCancelled"
    ) {
      await adminClient
        .from("agencies")
        .update({
          subscription_status: eventType.includes("cancel") ? "cancelled" : "past_due",
          subscription_ends_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", agency.id);

      await adminClient.from("payment_events").insert({
        agency_id: agency.id,
        event_type: eventType,
        ghl_subscription_id: subscriptionId,
        amount: amountNum,
        status: eventType.includes("cancel") ? "cancelled" : "failed",
        metadata: payload,
      });

      console.log(`Agency ${agency.id} subscription ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true, agency_id: agency.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GHL webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
