import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONLYFANS_API_BASE = "https://app.onlyfansapi.com/api";

// Permission check for employee actions
// deno-lint-ignore no-explicit-any
async function checkEmployeePermission(
  supabase: any,
  userId: string,
  accountId: string,
  requiredPermission: string
): Promise<{ allowed: boolean; employeeId?: string; creatorId?: string; agencyId?: string }> {
  // First check if user is an employee
  const { data: employee } = await supabase
    .from("employees")
    .select("id, agency_id")
    .eq("auth_user_id", userId)
    .single();

  if (!employee) {
    // User is not an employee - might be agency admin, allow all
    return { allowed: true };
  }

  // Find the creator linked to this OF account
  const { data: socialAccount } = await supabase
    .from("creator_social_accounts")
    .select("creator_id")
    .eq("of_account_id", accountId)
    .single();

  if (!socialAccount) {
    console.log("No social account found for OF account:", accountId);
    return { allowed: false };
  }

  // Check if employee has permission for this creator
  const { data: permission } = await supabase
    .from("employee_of_permissions")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("creator_id", socialAccount.creator_id)
    .single();

  if (!permission) {
    console.log("No permission record found for employee:", employee.id);
    return { allowed: false, employeeId: employee.id };
  }

  // Check specific permission
  const allowed = permission[requiredPermission] === true;
  return { 
    allowed, 
    employeeId: employee.id, 
    creatorId: socialAccount.creator_id,
    agencyId: employee.agency_id
  };
}

