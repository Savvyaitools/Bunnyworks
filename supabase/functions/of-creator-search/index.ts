const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ParsedCreator {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  subscribe_price: number;
  location: string;
  about: string;
  posts_count: number;
  photos_count: number;
  videos_count: number;
  favorites_count: number;
  is_verified: boolean;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  website: string | null;
}

function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

function parsePrice(str: string): number {
  if (str.toUpperCase() === 'FREE') return 0;
  const match = str.match(/\$?([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseMarkdownResults(markdown: string): { creators: ParsedCreator[]; total: number } {
  const creators: ParsedCreator[] = [];

  // Extract total results count
  const totalMatch = markdown.match(/About ([\d,]+) results/);
  const total = totalMatch ? parseNumber(totalMatch[1]) : 0;

  // Split by creator avatar image blocks - each creator card starts with an image link
  // Pattern: [![Name username OnlyFans](avatar_url)](profile_link)
  const creatorBlocks = markdown.split(/\n\[!\[/);

  for (let i = 1; i < creatorBlocks.length; i++) {
    const block = '[!' + creatorBlocks[i];
    // Get next block boundary to limit our search
    const blockText = block.substring(0, 2000); // Limit block size

    // Extract avatar URL
    const avatarMatch = blockText.match(/\[!\[.*?\]\((https:\/\/(?:media\.onlyfinder\.com|thumbs\.onlyfans\.com)[^\)]+)\)/);
    if (!avatarMatch) continue;

    const avatarUrl = avatarMatch[1];

    // Extract name - look for [**Name**]
    const nameMatch = blockText.match(/\[\*\*(.+?)\*\*\]/);
    if (!nameMatch) continue;

    const name = nameMatch[1].replace(/\\/g, '');

    // Extract username from "> username" pattern
    const usernameMatch = blockText.match(/> ([a-zA-Z0-9_-]+)\]/);
    if (!usernameMatch) continue;

    const username = usernameMatch[1];

    // Extract favorites count
    const favMatch = blockText.match(/heart\.svg\)\n([\d,]+)/);
    const favorites_count = favMatch ? parseNumber(favMatch[1]) : 0;

    // Extract photos count
    const photoMatch = blockText.match(/photo-count\.svg\)\n([\d,]+)/);
    const photos_count = photoMatch ? parseNumber(photoMatch[1]) : 0;

    // Extract videos count
    const videoMatch = blockText.match(/video-count\.svg\)\n([\d,]+)/);
    const videos_count = videoMatch ? parseNumber(videoMatch[1]) : 0;

    // Extract price
    const priceMatch = blockText.match(/price-tag\.svg\)\*\*(.+?)\*\*/);
    const subscribe_price = priceMatch ? parsePrice(priceMatch[1]) : 0;

    // Extract bio - text after the price line, before the next creator or social links
    let about = '';
    const priceIdx = blockText.indexOf('price-tag.svg');
    if (priceIdx !== -1) {
      const afterPrice = blockText.substring(priceIdx);
      const bioMatch = afterPrice.match(/\*\*\n\n(.+?)(\n\n|\[!\[)/s);
      if (bioMatch) {
        about = bioMatch[1].trim();
      }
    }

    // Extract social links
    let instagram: string | null = null;
    let tiktok: string | null = null;
    let twitter: string | null = null;

    const igMatch = blockText.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
    if (igMatch) instagram = igMatch[1];

    const ttMatch = blockText.match(/tiktok\.com\/@?([a-zA-Z0-9_.]+)/);
    if (ttMatch) tiktok = ttMatch[1];

    const twMatch = blockText.match(/twitter\.com\/([a-zA-Z0-9_]+)/);
    if (twMatch) twitter = twMatch[1];

    // Check if verified (has verified icon)
    const is_verified = blockText.includes('verified') || blockText.includes('Verified');

    creators.push({
      id: i,
      username,
      name,
      avatar_url: avatarUrl,
      subscribe_price,
      location: '',
      about,
      posts_count: photos_count + videos_count,
      photos_count,
      videos_count,
      favorites_count,
      is_verified,
      instagram,
      twitter,
      tiktok,
      website: null,
    });
  }

  return { creators, total };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, minPrice, maxPrice, verifiedOnly } = await req.json();

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

    // Build OnlyFinder URL - path-based format: onlyfinder.com/{keyword}
    const keyword = query.trim().toLowerCase().replace(/\s+/g, '-');
    let searchUrl = `https://onlyfinder.com/${encodeURIComponent(keyword)}`;
    if (location) {
      searchUrl += `?loc=${encodeURIComponent(location.trim())}`;
    }

    console.log('Scraping OnlyFinder:', searchUrl);

    // Use Firecrawl to scrape with markdown format
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown'],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', JSON.stringify(scrapeData));
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || `Scrape failed (${scrapeResponse.status})` }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get markdown content
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    console.log('Markdown length:', markdown.length);

    if (!markdown || markdown.length < 100) {
      console.log('No meaningful markdown content returned');
      return new Response(
        JSON.stringify({ success: true, data: [], total: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the markdown into structured creator data
    let { creators, total } = parseMarkdownResults(markdown);

    // Apply client-side filters
    if (verifiedOnly) {
      creators = creators.filter(c => c.is_verified);
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      creators = creators.filter(c => {
        if (minPrice !== undefined && c.subscribe_price < minPrice) return false;
        if (maxPrice !== undefined && maxPrice < 50 && c.subscribe_price > maxPrice) return false;
        return true;
      });
    }

    console.log(`Parsed ${creators.length} creators (total: ${total})`);

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
