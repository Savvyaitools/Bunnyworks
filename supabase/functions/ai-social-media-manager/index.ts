import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── JWT auth ────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", 401);

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return jsonError("Unauthorized", 401);

    const authenticatedUserId = claimsData.claims.sub as string;
    if (!authenticatedUserId) return jsonError("Unauthorized", 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Server-side agency verification ─────────────────────────────
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', authenticatedUserId)
      .single();

    if (!userProfile?.agency_id) return jsonError('No agency associated with your account', 403);
    const agencyId = userProfile.agency_id;

    const { action, topic, platform, creatorName, creatorNiche, creatorPersona, days, creatorId, ofAccountId, nicheQuery, existingSocialContent } = await req.json();

    // ── Verify creator belongs to this agency ───────────────────────
    if (creatorId) {
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('id', creatorId)
        .eq('agency_id', agencyId)
        .single();
      if (!creator) return jsonError('Creator not found in your agency', 403);
    }

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

    // Fetch warmup intelligence for richer context
    let intelligenceContext = "";
    const { data: intelData } = await supabase.from("warmup_intelligence")
      .select("source_url, page_title, extracted_text, category, keywords, key_takeaways, statistics, engagement_metrics, content_type")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (intelData && intelData.length > 0) {
      const intelSummary = intelData.map((i: any) => {
        let entry = `[${i.content_type || i.category}] ${i.page_title}`;
        if (i.key_takeaways?.length > 0) {
          entry += `\n  Key Takeaways: ${i.key_takeaways.join('; ')}`;
        }
        if (i.statistics?.length > 0) {
          entry += `\n  Statistics: ${i.statistics.join('; ')}`;
        }
        if (i.engagement_metrics) {
          const em = i.engagement_metrics;
          entry += `\n  Engagement: ${em.upvotes ? `${em.upvotes} upvotes` : ''}${em.comments ? `, ${em.comments} comments` : ''}`;
        }
        if (!i.key_takeaways?.length && i.extracted_text) {
          entry += `: ${(i.extracted_text || '').slice(0, 200)}`;
        }
        return entry;
      }).join('\n');
      intelligenceContext = `\n\nRESEARCH INTELLIGENCE (AI-extracted structured data from live browsing sessions):\n${intelSummary}\nUse these real-world findings with their specific statistics and engagement metrics to ground your recommendations in current trends and competitor strategies.`;
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
      systemPrompt = `${basePersonality}\n\nYou are analyzing scraped social media data to find HIGHLY VIRAL content with real engagement numbers. The data comes from direct platform scraping (TikTok, Instagram, Reddit, Twitter/X, Threads, Snapchat) and contains actual post metrics.\n\nIMPORTANT: Match trends to the creator's PERSONA. The creator's persona is "${creatorPersona || 'engaging content creator'}". Only surface trends that align with their brand, audience, and content style.\n\nEvery trend MUST include:\n1. A direct link to the original viral video/post (the actual URL from the scraped data)\n2. Real engagement numbers (views, likes, comments, shares)\n3. A specific recreation prompt tailored to the creator's persona\n\nDo NOT give generic advice or link to blog articles. Respond with valid JSON only.`;
      userPrompt = `Analyze these scraped results and extract 4-6 VIRAL content trends for ${creatorName} (persona: ${creatorPersona || "engaging"}) on ${platform}.

CREATOR PERSONA: ${creatorPersona || "engaging content creator"}
Only suggest trends that this persona can authentically recreate.

SCRAPED PLATFORM DATA (real posts with metrics):
${topic}

RULES:
- Each trend MUST include the original post/video URL from the scraped data above
- The "engagement" field must contain REAL numbers from the data (e.g. "2.3M views, 450K likes")
- The "video_url" field should contain the direct video link if available
- Skip any items without meaningful engagement data
- Tailor actionable_tip to the creator's specific persona

Respond ONLY with JSON: {"trends": [{"title": "string (name the specific viral trend)", "platform": "string", "description": "string (2-3 sentences on WHY it went viral and how it fits this creator's persona)", "engagement": "string (REAL numbers e.g. '4.2M views, 890K likes')", "url": "string (direct link to the original viral post)", "video_url": "string or null (direct video URL for reference)", "actionable_tip": "string (step-by-step recreation instructions tailored to ${creatorName}'s persona)"}]}`;
    } else if (action === "niche_content_plan") {
      systemPrompt = `${basePersonality}\n\nYou are building a niche-specific content plan with REAL reference links to VIRAL content scraped directly from social platforms. The data contains actual posts with real engagement metrics.\n\nCREATOR PERSONA: "${creatorPersona || 'engaging content creator'}"\nOnly suggest content ideas that authentically fit this persona.\n\nEvery content idea MUST include:\n1. The direct URL to the reference viral post/video from the scraped data\n2. A "reference_video_url" with the direct video link when available\n3. Real engagement numbers from the reference\n4. A persona-tailored recreation prompt\n\nRespond with valid JSON only.`;
      userPrompt = `Build a niche content plan for ${creatorName} (persona: ${creatorPersona || "engaging"}) in the "${nicheQuery || creatorNiche}" niche on ${platform}.

CREATOR PERSONA: ${creatorPersona || "engaging content creator"}

SCRAPED REFERENCE CONTENT (real platform data with engagement metrics):
${topic}

${existingSocialContent ? `CREATOR'S EXISTING SOCIAL MEDIA CONTENT:\n${existingSocialContent}\n\nCompare trending references with the creator's existing content. Identify gaps and opportunities.` : "No existing social media content provided."}

RULES:
- Each item MUST include the original post URL from the scraped data
- "reference_video_url" should be the direct video link when available
- "estimated_engagement" MUST include real numbers from the reference
- Tailor recreation_prompt to ${creatorName}'s specific persona
- Skip any references without meaningful engagement data

Return 5-8 content ideas.
Respond ONLY with JSON: {"content_plan": [{"reference_url": "string (real URL from scraped data)", "reference_title": "string", "reference_video_url": "string or null (direct video URL)", "platform": "string", "what_works": "string (2-3 sentences citing SPECIFIC engagement metrics)", "recreation_prompt": "string (persona-tailored step-by-step instructions)", "hashtags": ["string"], "estimated_engagement": "string (real numbers from reference)"}]}`;
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

    // Extract and save memories (agency-scoped)
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("social-media-manager error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
