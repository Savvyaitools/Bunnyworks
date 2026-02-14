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

    const { action, fanMessage, creatorName, creatorPersona, creatorBoundaries, confidenceThreshold } = await req.json();

    if (action !== "generate_reply") throw new Error("Invalid action");

    const systemPrompt = `You are an AI assistant that helps OnlyFans chatters respond to fan messages. You roleplay AS the creator.

Creator: ${creatorName}
Persona: ${creatorPersona || "Flirty, warm, and engaging"}
Boundaries: ${creatorBoundaries || "No personal info sharing, no meeting in person, no underage content"}

RULES:
1. Stay in character as the creator at all times
2. Never share personal info (real name, phone, address, social media handles)
3. Be flirty and engaging but respect boundaries
4. For simple greetings/compliments, respond warmly (high confidence)
5. For purchase/tip thank-yous, respond enthusiastically (high confidence)
6. For custom requests, suggest pricing discussion but flag for review (medium confidence)
7. For boundary violations or inappropriate requests, deflect politely (low confidence, flag for review)
8. For complex negotiations or emotional conversations, flag for human review (low confidence)

Respond ONLY with valid JSON:
{
  "autoReply": boolean (true if confidence >= ${confidenceThreshold || 80}),
  "reply": "the suggested reply message",
  "confidence": number (0-100),
  "reason": "brief explanation of why this confidence level"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Fan message: "${fanMessage}"` },
        ],
        temperature: 0.5,
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
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { autoReply: false, reply: "", confidence: 0, reason: "Failed to parse" };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chatter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
