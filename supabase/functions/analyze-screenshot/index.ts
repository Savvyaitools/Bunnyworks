import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authorization is optional for service-to-service calls (e.g., auto-retry)
    // but we still log it for debugging
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    const { importId, imageUrl } = await req.json();

    if (!importId || !imageUrl) {
      return new Response(JSON.stringify({ error: "importId and imageUrl are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Analyzing screenshot for import: ${importId}`);

    // Call Lovable AI with vision capability
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a data extraction specialist for creator/influencer management platforms. 
Your task is to analyze screenshots from platforms like OnlyFans, Fansly, or similar and extract business metrics.

IMPORTANT: Only extract data that is clearly visible and business-relevant. If the image doesn't contain any business metrics, return relevant: false.

Extract the following types of data when present:
- earnings: Total earnings, net earnings, or revenue amounts
- subscribers: Subscriber/fan counts, active subscribers
- messages: Message counts, tips from messages
- tips: Direct tips, donations
- ppv_sales: Pay-per-view sales, locked content purchases
- referrals: Referral earnings or counts

For each metric, provide:
- The exact value (as a number)
- The platform name if identifiable
- The date range if visible (period_start, period_end)
- The raw text you extracted it from
- Your confidence level (0.0 to 1.0)

Respond ONLY with valid JSON in this exact format:
{
  "relevant": true/false,
  "reason": "explanation if not relevant",
  "confidence": 0.0-1.0,
  "extractions": [
    {
      "type": "earnings|subscribers|messages|tips|ppv_sales|referrals",
      "value": 1234.56,
      "period_start": "YYYY-MM-DD" or null,
      "period_end": "YYYY-MM-DD" or null,
      "platform": "OnlyFans|Fansly|etc" or null,
      "raw_text": "the exact text extracted",
      "confidence": 0.0-1.0
    }
  ]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this screenshot and extract all business metrics. If no relevant business data is found, indicate that clearly."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to analyze image");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response content:", content);

    // Parse the JSON response from AI
    let analysisResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // If parsing fails, mark as pending review
      await supabase
        .from("data_imports")
        .update({
          status: "pending_review",
          confidence_score: 0,
          rejection_reason: "AI response could not be parsed. Manual review required.",
        })
        .eq("id", importId);

      return new Response(JSON.stringify({ 
        success: true, 
        status: "pending_review",
        message: "Could not parse AI response. Marked for manual review."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle irrelevant content
    if (!analysisResult.relevant) {
      await supabase
        .from("data_imports")
        .update({
          status: "rejected",
          confidence_score: 0,
          rejection_reason: analysisResult.reason || "Uploaded information is irrelevant to our Business",
        })
        .eq("id", importId);

      return new Response(JSON.stringify({
        success: true,
        status: "rejected",
        message: analysisResult.reason || "Uploaded information is irrelevant to our Business",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate overall confidence
    const overallConfidence = analysisResult.confidence || 0;
    const extractions = analysisResult.extractions || [];

    // Auto-approve if confidence >= 90%, otherwise pending review
    const status = overallConfidence >= 0.9 ? "approved" : "pending_review";

    // Update the import record
    await supabase
      .from("data_imports")
      .update({
        status,
        confidence_score: overallConfidence,
      })
      .eq("id", importId);

    // Insert extracted data
    if (extractions.length > 0) {
      const extractedDataRows = extractions.map((extraction: any) => ({
        import_id: importId,
        data_type: extraction.type,
        value: extraction.value,
        period_start: extraction.period_start || null,
        period_end: extraction.period_end || null,
        platform: extraction.platform || null,
        raw_text: extraction.raw_text || null,
        confidence: extraction.confidence || overallConfidence,
      }));

      const { error: insertError } = await supabase
        .from("extracted_data")
        .insert(extractedDataRows);

      if (insertError) {
        console.error("Error inserting extracted data:", insertError);
      }
    }

    // If auto-approved and has earnings, insert into creator_earnings
    // Only insert NET earnings (creator's actual take-home), not GROSS
    if (status === "approved") {
      const { data: importData } = await supabase
        .from("data_imports")
        .select("creator_id")
        .eq("id", importId)
        .maybeSingle();

      if (importData?.creator_id) {
        const earningsExtractions = extractions.filter((e: any) => e.type === "earnings");
        
        // Find NET and GROSS earnings for the same period
        const netEarning = earningsExtractions.find((e: any) => 
          e.raw_text?.toLowerCase().includes("net")
        );
        const grossEarning = earningsExtractions.find((e: any) => 
          e.raw_text?.toLowerCase().includes("gross")
        );
        
        // Prefer NET, fallback to first earnings if no explicit NET/GROSS distinction
        const primaryEarning = netEarning || (earningsExtractions.length === 1 ? earningsExtractions[0] : null);
        
        if (primaryEarning && primaryEarning.period_start && primaryEarning.period_end) {
          // Calculate agency cut if we have both GROSS and NET
          const grossAmount = grossEarning?.value || primaryEarning.value;
          const netAmount = netEarning?.value || primaryEarning.value;
          const platformFee = grossAmount - netAmount;
          
          await supabase.from("creator_earnings").insert({
            creator_id: importData.creator_id,
            amount: netAmount, // Store NET (creator's actual earnings)
            period_start: primaryEarning.period_start,
            period_end: primaryEarning.period_end,
            platform: primaryEarning.platform || "Unknown",
            notes: `Net: $${netAmount.toFixed(2)}${grossEarning ? ` | Gross: $${grossAmount.toFixed(2)} | Platform fee: $${platformFee.toFixed(2)}` : ''}`,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status,
      confidence: overallConfidence,
      extractionsCount: extractions.length,
      message: status === "approved" 
        ? "Data extracted and approved automatically" 
        : "Data extracted but requires manual review",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-screenshot:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
