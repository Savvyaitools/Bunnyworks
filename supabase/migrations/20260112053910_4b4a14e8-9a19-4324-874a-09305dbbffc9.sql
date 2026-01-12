-- Add new creator questionnaire fields to the creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS hair_color text,
ADD COLUMN IF NOT EXISTS eye_color text,
ADD COLUMN IF NOT EXISTS body_type text,
ADD COLUMN IF NOT EXISTS height text,
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS bra_size text,
ADD COLUMN IF NOT EXISTS favorite_food text,
ADD COLUMN IF NOT EXISTS favorite_music text,
ADD COLUMN IF NOT EXISTS character_traits text[],
ADD COLUMN IF NOT EXISTS hobbies text,
ADD COLUMN IF NOT EXISTS niche text[],
ADD COLUMN IF NOT EXISTS creator_references text,
ADD COLUMN IF NOT EXISTS content_types text[],
ADD COLUMN IF NOT EXISTS fetish_content text[],
ADD COLUMN IF NOT EXISTS favorite_position text,
ADD COLUMN IF NOT EXISTS turn_ons text,
ADD COLUMN IF NOT EXISTS attracted_to text,
ADD COLUMN IF NOT EXISTS boundaries text,
ADD COLUMN IF NOT EXISTS saying_sub_name boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_masturbation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_writing_name boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_custom_requests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS uses_toys boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_toy_bjs boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_video_calls boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS of_livestreams boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.creators.character_traits IS 'Array of personality traits (e.g., Flirty, Sweetheart, Seductive)';
COMMENT ON COLUMN public.creators.niche IS 'Array of content niches the creator fits in';
COMMENT ON COLUMN public.creators.content_types IS 'Array of content types (photo, video, etc.)';
COMMENT ON COLUMN public.creators.fetish_content IS 'Array of fetish content categories';
COMMENT ON COLUMN public.creators.boundaries IS 'Text describing what the creator is NOT comfortable doing';