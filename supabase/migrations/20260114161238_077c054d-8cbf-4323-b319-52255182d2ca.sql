-- AI Knowledge Base for OFM tactics and best practices
CREATE TABLE public.ai_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'sales_tactics', 'pricing', 'fan_psychology', 'upsell', 'retention', 'operations'
  subcategory TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  examples JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Creator Voice Profiles for personality matching
CREATE TABLE public.creator_voice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  personality_traits TEXT[] DEFAULT '{}', -- ['flirty', 'playful', 'direct', 'mysterious']
  tone TEXT DEFAULT 'friendly', -- 'casual', 'flirty', 'professional', 'playful'
  vocabulary TEXT[] DEFAULT '{}', -- Specific words/phrases they use
  emoji_style TEXT DEFAULT 'moderate', -- 'none', 'minimal', 'moderate', 'heavy'
  sample_messages JSONB DEFAULT '[]'::jsonb, -- Example messages for training
  boundaries JSONB DEFAULT '{}'::jsonb, -- What they will/won't say
  greeting_style TEXT,
  sign_off_style TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_id)
);

-- Fan Context for personalized suggestions
CREATE TABLE public.ai_fan_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  of_account_id TEXT NOT NULL,
  of_fan_id TEXT NOT NULL,
  spending_tier TEXT DEFAULT 'unknown', -- 'whale', 'mid', 'casual', 'free'
  total_spent NUMERIC DEFAULT 0,
  avg_ppv_price NUMERIC,
  max_ppv_purchased NUMERIC,
  preferred_content_types TEXT[] DEFAULT '{}',
  engagement_level TEXT DEFAULT 'unknown', -- 'high', 'medium', 'low', 'dormant'
  purchase_frequency TEXT, -- 'frequent', 'occasional', 'rare', 'never'
  last_purchase_at TIMESTAMPTZ,
  conversation_notes TEXT,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(of_account_id, of_fan_id)
);

-- AI Suggestions Log for learning
CREATE TABLE public.ai_suggestions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id),
  employee_id UUID REFERENCES public.employees(id),
  creator_id UUID REFERENCES public.creators(id),
  of_chat_id TEXT,
  suggestion_type TEXT NOT NULL, -- 'reply', 'ppv_price', 'upsell', 'message_score'
  suggestions JSONB NOT NULL, -- Array of suggestions offered
  selected_index INTEGER, -- Which suggestion was selected (null if none)
  was_edited BOOLEAN DEFAULT false,
  final_message TEXT, -- What was actually sent
  resulted_in_sale BOOLEAN,
  sale_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FELIX Query Log
CREATE TABLE public.felix_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  query_type TEXT, -- 'analytics', 'comparison', 'recommendation', 'forecast', 'report'
  response TEXT NOT NULL,
  data_accessed JSONB DEFAULT '[]'::jsonb, -- What data sources were used
  action_taken BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FELIX Daily Briefings
CREATE TABLE public.felix_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL,
  summary TEXT NOT NULL,
  key_metrics JSONB NOT NULL,
  alerts JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, briefing_date)
);

-- Performance Alerts
CREATE TABLE public.ai_performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'revenue_drop', 'response_time', 'conversion_drop', 'opportunity'
  severity TEXT DEFAULT 'info', -- 'critical', 'warning', 'info', 'success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT, -- 'chatter', 'creator', 'agency'
  entity_id UUID,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_fan_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.felix_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.felix_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_knowledge_base (public read)
CREATE POLICY "Anyone can read knowledge base" ON public.ai_knowledge_base FOR SELECT USING (true);

-- RLS Policies for creator_voice_profiles
CREATE POLICY "Users can view voice profiles for their agency creators" ON public.creator_voice_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.creators c
      JOIN public.agencies a ON c.agency_id = a.id
      WHERE c.id = creator_voice_profiles.creator_id
    )
  );

CREATE POLICY "Users can manage voice profiles for their agency creators" ON public.creator_voice_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.id = creator_voice_profiles.creator_id
    )
  );

-- RLS Policies for ai_fan_context
CREATE POLICY "Users can view fan context" ON public.ai_fan_context FOR SELECT USING (true);
CREATE POLICY "Users can manage fan context" ON public.ai_fan_context FOR ALL USING (true);

-- RLS Policies for ai_suggestions_log
CREATE POLICY "Users can view their agency suggestions" ON public.ai_suggestions_log
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies)
  );

CREATE POLICY "Users can insert suggestions" ON public.ai_suggestions_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for felix_queries
CREATE POLICY "Users can view their agency queries" ON public.felix_queries
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies)
  );

CREATE POLICY "Users can insert queries" ON public.felix_queries
  FOR INSERT WITH CHECK (true);

