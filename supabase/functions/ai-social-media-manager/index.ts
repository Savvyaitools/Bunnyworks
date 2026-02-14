import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action, topic, platform, creatorName, creatorNiche, creatorPersona, days } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_posts") {
      systemPrompt = "You are a social media marketing expert for OnlyFans creators. Generate engaging, platform-optimized posts that drive traffic and engagement. Always respond with valid JSON only.";
      userPrompt = `Generate 4 social media post ideas for ${creatorName} (niche: ${creatorNiche || "general"}, persona: ${creatorPersona || "flirty and engaging"}).
Topic/theme: ${topic}
Platform: ${platform}
Respond ONLY with JSON: {"posts": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string like '7 PM EST'", "contentType": "string like 'photo' or 'reel'"}]}`;
    } else if (action === "generate_calendar") {
      systemPrompt = "You are a content calendar strategist for OnlyFans creators. Create a structured weekly posting schedule. Always respond with valid JSON only.";
      userPrompt = `Create a ${days || 7}-day content calendar for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"calendar": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string", "contentType": "string"}]}`;
    } else if (action === "analyze_strategy") {
      systemPrompt = "You are a social media growth strategist for OnlyFans creators. Provide actionable, data-informed recommendations. Always respond with valid JSON only.";
      userPrompt = `Analyze and provide growth strategy insights for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"insights": [{"title": "string", "description": "string", "priority": "high|medium|low", "metric": "optional string"}]}`;
    } else {
      throw new Error("Invalid action");
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-media-manager error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
