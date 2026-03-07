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

    // JWT auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (action !== "generate_reply") throw new Error("Invalid action");

    // Load Jodie's memories + fan context + creator earnings data in parallel
    let memoryContext = "";
    let dataContext = "";

    if (agencyId) {
      const queries: Promise<any>[] = [
        supabase.from('agent_memories').select('category, content, importance').eq('agency_id', agencyId).eq('agent_type', 'izzy').order('importance', { ascending: false }).limit(30),
        supabase.from('ai_suggestions_log').select('suggestion_type, selected_index, was_edited, resulted_in_sale, sale_amount').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(20),
      ];

      if (creatorId) {
        queries.push(
          supabase.from('ai_fan_context').select('spending_tier, engagement_level, interests, preferred_content_types, total_spent, avg_ppv_price, purchase_frequency').eq('of_account_id', creatorId).limit(10),
          supabase.from('creator_earnings').select('amount, subscriptions, tips, messages_revenue').eq('creator_id', creatorId).order('period_end', { ascending: false }).limit(5),
          supabase.from('creators').select('name, platform, revenue, niche').eq('id', creatorId).single(),
        );
      }

      const results = await Promise.all(queries);
      const memoriesRes = results[0];
      const suggestionsRes = results[1];
      const fanContextRes = results[2];
      const earningsRes = results[3];
      const creatorRes = results[4];

      if (memoriesRes.data?.length) {
        memoryContext = `\n\nYOUR LEARNED PATTERNS:\n${memoriesRes.data.map((m: any) => `- [${m.category}]: ${m.content}`).join('\n')}\nApply these patterns to craft better responses.`;
      }

      // Build data context
      const parts: string[] = [];

      if (suggestionsRes.data?.length) {
        const totalSuggestions = suggestionsRes.data.length;
        const salesCount = suggestionsRes.data.filter((s: any) => s.resulted_in_sale).length;
        const editRate = suggestionsRes.data.filter((s: any) => s.was_edited).length;
        parts.push(`Past AI Performance: ${totalSuggestions} suggestions, ${salesCount} resulted in sales, ${editRate} were edited by chatters`);
      }

      if (fanContextRes?.data?.length) {
        const topFans = fanContextRes.data.slice(0, 5).map((f: any) =>
          `Tier=${f.spending_tier||'?'}, Engagement=${f.engagement_level||'?'}, Spent=$${f.total_spent||0}, Interests=${(f.interests||[]).join(',')}, PPV avg=$${f.avg_ppv_price||0}`
        ).join(' | ');
        parts.push(`Fan Profiles: ${topFans}`);
      }

      if (earningsRes?.data?.length) {
        const recent = earningsRes.data[0];
        parts.push(`Creator Revenue: $${recent.amount} (subs=$${recent.subscriptions||0}, tips=$${recent.tips||0}, msgs=$${recent.messages_revenue||0})`);
      }

      if (creatorRes?.data) {
        parts.push(`Creator Profile: ${creatorRes.data.name}, niche=${creatorRes.data.niche||'general'}, total revenue=$${creatorRes.data.revenue||0}`);
      }

      if (parts.length) {
        dataContext = `\n\nCONTEXTUAL DATA:\n${parts.join('\n')}\nUse this to optimize pricing suggestions, upsells, and conversation tactics.`;
      }
    }

    const systemPrompt = `You are Jodie, a personal AI chatting assistant for this OnlyFans agency. You roleplay AS the creator and craft responses that maximize engagement and revenue. You learn from past interactions and adapt your style.

Creator: ${creatorName}
Persona: ${creatorPersona || "Flirty, warm, and engaging"}
Boundaries: ${creatorBoundaries || "No personal info sharing, no meeting in person, no underage content"}
${memoryContext}${dataContext}

RULES:
1. Stay in character as the creator at all times
2. Never share personal info (real name, phone, address, social media handles)
3. Be flirty and engaging but respect boundaries
4. For simple greetings/compliments → warm response (high confidence)
5. For purchase/tip thank-yous → enthusiastic + suggest more content (high confidence)
6. For custom requests → suggest pricing based on fan's spending tier if known (medium confidence)
7. For boundary violations → deflect politely (low confidence, flag)
8. For complex negotiations/emotional conversations → flag for human (low confidence)
9. When fan data is available, personalize upsell based on their spending tier and interests

Respond ONLY with valid JSON:
{
  "autoReply": boolean (true if confidence >= ${confidenceThreshold || 80}),
  "reply": "the reply message",
  "confidence": number (0-100),
  "reason": "brief explanation",
  "suggestedUpsell": "optional PPV or content suggestion based on fan data"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Fan message: "${fanMessage}"` }], temperature: 0.5 }),
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

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-chatter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