// Log employee activity
// deno-lint-ignore no-explicit-any
async function logActivity(
  supabase: any,
  params: {
    agencyId: string;
    employeeId: string;
    creatorId: string;
    ofAccountId: string;
    action: string;
    details?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("employee_of_activity_logs").insert({
      agency_id: params.agencyId,
      employee_id: params.employeeId,
      creator_id: params.creatorId,
      of_account_id: params.ofAccountId,
      action: params.action,
      details: params.details || {},
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

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

    const userId = claimsData.claims.sub as string;

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

    // Map action to required permission
    const permissionMap: Record<string, string> = {
      "list-chats": "can_view_chats",
      "get-chat-messages": "can_view_chats",
      "send-message": "can_send_messages",
      "send-mass-message": "can_send_mass_messages",
      "list-active-fans": "can_view_fans",
      "list-expired-fans": "can_view_fans",
      "get-fan-details": "can_view_fans",
      "list-posts": "can_view_posts",
      "create-post": "can_create_posts",
      "list-vault-media": "can_view_vault",
      "list-queue": "can_view_posts",
      "get-earnings": "can_view_earnings",
      "list-transactions": "can_view_earnings",
      "get-notifications": "can_view_notifications",
    };

    // Check permission for protected actions
    if (accountId && permissionMap[action]) {
      const permCheck = await checkEmployeePermission(supabase, userId, accountId, permissionMap[action]);
      if (!permCheck.allowed) {
        console.log(`Permission denied for action: ${action}`);
        return new Response(
          JSON.stringify({ error: "Permission denied for this action" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Log activity if employee
      if (permCheck.employeeId && permCheck.creatorId && permCheck.agencyId) {
        await logActivity(supabase, {
          agencyId: permCheck.agencyId,
          employeeId: permCheck.employeeId,
          creatorId: permCheck.creatorId,
          ofAccountId: accountId,
          action: action,
          details: { params },
        });
      }
    }

    switch (action) {
      case "authenticate": {
        endpoint = "/authenticate";
        method = "POST";
        body = {
          email: params.email,
          password: params.password,
          ...(params.code && { code: params.code }),
          ...(params.force_connect && { force_connect: true }),
        };
        
        // Make initial auth request
        const authUrl = `${ONLYFANS_API_BASE}${endpoint}`;
        console.log(`Calling OnlyFans API: POST ${authUrl}`);
        
        const authResponse = await fetch(authUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        
        const authData = await authResponse.json();
        console.log("Initial auth response:", authData);
        
        if (!authResponse.ok) {
          // Handle duplicate account
          if (authData.error === "duplicate_account" && authData.existing_account) {
            console.log("Duplicate account detected, returning existing account info");
            return new Response(
              JSON.stringify({ 
                duplicate_account: true,
                existing_account: authData.existing_account,
                account_id: authData.existing_account.id,
                message: authData.message
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ error: authData.message || authData.error || "Authentication failed" }),
            { status: authResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // If we get a polling URL, poll for result
        if (authData.polling_url) {
          console.log("Polling for auth result...");
          
          // Poll up to 30 times (30 seconds)
          for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const pollResponse = await fetch(authData.polling_url, {
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });
            
            const pollData = await pollResponse.json();
            console.log(`Poll attempt ${i + 1}:`, pollData);
            
            if (pollData.status === "completed" || pollData.account_id) {
              return new Response(
                JSON.stringify({ account_id: pollData.account_id || pollData.id }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            if (pollData.status === "requires_2fa" || pollData.requires_2fa) {
              return new Response(
                JSON.stringify({ requires_2fa: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            if (pollData.status === "failed" || pollData.error) {
              // Check for duplicate account in poll response
              if (pollData.error === "duplicate_account" && pollData.existing_account) {
                return new Response(
                  JSON.stringify({ 
                    duplicate_account: true,
                    existing_account: pollData.existing_account,
                    account_id: pollData.existing_account.id,
                  }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              
              return new Response(
                JSON.stringify({ error: pollData.message || pollData.error || "Authentication failed" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
          
          return new Response(
            JSON.stringify({ error: "Authentication timeout" }),
            { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Direct response with account_id
        if (authData.account_id || authData.id) {
          return new Response(
            JSON.stringify({ account_id: authData.account_id || authData.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify(authData),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

      // ========== NEW CHAT ENDPOINTS ==========
      case "list-chats": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const chatParams = new URLSearchParams();
        if (params.limit) chatParams.set("limit", params.limit.toString());
        if (params.offset) chatParams.set("offset", params.offset.toString());
        endpoint = `/${accountId}/chats${chatParams.toString() ? "?" + chatParams.toString() : ""}`;
        break;
      }

      case "get-chat-messages": {
        if (!accountId || !params.chatId) {
          return new Response(
            JSON.stringify({ error: "accountId and chatId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const msgParams = new URLSearchParams();
        if (params.limit) msgParams.set("limit", params.limit.toString());
        if (params.offset) msgParams.set("offset", params.offset.toString());
        endpoint = `/${accountId}/chats/${params.chatId}/messages${msgParams.toString() ? "?" + msgParams.toString() : ""}`;
        break;
      }

      case "send-message": {
        if (!accountId || !params.chatId) {
          return new Response(
            JSON.stringify({ error: "accountId and chatId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}/chats/${params.chatId}/messages`;
        method = "POST";
        body = {
          text: params.text || "",
          ...(params.mediaIds && { media_ids: params.mediaIds }),
          ...(params.price && { price: params.price }),
        };
        break;
      }

      case "send-mass-message": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}/mass-messages`;
        method = "POST";
        body = {
          text: params.text || "",
          ...(params.mediaIds && { media_ids: params.mediaIds }),
          ...(params.price && { price: params.price }),
          ...(params.targetType && { target_type: params.targetType }),
        };
        break;
      }

      // ========== NEW FAN ENDPOINTS ==========
      case "list-active-fans": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const activeFanParams = new URLSearchParams();
        if (params.limit) activeFanParams.set("limit", params.limit.toString());
        if (params.offset) activeFanParams.set("offset", params.offset.toString());
        if (params.search) activeFanParams.set("search", params.search);
        endpoint = `/${accountId}/fans/active${activeFanParams.toString() ? "?" + activeFanParams.toString() : ""}`;
        break;
      }

      case "list-expired-fans": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const expiredFanParams = new URLSearchParams();
        if (params.limit) expiredFanParams.set("limit", params.limit.toString());
        if (params.offset) expiredFanParams.set("offset", params.offset.toString());
        endpoint = `/${accountId}/fans/expired${expiredFanParams.toString() ? "?" + expiredFanParams.toString() : ""}`;
        break;
      }

      case "get-fan-details": {
        if (!accountId || !params.fanId) {
          return new Response(
            JSON.stringify({ error: "accountId and fanId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}/fans/${params.fanId}`;
        break;
      }

      // ========== NEW POST/CONTENT ENDPOINTS ==========
      case "list-posts": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const postParams = new URLSearchParams();
        if (params.limit) postParams.set("limit", params.limit.toString());
        if (params.offset) postParams.set("offset", params.offset.toString());
        endpoint = `/${accountId}/posts${postParams.toString() ? "?" + postParams.toString() : ""}`;
        break;
      }

      case "create-post": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}/posts`;
        method = "POST";
        body = {
          text: params.text || "",
          ...(params.mediaIds && { media_ids: params.mediaIds }),
          ...(params.price && { price: params.price }),
          ...(params.scheduledAt && { scheduled_at: params.scheduledAt }),
        };
        break;
      }

      case "list-vault-media": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const vaultParams = new URLSearchParams();
        if (params.limit) vaultParams.set("limit", params.limit.toString());
        if (params.offset) vaultParams.set("offset", params.offset.toString());
        if (params.type) vaultParams.set("type", params.type);
        endpoint = `/${accountId}/vault${vaultParams.toString() ? "?" + vaultParams.toString() : ""}`;
        break;
      }

      case "list-queue": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/${accountId}/queue`;
        break;
      }

      // ========== NOTIFICATIONS ==========
      case "get-notifications": {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "accountId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const notifParams = new URLSearchParams();
        if (params.limit) notifParams.set("limit", params.limit.toString());
        endpoint = `/${accountId}/notifications${notifParams.toString() ? "?" + notifParams.toString() : ""}`;
        break;
      }

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
