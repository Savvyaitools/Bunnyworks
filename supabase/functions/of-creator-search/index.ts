const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnlyFinderCreator {
  username: string;
  name: string;
  avatar_url: string;
  header_url?: string;
  subscribe_price: number;
  location: string;
  about: string;
  posts_count: number;
  photos_count: number;
  videos_count: number;
  favorites_count: number;
  is_verified: boolean;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, minPrice, maxPrice, verifiedOnly, offset } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured. Enable it in Settings → Connectors.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build OnlyFinder search URL
    const params = new URLSearchParams();
    params.set('query', query);
    if (location) params.set('loc', location);
    if (offset) params.set('offset', String(offset));
    
    const searchUrl = `https://onlyfinder.com/?${params.toString()}`;
    console.log('Scraping OnlyFinder:', searchUrl);

    // Use Firecrawl to scrape with JSON extraction
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['extract'],
        extract: {
          prompt: `Extract ALL creator/model profile cards from this OnlyFinder search results page. For each creator card found, extract:
- username (the OnlyFans username / handle, without @)
- name (display name)
- avatar_url (profile image URL)
- subscribe_price (monthly subscription price in USD as a number, 0 if free)
- location (city/country if shown)
- about (bio/description text)
- photos_count (number of photos, 0 if not shown)
- videos_count (number of videos, 0 if not shown)
- favorites_count (number of likes/favorites, 0 if not shown)
- is_verified (true if verified badge shown)

Return ALL creators visible on the page. If a field is not available, use reasonable defaults (empty string for text, 0 for numbers, false for booleans).`,
          schema: {
            type: 'object',
            properties: {
              total_results: { type: 'number', description: 'Total number of results shown on page or estimated total' },
              creators: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    name: { type: 'string' },
                    avatar_url: { type: 'string' },
                    subscribe_price: { type: 'number' },
                    location: { type: 'string' },
                    about: { type: 'string' },
                    photos_count: { type: 'number' },
                    videos_count: { type: 'number' },
                    favorites_count: { type: 'number' },
                    is_verified: { type: 'boolean' },
                  },
                  required: ['username', 'name'],
                },
              },
            },
            required: ['creators'],
          },
        },
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || `Scrape failed (${scrapeResponse.status})` }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse extracted data
    const extracted = scrapeData?.data?.extract || scrapeData?.extract || {};
    let creators: OnlyFinderCreator[] = (extracted.creators || []).map((c: any, i: number) => ({
      id: i + 1 + (offset || 0),
      username: c.username || '',
      name: c.name || c.username || '',
      avatar_url: c.avatar_url || '',
      header_url: c.header_url || '',
      subscribe_price: Number(c.subscribe_price) || 0,
      location: c.location || '',
      about: c.about || '',
      posts_count: (Number(c.photos_count) || 0) + (Number(c.videos_count) || 0),
      photos_count: Number(c.photos_count) || 0,
      videos_count: Number(c.videos_count) || 0,
      favorites_count: Number(c.favorites_count) || 0,
      is_verified: Boolean(c.is_verified),
      instagram: c.instagram || null,
      twitter: c.twitter || null,
      tiktok: c.tiktok || null,
      website: c.website || null,
    }));

    // Apply client-side filters
    if (verifiedOnly) {
      creators = creators.filter(c => c.is_verified);
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      creators = creators.filter(c => {
        const price = c.subscribe_price;
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && maxPrice < 50 && price > maxPrice) return false;
        return true;
      });
    }

    const total = extracted.total_results || creators.length;

    console.log(`Found ${creators.length} creators (total: ${total})`);

    return new Response(
      JSON.stringify({ success: true, data: creators, total }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Creator search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
