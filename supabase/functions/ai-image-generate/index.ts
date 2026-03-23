import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  aiGenerateImage,
  authenticateRequest,
  corsHeaders,
  jsonError,
  jsonResponse,
  handleAIError,
  AuthError,
} from "../_shared/ai-client.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { userId, agencyId } = await authenticateRequest(req, supabase);

    const { prompt, editImage, model } = await req.json();
    if (!prompt || typeof prompt !== "string") return jsonError("Prompt is required");
    if (prompt.length > 2000) return jsonError("Prompt too long (max 2000 chars)");

    console.log(`Image generation for agency ${agencyId}: "${prompt.slice(0, 80)}..."`);

    const imageUrl = await aiGenerateImage(prompt, {
      model: model || "google/gemini-3-pro-image-preview",
      editImage: editImage || undefined,
    });

    // Store the generation record
    await supabase.from("ai_suggestions_log").insert({
      agency_id: agencyId,
      employee_id: null,
      suggestion_type: "image_generation",
      suggestions: { prompt, model: model || "google/gemini-3-pro-image-preview", hasEditImage: !!editImage },
    });

    return jsonResponse({ image: imageUrl, prompt });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, 401);
    return handleAIError(error);
  }
});
