import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonError,
  jsonResponse,
  authenticateRequest,
  AIGatewayError,
} from "../_shared/ai-client.ts";
import { toolSendMessage } from "../_shared/of-tools.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { agencyId, userId } = await authenticateRequest(req, supabase);

    const payload = await req.json();
    const { action } = payload;

    // ── Tool: execute a reply (send DM / PPV via OnlyFans API) ──────
    if (action === "execute_reply") {
      const { chat_id, text, price, lock_message, media_ids } = payload;
      const { data: chat } = await supabase.from("of_chats").select("agency_id").eq("id", chat_id).maybeSingle();
      if (!chat || chat.agency_id !== agencyId) return jsonError("Chat not in your agency", 403);
      const res = await toolSendMessage(
        { supabase, agencyId },
        { chat_id, text, price, lock_message, media_ids, sent_by_user_id: userId },
      );
      if (!res.ok) return jsonError(res.error, 400);
      return jsonResponse({ ok: true, message_id: res.message_id });
    }

    if (action !== "generate_reply") throw new Error("Invalid action");
    const { fanMessage, creatorName, creatorPersona, creatorBoundaries, confidenceThreshold, creatorId, conversationHistory = [], tone, length } = payload;

    const TONE_GUIDE: Record<string, string> = {
      flirty: "Flirty, teasing, playful sexual tension. Use light innuendo and warmth.",
      playful: "Playful, cheeky, fun energy. Light humor, no heavy sexual content.",
      romantic: "Romantic, sweet, affectionate. Make the fan feel adored.",
      dominant: "Confident and dominant. Direct, commanding, in-control tone.",
      submissive: "Soft, eager-to-please, submissive tone. Receptive and attentive.",
      professional: "Polite and professional. No slang, no sexual content, business-appropriate.",
      casual: "Casual and conversational, like texting a friend. Relaxed punctuation.",
      thankful: "Warm, appreciative, gratitude-forward. Acknowledge the fan generously.",
    };
    const LENGTH_GUIDE: Record<string, string> = {
      short: "Reply length: SHORT — one sentence, max ~12 words. No follow-up questions unless essential.",
      medium: "Reply length: MEDIUM — 2 to 3 sentences. One light question or hook allowed.",
      long: "Reply length: LONG — 4 to 6 sentences with descriptive detail and a clear hook or upsell.",
    };
    const toneInstruction = tone && TONE_GUIDE[tone] ? `\nTONE: ${TONE_GUIDE[tone]}` : "";
    const lengthInstruction = length && LENGTH_GUIDE[length] ? `\n${LENGTH_GUIDE[length]}` : "";

    // ── Verify creator belongs to this agency ───────────────────────
    if (creatorId) {
      const { data: creator } = await supabase.from('creators').select('id').eq('id', creatorId).eq('agency_id', agencyId).single();
      if (!creator) return jsonError('Creator not found in your agency', 403);
    }

    // Load context in parallel — memories, fan profiles, earnings, suggestions
    const queries: Promise<any>[] = [
      supabase.from('agent_memories').select('category, content, importance').eq('agency_id', agencyId).eq('agent_type', 'marylin').order('importance', { ascending: false }).limit(20),
      supabase.from('ai_suggestions_log').select('suggestion_type, selected_index, was_edited, resulted_in_sale, sale_amount').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(15),
    ];

    if (creatorId) {
      queries.push(
        supabase.from('ai_fan_context').select('spending_tier, engagement_level, interests, preferred_content_types, total_spent, avg_ppv_price, purchase_frequency').eq('of_account_id', creatorId).limit(10),
        supabase.from('creator_earnings').select('amount, subscriptions, tips, messages_revenue').eq('creator_id', creatorId).order('period_end', { ascending: false }).limit(3),
      );
    }

    const results = await Promise.all(queries);
    const memoriesRes = results[0];
    const suggestionsRes = results[1];
    const fanContextRes = results[2];
    const earningsRes = results[3];

    // Build context blocks
    const parts: string[] = [];

    if (memoriesRes.data?.length) {
      parts.push(`LEARNED PATTERNS:\n${memoriesRes.data.map((m: any) => `- [${m.category}]: ${m.content}`).join('\n')}`);
    }

    if (suggestionsRes.data?.length) {
      const total = suggestionsRes.data.length;
      const sales = suggestionsRes.data.filter((s: any) => s.resulted_in_sale).length;
      const edits = suggestionsRes.data.filter((s: any) => s.was_edited).length;
      parts.push(`Performance: ${total} suggestions, ${sales} converted to sales, ${edits} edited`);
    }

    if (fanContextRes?.data?.length) {
      const topFans = fanContextRes.data.slice(0, 5).map((f: any) =>
        `Tier=${f.spending_tier||'?'}, Spent=$${f.total_spent||0}, Interests=${(f.interests||[]).join(',')}, PPV=$${f.avg_ppv_price||0}`
      ).join(' | ');
      parts.push(`Fan Profiles: ${topFans}`);
    }

    if (earningsRes?.data?.length) {
      const r = earningsRes.data[0];
      parts.push(`Creator Revenue: $${r.amount} (subs=$${r.subscriptions||0}, tips=$${r.tips||0}, msgs=$${r.messages_revenue||0})`);
    }

    const dataContext = parts.length ? `\n\nCONTEXTUAL DATA:\n${parts.join('\n')}\nUse this to optimize pricing, upsells, and conversation tactics.` : '';

    // Build conversation context from history
    const historyContext = conversationHistory.length > 0
      ? `\n\nRECENT CONVERSATION:\n${conversationHistory.slice(-6).map((m: any) => `${m.role === 'fan' ? 'Fan' : 'You'}: ${m.content}`).join('\n')}`
      : '';

    const systemPrompt = `You are Marylin Monroe, the AI chatting persona for this OnlyFans agency. You roleplay AS the creator and craft responses that maximize engagement and revenue. You learn from past interactions and adapt your style.

Creator: ${creatorName}
Persona: ${creatorPersona || "Flirty, warm, and engaging"}
Boundaries: ${creatorBoundaries || "No personal info sharing, no meeting in person, no underage content"}${toneInstruction}${lengthInstruction}
${dataContext}${historyContext}

RULES:
1. Stay in character as the creator at all times
2. Never share personal info (real name, phone, address, social media handles)
3. Be flirty and engaging but respect boundaries strictly
4. Simple greetings/compliments → warm response (high confidence)
5. Purchase/tip thank-yous → enthusiastic + suggest more content (high confidence)
6. Custom requests → suggest pricing based on fan's spending tier (medium confidence)
7. Boundary violations → deflect politely (low confidence, flag)
8. Complex negotiations/emotional → flag for human review (low confidence)
9. Personalize upsell based on fan spending tier and interests when available
10. Match the energy of the conversation — don't over-sell on casual messages

Respond ONLY with valid JSON:
{
  "autoReply": boolean (true if confidence >= ${confidenceThreshold || 80}),
  "reply": "the reply message",
  "confidence": number (0-100),
  "reason": "brief explanation of confidence level",
  "suggestedUpsell": "optional PPV or content suggestion based on fan data",
  "flagForReview": boolean (true if human should check this)
}`;

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Fan message: "${fanMessage}"` },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, temperature: 0.5 }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return jsonError("Rate limit exceeded", 429);
      if (aiRes.status === 402) return jsonError("AI credits exhausted", 402);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { autoReply: false, reply: "", confidence: 0, reason: "Failed to parse", flagForReview: true };

    return jsonResponse(parsed);
  } catch (e) {
    console.error("ai-chatter error:", e);
    if (e instanceof AIGatewayError) return jsonError(e.message, e.status);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === 'Unauthorized' || msg.includes('No agency')) return jsonError(msg, 401);
    return jsonResponse({ error: msg }, 500);
  }
});
