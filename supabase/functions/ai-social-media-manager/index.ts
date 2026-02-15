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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, topic, platform, creatorName, creatorNiche, creatorPersona, days, agencyId, creatorId } = await req.json();

    // Load agency data + Tatum memories + creator performance in parallel
    let dataContext = "";
    let memoryContext = "";

    if (agencyId) {
      const queries: Promise<any>[] = [
        supabase.from('agent_memories').select('category, content, importance').eq('agency_id', agencyId).eq('agent_type', 'tatum').order('importance', { ascending: false }).limit(30),
        supabase.from('creators').select('name, status, revenue, platform, niche').eq('agency_id', agencyId),
        supabase.from('content_plans').select('title, board_column, platform, status, scheduled_date, creators(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(20),
        supabase.from('creator_social_accounts').select('username, platform, of_connection_status, creators(name)').limit(20),
      ];

      if (creatorId) {
        queries.push(
          supabase.from('creator_earnings').select('amount, period_start, period_end, subscriptions, tips, messages_revenue').eq('creator_id', creatorId).order('period_end', { ascending: false }).limit(10)
        );
      }

      const results = await Promise.all(queries);
      const [memoriesRes, creatorsRes, plansRes, socialsRes] = results;
      const earningsRes = results[4];

      if (memoriesRes.data?.length) {
        memoryContext = `\n\nYOUR MEMORY (brand/content preferences you've learned):\n${memoriesRes.data.map((m: any) => `- [${m.category}]: ${m.content}`).join('\n')}\nApply these to match the agency's established style.`;
      }

      const creatorsInfo = creatorsRes.data?.map((c: any) => `${c.name}: ${c.platform || 'N/A'}, niche=${c.niche || 'general'}, revenue=$${c.revenue || 0}`).join(' | ') || '';
      const plansInfo = plansRes.data?.slice(0, 10).map((p: any) => `"${p.title}" (${p.creators?.name}, ${p.board_column}, ${p.platform || '?'})`).join(' | ') || '';
      const socialsInfo = socialsRes.data?.map((s: any) => `${s.creators?.name}: @${s.username} on ${s.platform}`).join(' | ') || '';
      const earningsInfo = earningsRes?.data?.map((e: any) => `$${e.amount} (${e.period_start}→${e.period_end}, subs=$${e.subscriptions||0}, tips=$${e.tips||0})`).join(' | ') || '';

      dataContext = `\n\nAGENCY DATA FOR CONTEXT:
Creators: ${creatorsInfo || 'None'}
Recent Content Plans: ${plansInfo || 'None'}
Social Accounts: ${socialsInfo || 'None'}
${earningsInfo ? `Creator Earnings: ${earningsInfo}` : ''}
Use this data to create more targeted, performance-informed content suggestions.`;
    }

    let systemPrompt = "";
    let userPrompt = "";

    const basePersonality = `You are Tatum, a personal social media strategist for this OnlyFans agency. You know their creators, their brand styles, what content performs well, and their posting preferences. You give tailored, data-backed advice — not generic templates.${memoryContext}${dataContext}`;

    if (action === "generate_posts") {
      systemPrompt = `${basePersonality}\n\nGenerate platform-optimized posts. Use creator-specific language and consider their audience. Always respond with valid JSON only.\n\nAfter JSON, if you spot new brand preferences worth remembering, append: <!--MEMORIES:[{"category":"...","content":"...","importance":1-10}]-->`;
      userPrompt = `Generate 4 social media post ideas for ${creatorName} (niche: ${creatorNiche || "general"}, persona: ${creatorPersona || "flirty and engaging"}).
Topic: ${topic} | Platform: ${platform}
Respond ONLY with JSON: {"posts": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string", "contentType": "string"}]}`;
    } else if (action === "generate_calendar") {
      systemPrompt = `${basePersonality}\n\nCreate a posting calendar that considers the creator's content pipeline, existing content plans, and optimal posting times. Respond with valid JSON only.`;
      userPrompt = `Create a ${days || 7}-day content calendar for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"calendar": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string", "contentType": "string"}]}`;
    } else if (action === "analyze_strategy") {
      systemPrompt = `${basePersonality}\n\nProvide growth strategy based on actual creator performance data, earnings trends, and social account status. Be specific with recommendations. Respond with valid JSON only.`;
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
      const memMatch = text.match(/<!--MEMORIES:(\[[\s\S]*?\])-->/);
      if (memMatch) {
        try {
          const mems = JSON.parse(memMatch[1]);
          if (Array.isArray(mems)) {
            await supabase.from('agent_memories').insert(mems.map((m: any) => ({
              agency_id: agencyId, agent_type: 'tatum',
              category: m.category || 'general', content: m.content,
              importance: Math.min(10, Math.max(1, m.importance || 5)),
            })));
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
