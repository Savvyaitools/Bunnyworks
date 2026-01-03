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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for stuck imports...");

    // Find imports that have been in "processing" status for more than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: stuckImports, error: fetchError } = await supabase
      .from("data_imports")
      .select("id, file_path, created_at, updated_at")
      .eq("status", "processing")
      .lt("updated_at", twoMinutesAgo);

    if (fetchError) {
      console.error("Error fetching stuck imports:", fetchError);
      throw fetchError;
    }

    if (!stuckImports || stuckImports.length === 0) {
      console.log("No stuck imports found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No stuck imports found",
        retriedCount: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${stuckImports.length} stuck import(s), retrying...`);

    const results = [];

    for (const importItem of stuckImports) {
      try {
        // Delete any existing extracted data for this import
        await supabase
          .from("extracted_data")
          .delete()
          .eq("import_id", importItem.id);

        // Update the import to mark it's being retried
        await supabase
          .from("data_imports")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", importItem.id);

        // Get a new signed URL
        const { data: urlData } = await supabase.storage
          .from("data-imports")
          .createSignedUrl(importItem.file_path, 3600);

        if (!urlData?.signedUrl) {
          console.error(`Could not generate signed URL for import ${importItem.id}`);
          results.push({ id: importItem.id, success: false, error: "No signed URL" });
          continue;
        }

        // Call the analyze-screenshot function
        const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-screenshot`;
        const response = await fetch(analyzeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            importId: importItem.id,
            imageUrl: urlData.signedUrl,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Analysis failed for import ${importItem.id}:`, errorText);
          results.push({ id: importItem.id, success: false, error: errorText });
        } else {
          const result = await response.json();
          console.log(`Successfully retried import ${importItem.id}:`, result);
          results.push({ id: importItem.id, success: true, status: result.status });
        }
      } catch (error) {
        console.error(`Error retrying import ${importItem.id}:`, error);
        results.push({ id: importItem.id, success: false, error: String(error) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Auto-retry complete: ${successCount}/${stuckImports.length} succeeded`);

    return new Response(JSON.stringify({
      success: true,
      message: `Retried ${stuckImports.length} stuck import(s)`,
      retriedCount: stuckImports.length,
      successCount,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in auto-retry-imports:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
