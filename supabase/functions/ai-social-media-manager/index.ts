import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { action, topic, platform, creatorName, creatorNiche, creatorPersona, days, agencyId } = await req.json();

    // Load Tatum's memories for this agency
    let memoryContext = "";
    if (agencyId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: memories } = await supabase
        .from('agent_memories')
        .select('category, content, importance')
        .eq('agency_id', agencyId)
        .eq('agent_type', 'tatum')
        .order('importance', { ascending: false })
        .limit(30);
      
      if (memories && memories.length > 0) {
        memoryContext = `\n\nYOUR MEMORY (what you know about this agency's social media preferences):\n${memories.map((m: { category: string; content: string; importance: number }) => `- [${m.category}]: ${m.content}`).join('\n')}\nUse these to personalize content style, tone, hashtag preferences, and posting strategies.`;
        
        // Update last accessed
        const ids = memories.map((m: { id?: string }) => m.id).filter(Boolean);
        if (ids.length > 0) {
          await supabase.from('agent_memories').update({ last_accessed_at: new Date().toISOString() }).in('id', ids);
        }
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_posts") {
      systemPrompt = `You are Tatum, a social media marketing expert for OnlyFans creators. You're a personal assistant who knows this agency's brand style and preferences. Generate engaging, platform-optimized posts that drive traffic and engagement. Always respond with valid JSON only.${memoryContext}

After the JSON, if the user reveals brand preferences or style choices worth remembering, append: <!--MEMORIES:[{"category":"...","content":"...","importance":1-10}]-->`;
      userPrompt = `Generate 4 social media post ideas for ${creatorName} (niche: ${creatorNiche || "general"}, persona: ${creatorPersona || "flirty and engaging"}).
Topic/theme: ${topic}
Platform: ${platform}
Respond ONLY with JSON: {"posts": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string like '7 PM EST'", "contentType": "string like 'photo' or 'reel'"}]}`;
    } else if (action === "generate_calendar") {
      systemPrompt = `You are Tatum, a content calendar strategist for OnlyFans creators. You're a personal assistant who remembers this agency's scheduling preferences. Create a structured weekly posting schedule. Always respond with valid JSON only.${memoryContext}`;
      userPrompt = `Create a ${days || 7}-day content calendar for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"calendar": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string", "contentType": "string"}]}`;
    } else if (action === "analyze_strategy") {
      systemPrompt = `You are Tatum, a social media growth strategist for OnlyFans creators. You're a personal assistant who tracks this agency's growth history. Provide actionable, data-informed recommendations. Always respond with valid JSON only.${memoryContext}`;
      userPrompt = `Analyze and provide growth strategy insights for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"insights": [{"title": "string", "description": "string", "priority": "high|medium|low", "metric": "optional string"}]}`;
    } else {
      throw new Error("Invalid action");
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.7 }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    let text = aiData.choices?.[0]?.message?.content || "{}";

    // Extract and save memories
    if (agencyId) {
      const memoryMatch = text.match(/<!--MEMORIES:(\[[\s\S]*?\])-->/);
      if (memoryMatch) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const newMemories = JSON.parse(memoryMatch[1]);
          if (Array.isArray(newMemories)) {
            await supabase.from('agent_memories').insert(
              newMemories.map((m: { category: string; content: string; importance: number }) => ({
                agency_id: agencyId, agent_type: 'tatum',
                category: m.category || 'general', content: m.content,
                importance: Math.min(10, Math.max(1, m.importance || 5)),
              }))
            );
          }
        } catch (e) { console.error('Memory save error:', e); }
        text = text.replace(/<!--MEMORIES:[\s\S]*?-->/g, '').trim();
      }
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("social-media-manager error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
