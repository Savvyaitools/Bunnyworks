import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonError,
  jsonResponse,
  authenticateRequest,
  extractAndSaveMemories,
  AIGatewayError,
} from "../_shared/ai-client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { agencyId } = await authenticateRequest(req, supabase);

    const { action, topic, platform, creatorName, creatorNiche, creatorPersona, days, creatorId, ofAccountId, nicheQuery, existingSocialContent } = await req.json();

    // Verify creator belongs to this agency
    if (creatorId) {
      const { data: creator } = await supabase.from('creators').select('id').eq('id', creatorId).eq('agency_id', agencyId).single();
      if (!creator) return jsonError('Creator not found in your agency', 403);
    }

    // ── Gather context in parallel ──
    let liveOFContext = "";

    // Fetch live OnlyFans data if account is connected
    if (ofAccountId) {
      const OF_API_BASE = "https://app.onlyfansapi.com/api";
      const ofApiKey = Deno.env.get("ONLYFANS_API_KEY");
      if (ofApiKey) {
        try {
          const [earningsRes, fansRes, postsRes] = await Promise.all([
            fetch(`${OF_API_BASE}/${ofAccountId}/payouts/earning-statistics`, { headers: { "Authorization": `Bearer ${ofApiKey}`, "Content-Type": "application/json" } }),
            fetch(`${OF_API_BASE}/${ofAccountId}/fans/active?limit=5`, { headers: { "Authorization": `Bearer ${ofApiKey}`, "Content-Type": "application/json" } }),
            fetch(`${OF_API_BASE}/${ofAccountId}/posts?limit=10`, { headers: { "Authorization": `Bearer ${ofApiKey}`, "Content-Type": "application/json" } }),
          ]);

          const parts: string[] = [];
          if (earningsRes.ok) {
            const ed = await earningsRes.json();
            const t = ed?.data?.list?.total || ed?.total || {};
            parts.push(`Live Earnings: total=$${t?.all?.total_net ?? ed?.total ?? 0}, subs=$${t?.subscribes?.total_net ?? 0}, tips=$${t?.tips?.total_net ?? 0}`);
          }
          if (fansRes.ok) {
            const fd = await fansRes.json();
            parts.push(`Active Subscribers: ${fd?.total || (fd?.data || fd || []).length || 0}`);
          }
          if (postsRes.ok) {
            const pd = await postsRes.json();
            const posts = (pd?.data || pd || []).slice(0, 5);
            if (posts.length) {
              parts.push(`Recent Posts: ${posts.map((p: any) => `"${(p.text || '').slice(0, 50)}..." (${p.likes_count||0}♥)`).join(' | ')}`);
            }
          }
          if (parts.length) liveOFContext = `\n\nLIVE PLATFORM DATA:\n${parts.join('\n')}`;
        } catch (e) { console.error("Failed to fetch live OF data:", e); }
      }
    }

    // DB context queries
    const dbQueries: Promise<any>[] = [
      supabase.from('agent_memories').select('category, content, importance').eq('agency_id', agencyId).eq('agent_type', 'tatum').order('importance', { ascending: false }).limit(20),
      supabase.from('creators').select('id, name, status, revenue, platform, niche').eq('agency_id', agencyId),
      supabase.from('content_plans').select('title, board_column, platform, status, scheduled_date, creators(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(15),
    ];

    if (creatorId) {
      dbQueries.push(
        supabase.from('creator_earnings').select('amount, period_start, period_end, subscriptions, tips, messages_revenue').eq('creator_id', creatorId).order('period_end', { ascending: false }).limit(5)
      );
    }

    const dbResults = await Promise.all(dbQueries);
    const [memoriesRes, creatorsRes, plansRes] = dbResults;
    const earningsRes = dbResults[3];

    // Fetch social accounts
    const agencyCreatorIds = (creatorsRes.data || []).map((c: any) => c.id);
    const { data: socialsData } = agencyCreatorIds.length > 0
      ? await supabase.from('creator_social_accounts').select('username, platform, follower_count, engagement_rate, bio, avg_likes, creators(name)').in('creator_id', agencyCreatorIds).limit(15)
      : { data: [] };

    // Fetch warmup intelligence
    const { data: intelData } = await supabase.from("warmup_intelligence")
      .select("page_title, key_takeaways, statistics, engagement_metrics, content_type, category")
      .eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(15);

    // Build context strings
    const memoryContext = memoriesRes.data?.length
      ? `\n\nYOUR MEMORY:\n${memoriesRes.data.map((m: any) => `- [${m.category}]: ${m.content}`).join('\n')}`
      : '';

    const creatorsInfo = creatorsRes.data?.map((c: any) => `${c.name}: ${c.platform || 'N/A'}, niche=${c.niche || 'general'}, $${c.revenue || 0}`).join(' | ') || '';
    const plansInfo = plansRes.data?.slice(0, 8).map((p: any) => `"${p.title}" (${p.creators?.name}, ${p.board_column})`).join(' | ') || '';
    const socialsInfo = (socialsData || []).map((s: any) => {
      let e = `${s.creators?.name}: @${s.username}/${s.platform}`;
      if (s.follower_count) e += `, ${s.follower_count.toLocaleString()} followers`;
      if (s.engagement_rate) e += `, ${s.engagement_rate.toFixed(1)}% ER`;
      return e;
    }).join(' | ') || '';
    const earningsInfo = earningsRes?.data?.map((e: any) => `$${e.amount} (${e.period_start}→${e.period_end})`).join(' | ') || '';

    const intelligenceContext = (intelData && intelData.length > 0)
      ? `\n\nRESEARCH INTELLIGENCE:\n${intelData.map((i: any) => {
          let entry = `[${i.content_type || i.category}] ${i.page_title}`;
          if (i.key_takeaways?.length) entry += `: ${i.key_takeaways.slice(0, 3).join('; ')}`;
          return entry;
        }).join('\n')}`
      : '';

    const dataContext = `\n\nAGENCY DATA:
Creators: ${creatorsInfo || 'None'}
Content Plans: ${plansInfo || 'None'}
Social Accounts: ${socialsInfo || 'None'}
${earningsInfo ? `Earnings: ${earningsInfo}` : ''}`;

    const basePersonality = `You are Tatum, a personal social media strategist for this OnlyFans agency. You know their creators, brand styles, and what content performs well. You give tailored, data-backed advice.${memoryContext}${dataContext}${liveOFContext}${intelligenceContext}`;

    // ── Build action-specific prompts ──
    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_posts") {
      systemPrompt = `${basePersonality}\n\nGenerate platform-optimized posts with creator-specific language. Respond with valid JSON only.\nAfter JSON, append new brand preferences: <!--MEMORIES:[{"category":"...","content":"...","importance":1-10}]-->`;
      userPrompt = `Generate 4 social media post ideas for ${creatorName} (niche: ${creatorNiche || "general"}, persona: ${creatorPersona || "flirty and engaging"}).
Topic: ${topic} | Platform: ${platform}
Respond ONLY with JSON: {"posts": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string", "contentType": "string"}]}`;
    } else if (action === "generate_calendar") {
      systemPrompt = `${basePersonality}\n\nCreate a posting calendar considering the content pipeline and optimal posting times. Respond with valid JSON only.`;
      userPrompt = `Create a ${days || 7}-day content calendar for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"calendar": [{"platform": "string", "caption": "string", "hashtags": ["string"], "bestTime": "string", "contentType": "string"}]}`;
    } else if (action === "analyze_strategy") {
      systemPrompt = `${basePersonality}\n\nProvide growth strategy based on actual performance data and earnings trends. Be specific. Respond with valid JSON only.`;
      userPrompt = `Analyze and provide growth strategy for ${creatorName} (niche: ${creatorNiche}).
Platform: ${platform}
Respond ONLY with JSON: {"insights": [{"title": "string", "description": "string", "priority": "high|medium|low", "metric": "optional string"}]}`;
    } else if (action === "analyze_trends") {
      systemPrompt = `${basePersonality}\n\nAnalyze scraped social media data for HIGHLY VIRAL content with real engagement numbers. Match trends to creator's persona: "${creatorPersona || 'engaging content creator'}". Every trend MUST include a direct link and real numbers. Respond with valid JSON only.`;
      userPrompt = `Analyze these scraped results and extract 4-6 VIRAL content trends for ${creatorName} (persona: ${creatorPersona || "engaging"}) on ${platform}.

SCRAPED DATA:
${topic}

RULES:
- Each trend MUST include original post URL from data
- "engagement" must contain REAL numbers
- Skip items without meaningful engagement data
- Tailor actionable_tip to creator's persona

Respond ONLY with JSON: {"trends": [{"title": "string", "platform": "string", "description": "string", "engagement": "string", "url": "string", "video_url": "string or null", "actionable_tip": "string"}]}`;
    } else if (action === "niche_content_plan") {
      systemPrompt = `${basePersonality}\n\nBuild a niche content plan with REAL reference links from scraped viral content. Creator persona: "${creatorPersona || 'engaging content creator'}". Respond with valid JSON only.`;
      userPrompt = `Build a niche content plan for ${creatorName} (persona: ${creatorPersona || "engaging"}) in "${nicheQuery || creatorNiche}" on ${platform}.

SCRAPED REFERENCES:
${topic}

${existingSocialContent ? `EXISTING CONTENT:\n${existingSocialContent}\n\nIdentify gaps and opportunities.` : ""}

RULES:
- Each item MUST include original post URL
- "estimated_engagement" MUST have real numbers from reference
- Tailor recreation_prompt to persona

Return 5-8 ideas.
Respond ONLY with JSON: {"content_plan": [{"reference_url": "string", "reference_title": "string", "reference_video_url": "string or null", "platform": "string", "what_works": "string", "recreation_prompt": "string", "hashtags": ["string"], "estimated_engagement": "string"}]}`;
    } else {
      throw new Error("Invalid action");
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.7 }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return jsonError("Rate limit exceeded", 429);
      if (aiRes.status === 402) return jsonError("AI credits exhausted", 402);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    let text = aiData.choices?.[0]?.message?.content || "{}";

    // Extract and save memories
    text = await extractAndSaveMemories(supabase, text, agencyId, 'tatum');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return jsonResponse(parsed);
  } catch (e) {
    console.error("social-media-manager error:", e);
    if (e instanceof AIGatewayError) return jsonError(e.message, e.status);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === 'Unauthorized' || msg.includes('No agency')) return jsonError(msg, 401);
    return jsonResponse({ error: msg }, 500);
  }
});