-- RLS Policies for felix_briefings
CREATE POLICY "Users can view their agency briefings" ON public.felix_briefings
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies)
  );

CREATE POLICY "Users can manage their agency briefings" ON public.felix_briefings
  FOR ALL USING (
    agency_id IN (SELECT id FROM public.agencies)
  );

-- RLS Policies for ai_performance_alerts
CREATE POLICY "Users can view their agency alerts" ON public.ai_performance_alerts
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies)
  );

CREATE POLICY "Users can manage their agency alerts" ON public.ai_performance_alerts
  FOR ALL USING (
    agency_id IN (SELECT id FROM public.agencies)
  );

-- Seed initial OFM knowledge base
INSERT INTO public.ai_knowledge_base (category, subcategory, title, content, examples, tags, priority) VALUES
('sales_tactics', 'opening', 'Warm Welcome Strategy', 'Always greet new subscribers warmly and personally. Use their name, express genuine excitement, and hint at exclusive content without being pushy.', '[{"scenario": "New subscriber", "example": "Hey [name]! 💕 So happy you''re here! I''ve been waiting for someone like you... Want me to show you something special I made just for my VIPs?"}]', ARRAY['welcome', 'new_sub', 'opener'], 10),
('sales_tactics', 'upsell', 'Soft PPV Introduction', 'Introduce PPV content naturally during conversation flow. Build anticipation before revealing price. Never lead with price.', '[{"scenario": "After flirty conversation", "example": "You''ve been so sweet to me today... I actually have something really special I think you''d love 🔥 Want a little preview?"}]', ARRAY['ppv', 'upsell', 'soft_sell'], 10),
('sales_tactics', 'objection', 'Price Objection Handling', 'When fans say content is too expensive, acknowledge their concern, emphasize exclusivity and value, offer alternatives like shorter clips at lower prices.', '[{"scenario": "Fan says too expensive", "example": "I totally understand babe 💕 This one''s extra special and took me hours to make... But I have something shorter that might be perfect for you at $X - want to see?"}]', ARRAY['objection', 'price', 'negotiation'], 9),
('pricing', 'psychology', 'Whale Identification', 'Whales typically: respond quickly, use lots of emojis, compliment frequently, ask about custom content, tip without being asked. Price PPV 2-3x normal for identified whales.', '[]', ARRAY['whale', 'high_spender', 'pricing'], 10),
('pricing', 'psychology', 'Anchoring Strategy', 'Mention higher-priced content first to anchor expectations, then offer the actual item as a "deal". Example: "My customs usually start at $100, but for you I''d do this for $50"', '[]', ARRAY['anchoring', 'pricing', 'psychology'], 8),
('fan_psychology', 'engagement', 'Response Timing', 'Respond within 5-15 minutes during active hours. Too fast seems desperate, too slow loses momentum. For high-value fans, prioritize responses.', '[]', ARRAY['timing', 'response', 'engagement'], 9),
('fan_psychology', 'retention', 'Re-engagement Tactics', 'For dormant fans: send a "miss you" message, offer a small discount, share a free teaser, or ask about their day. Personalization is key.', '[{"scenario": "Fan inactive 7 days", "example": "Hey [name]... I noticed you''ve been quiet and I''ve missed our chats 💕 Everything okay? I saved something special for you..."}]', ARRAY['retention', 're-engage', 'dormant'], 9),
('upsell', 'detection', 'Purchase Ready Signals', 'Signs a fan is ready to buy: asks specific questions about content, uses phrases like "how much", "I want", "show me more", increased emoji use, quick responses, compliments on teaser content.', '[]', ARRAY['signals', 'upsell', 'conversion'], 10),
('retention', 'subscription', 'Expiring Sub Save', 'Contact fans 3 days before expiration. Remind them of exclusive benefits, offer a renewal discount, tease upcoming content.', '[{"scenario": "Sub expiring in 3 days", "example": "Hey [name]! Just wanted you to know your VIP access expires soon 😢 I have SO much planned for next week... Don''t want you to miss out babe 💕"}]', ARRAY['retention', 'subscription', 'renewal'], 10),
('operations', 'shifts', 'Shift Handoff Best Practices', 'Document ongoing conversations, note any pending PPV sales, flag high-priority fans, share context on fan preferences and recent topics.', '[]', ARRAY['handoff', 'shift', 'teamwork'], 7);

-- Create updated_at trigger for voice profiles
CREATE TRIGGER update_creator_voice_profiles_updated_at
  BEFORE UPDATE ON public.creator_voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for fan context
CREATE TRIGGER update_ai_fan_context_updated_at
  BEFORE UPDATE ON public.ai_fan_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();