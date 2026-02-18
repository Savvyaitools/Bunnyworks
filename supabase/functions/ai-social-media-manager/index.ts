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

    const { action, topic, platform, creatorName, creatorNiche, creatorPersona, days, agencyId, creatorId, ofAccountId, nicheQuery, existingSocialContent } = await req.json();

    // Load agency data + Tatum memories + creator performance + live OF data in parallel
    let dataContext = "";
    let memoryContext = "";
    let liveOFContext = "";

    // Fetch live OnlyFans data if account is connected
    if (ofAccountId) {
      const OF_API_BASE = "https://app.onlyfansapi.com/api";
      const ofApiKey = Deno.env.get("ONLYFANS_API_KEY");
      if (ofApiKey) {
        try {
          const [earningsRes, fansRes, postsRes] = await Promise.all([
            fetch(`${OF_API_BASE}/${ofAccountId}/payouts/earning-statistics`, {
              headers: { "Authorization": `Bearer ${ofApiKey}`, "Content-Type": "application/json" },
            }),
            fetch(`${OF_API_BASE}/${ofAccountId}/fans/active?limit=5`, {
              headers: { "Authorization": `Bearer ${ofApiKey}`, "Content-Type": "application/json" },
            }),
            fetch(`${OF_API_BASE}/${ofAccountId}/posts?limit=10`, {
              headers: { "Authorization": `Bearer ${ofApiKey}`, "Content-Type": "application/json" },
            }),
          ]);

          const parts: string[] = [];

          if (earningsRes.ok) {
            const ed = await earningsRes.json();
            const t = ed?.data?.list?.total || ed?.total || {};
            parts.push(`Live Earnings: total=$${t?.all?.total_net ?? ed?.total ?? 0}, subs=$${t?.subscribes?.total_net ?? 0}, tips=$${t?.tips?.total_net ?? 0}, messages=$${t?.chat_messages?.total_net ?? 0}`);
          }

          if (fansRes.ok) {
            const fd = await fansRes.json();
            const fans = fd?.data || fd || [];
            const count = fd?.total || fans.length || 0;
            parts.push(`Active Subscribers: ${count}`);
          }

          if (postsRes.ok) {
            const pd = await postsRes.json();
            const posts = (pd?.data || pd || []).slice(0, 5);
            if (posts.length > 0) {
              const topPosts = posts.map((p: any) => `"${(p.text || '').slice(0, 60)}..." (likes=${p.likes_count || 0}, comments=${p.comments_count || 0})`).join(' | ');
              parts.push(`Recent Posts: ${topPosts}`);
            }
          }

          if (parts.length > 0) {
            liveOFContext = `\n\nLIVE ONLYFANS DATA (real-time from platform):\n${parts.join('\n')}\nUse this live data to inform content strategy, identify trends, and make data-driven recommendations.`;
          }
        } catch (e) {
          console.error("Failed to fetch live OF data for Tatum:", e);
        }
      }
    }

    if (agencyId) {
      const queries: Promise<any>[] = [
        supabase.from('agent_memories').select('category, content, importance').eq('agency_id', agencyId).eq('agent_type', 'tatum').order('importance', { ascending: false }).limit(30),
        supabase.from('creators').select('id, name, status, revenue, platform, niche').eq('agency_id', agencyId),
        supabase.from('content_plans').select('title, board_column, platform, status, scheduled_date, creators(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(20),
      ];

      if (creatorId) {
        queries.push(
          supabase.from('creator_earnings').select('amount, period_start, period_end, subscriptions, tips, messages_revenue').eq('creator_id', creatorId).order('period_end', { ascending: false }).limit(10)
        );
      }

      const results = await Promise.all(queries);
      const [memoriesRes, creatorsRes, plansRes] = results;
      const earningsRes = results[3];

      const agencyCreatorIds = (creatorsRes.data || []).map((c: any) => c.id);
      const { data: socialsData } = agencyCreatorIds.length > 0
        ? await supabase.from('creator_social_accounts').select('username, platform, of_connection_status, of_account_id, creators(name)').in('creator_id', agencyCreatorIds).limit(20)
        : { data: [] };

      if (memoriesRes.data?.length) {
        memoryContext = `\n\nYOUR MEMORY (brand/content preferences you've learned):\n${memoriesRes.data.map((m: any) => `- [${m.category}]: ${m.content}`).join('\n')}\nApply these to match the agency's established style.`;
      }

      const creatorsInfo = creatorsRes.data?.map((c: any) => `${c.name}: ${c.platform || 'N/A'}, niche=${c.niche || 'general'}, revenue=$${c.revenue || 0}`).join(' | ') || '';
      const plansInfo = plansRes.data?.slice(0, 10).map((p: any) => `"${p.title}" (${p.creators?.name}, ${p.board_column}, ${p.platform || '?'})`).join(' | ') || '';
      const socialsInfo = (socialsData || []).map((s: any) => `${s.creators?.name}: @${s.username} on ${s.platform}`).join(' | ') || '';
      const earningsInfo = earningsRes?.data?.map((e: any) => `$${e.amount} (${e.period_start}→${e.period_end}, subs=$${e.subscriptions||0}, tips=$${e.tips||0})`).join(' | ') || '';

      dataContext = `\n\nAGENCY DATA FOR CONTEXT:
Creators: ${creatorsInfo || 'None'}
Recent Content Plans: ${plansInfo || 'None'}
Social Accounts: ${socialsInfo || 'None'}
${earningsInfo ? `Creator Earnings: ${earningsInfo}` : ''}
Use this data to create more targeted, performance-informed content suggestions.`;
    }

    // Fetch warmup intelligence for richer context
    let intelligenceContext = "";
    if (agencyId) {
      const { data: intelData } = await supabase.from("warmup_intelligence")
        .select("source_url, page_title, extracted_text, category, keywords")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (intelData && intelData.length > 0) {
        const intelSummary = intelData.map((i: any) => `[${i.category}] ${i.page_title}: ${(i.extracted_text || '').slice(0, 200)}`).join('\n');
        intelligenceContext = `\n\nRESEARCH INTELLIGENCE (scraped from live browsing sessions):\n${intelSummary}\nUse these real-world findings to ground your recommendations in current trends and competitor strategies.`;
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    const basePersonality = `You are Tatum, a personal social media strategist for this OnlyFans agency. You know their creators, their brand styles, what content performs well, and their posting preferences. You give tailored, data-backed advice — not generic templates.${memoryContext}${dataContext}${liveOFContext}${intelligenceContext}`;

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
    } else if (action === "analyze_trends") {
      systemPrompt = `${basePersonality}\n\nYou are analyzing scraped web content about trending social media strategies. Extract actionable trends and format them for content creators. Be specific and practical. Respond with valid JSON only.`;
      userPrompt = `Analyze these scraped trending content articles and extract 4-6 actionable trends for ${creatorName} on ${platform}.

SCRAPED CONTENT:
${topic}

Respond ONLY with JSON: {"trends": [{"title": "string", "platform": "string", "description": "string (2-3 sentences)", "engagement": "string (e.g. 'High', 'Viral', 'Growing')", "url": "string or null", "actionable_tip": "string (specific action the creator should take)"}]}`;
    } else if (action === "niche_content_plan") {
      systemPrompt = `${basePersonality}\n\nYou are building a niche-specific content plan with REAL reference links. The agency wants actionable content ideas with specific URLs to trending/high-performing content that the creator can study and recreate in their own style. Do NOT give generic advice — every item MUST have a real reference URL from the scraped data. Analyze what makes each reference successful and give a specific recreation prompt. If the creator's existing social media content is provided, tailor the plan to complement and improve on their current style. Respond with valid JSON only.`;
      userPrompt = `Build a niche content plan for ${creatorName} in the "${nicheQuery || creatorNiche}" niche on ${platform}.

SCRAPED REFERENCE CONTENT (use these REAL URLs as references):
${topic}

${existingSocialContent ? `CREATOR'S EXISTING SOCIAL MEDIA CONTENT (analyze their current style):
${existingSocialContent}

Compare the trending references with the creator's existing content. Identify gaps, opportunities, and content styles they should adopt.` : "No existing social media content provided — give general niche recommendations."}

Return 5-8 content ideas. Each MUST include a real reference_url from the scraped content above.
Respond ONLY with JSON: {"content_plan": [{"reference_url": "string (MUST be a real URL from scraped data)", "reference_title": "string", "platform": "string", "what_works": "string (2-3 sentences on why this content performs well)", "recreation_prompt": "string (specific instructions for the creator to recreate similar content in their style)", "hashtags": ["string"], "estimated_engagement": "string (e.g. 'High', 'Viral potential', 'Steady growth')"}]}`;
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
