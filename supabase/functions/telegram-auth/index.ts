import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function verifyTelegramHash(
  payload: Record<string, string>,
  botToken: string
): Promise<boolean> {
  // Build data_check_string: sorted key=value pairs (excluding hash), joined by \n
  const checkString = Object.keys(payload)
    .filter((k) => k !== "hash")
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join("\n");

  // secret_key = SHA256(bot_token)
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(botToken)
  );

  // computed_hash = HMAC-SHA256(data_check_string, secret_key)
  const key = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(checkString)
  );

  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHash === payload.hash;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash } =
      body;

    if (!id || !hash || !auth_date) {
      return new Response(
        JSON.stringify({ error: "Missing required Telegram fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check auth_date staleness (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(auth_date) > 300) {
      return new Response(
        JSON.stringify({ error: "Telegram auth data expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build payload for verification
    const payload: Record<string, string> = {};
    if (id) payload.id = String(id);
    if (first_name) payload.first_name = first_name;
    if (last_name) payload.last_name = last_name;
    if (username) payload.username = username;
    if (photo_url) payload.photo_url = photo_url;
    if (auth_date) payload.auth_date = String(auth_date);
    payload.hash = hash;

    const valid = await verifyTelegramHash(payload, botToken);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram hash" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramId = Number(id);
    const email = `tg_${telegramId}@telegram.user`;
    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || username || `Telegram User ${telegramId}`;

    // Check if user exists by telegram_id
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Check if user exists by email (edge case)
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find((u) => u.email === email);

      if (existingUser) {
        userId = existingUser.id;
        // Patch telegram_id
        await supabase
          .from("profiles")
          .update({ telegram_id: telegramId })
          .eq("id", userId);
      } else {
        // Create new user
        isNewUser = true;
        const randomPass = crypto.randomUUID() + crypto.randomUUID();
        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email,
            password: randomPass,
            email_confirm: true,
            user_metadata: {
              full_name: displayName,
              user_type: "agency",
            },
          });

        if (createError || !newUser?.user) {
          throw new Error(createError?.message || "Failed to create user");
        }

        userId = newUser.user.id;

        // Update profile with telegram_id (trigger creates profile)
        // Small delay to let trigger fire
        await new Promise((r) => setTimeout(r, 500));
        await supabase
          .from("profiles")
          .update({
            telegram_id: telegramId,
            avatar_url: photo_url || null,
          })
          .eq("id", userId);
      }
    }

    // Generate session tokens using a cryptographically random password
    // that won't trigger pwned-password checks
    const randomBytes = new Uint8Array(48);
    crypto.getRandomValues(randomBytes);
    const tempPass = btoa(String.fromCharCode(...randomBytes)) + "!Aa1";

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: tempPass });
    if (updateError) {
      console.error("Password update error:", updateError);
      throw new Error("Failed to prepare session: " + updateError.message);
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: session, error: signInError } =
      await anonClient.auth.signInWithPassword({ email, password: tempPass });

    if (signInError || !session?.session) {
      console.error("Sign-in error:", signInError);
      throw new Error(signInError?.message || "Failed to create session");
    }

    return new Response(
      JSON.stringify({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("telegram-auth error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
