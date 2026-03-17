import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestionRequest {
  fanMessage: string;
  conversationHistory: Message[];
  creatorId: string;
  fanId?: string;
  accountId?: string;
  suggestionType?: 'reply' | 'ppv_price' | 'upsell';
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // ── JWT auth ────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return jsonError('Unauthorized', 401);

    const authenticatedUserId = claimsData.claims.sub as string;
    if (!authenticatedUserId) return jsonError('Unauthorized', 401);

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Server-side agency verification ─────────────────────────────
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', authenticatedUserId)
      .single();

    if (!userProfile?.agency_id) return jsonError('No agency associated with your account', 403);
    const agencyId = userProfile.agency_id;

    const { fanMessage, conversationHistory, creatorId, fanId, accountId, suggestionType = 'reply' } = await req.json() as SuggestionRequest;

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

    // Fetch creator voice profile, knowledge base (agency-scoped), and fan context in parallel
    const queries: Promise<any>[] = [
      // Voice profile — joined to creator which is already verified as agency-owned
      supabase.from('creator_voice_profiles').select('*').eq('creator_id', creatorId).single(),
      // Knowledge base — scoped to agency OR global (agency_id IS NULL)
      supabase.from('ai_knowledge_base').select('*')
        .or(`agency_id.eq.${agencyId},agency_id.is.null`)
        .order('priority', { ascending: false })
        .limit(10),
    ];

    if (fanId && accountId) {
      queries.push(
        supabase.from('ai_fan_context').select('*').eq('of_fan_id', fanId).eq('of_account_id', accountId).single()
      );
    }

    const results = await Promise.all(queries);
    const voiceProfile = results[0]?.data;
    const knowledge = results[1]?.data;
    const fanContext = results[2]?.data || null;

    // Build system prompt
    const voiceDescription = voiceProfile ? `
Voice Profile:
- Personality: ${voiceProfile.personality_traits?.join(', ') || 'friendly, engaging'}
- Tone: ${voiceProfile.tone || 'casual'}
- Emoji style: ${voiceProfile.emoji_style || 'moderate'}
- Vocabulary: ${voiceProfile.vocabulary?.join(', ') || 'standard'}
- Sample messages for style reference: ${JSON.stringify(voiceProfile.sample_messages || [])}
` : 'Use a friendly, flirty, and engaging tone with moderate emoji use.';

    const fanDescription = fanContext ? `
Fan Profile:
- Spending tier: ${fanContext.spending_tier}
- Total spent: $${fanContext.total_spent}
- Average PPV purchase: $${fanContext.avg_ppv_price || 'unknown'}
- Engagement level: ${fanContext.engagement_level}
- Interests: ${fanContext.interests?.join(', ') || 'unknown'}
` : 'Fan profile not available - treat as new/unknown fan.';

    const knowledgeContext = knowledge?.map((k: any) => `${k.title}: ${k.content}`).join('\n\n') || '';

    let typeSpecificInstructions = '';
    if (suggestionType === 'ppv_price') {
      typeSpecificInstructions = `
Focus on suggesting optimal PPV pricing. Consider:
- Fan's spending history and tier
- Content value and exclusivity
- Psychological pricing (e.g., $9.99 vs $10)
- Provide 3 price options: low, optimal, premium`;
    } else if (suggestionType === 'upsell') {
      typeSpecificInstructions = `
Focus on upsell opportunities. Look for:
- Natural conversation moments to introduce content
- Buying signals in the fan's messages
- Ways to build anticipation
- Soft sell approaches that don't feel pushy`;
    }

    const systemPrompt = `You are JODIE, an expert AI assistant for OnlyFans chatters. Your role is to generate message suggestions that match the creator's voice and maximize engagement and revenue.

${voiceDescription}

${fanDescription}

OFM Best Practices:
${knowledgeContext}

${typeSpecificInstructions}

CRITICAL RULES:
1. NEVER break character or reveal you are AI
2. Match the creator's voice profile exactly
3. Keep messages concise (1-3 sentences typically)
4. Include emojis matching the creator's style
5. Focus on building connection, not just selling
6. Be flirty but respect boundaries
7. Never be desperate or pushy

Generate exactly 4 reply suggestions in JSON format. Each suggestion should have:
- "text": the suggested message
- "intent": what this message aims to achieve (engage, tease, upsell, retain, etc.)
- "confidence": 0-100 how confident you are this will work

Response format (JSON only, no markdown):
{"suggestions": [{"text": "...", "intent": "...", "confidence": 85}, ...]}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: `Fan's latest message: "${fanMessage}"\n\nGenerate 4 reply suggestions.` }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonError('Rate limit exceeded. Please try again later.', 429);
      if (response.status === 402) return jsonError('AI credits exhausted. Please add credits.', 402);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let suggestions;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      suggestions = {
        suggestions: [
          { text: "Hey babe! 💕 How are you?", intent: "engage", confidence: 70 },
          { text: "I've missed you! What's on your mind? 😘", intent: "engage", confidence: 65 },
          { text: "You always know how to make my day better 🥰", intent: "retain", confidence: 60 },
          { text: "I have something special for you... want a peek? 👀", intent: "tease", confidence: 55 }
        ]
      };
    }

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('JODIE error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
