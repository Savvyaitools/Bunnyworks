/**
 * Unified AI Client for Lovable AI Gateway
 * Shared module used by all edge functions for text, JSON, structured, and image generation.
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface AICompletionOptions {
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  modalities?: string[];
}

export interface AIResponse {
  text: string;
  raw: any;
  images?: Array<{ url: string }>;
}

function getApiKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

/**
 * Call the AI Gateway for text completion.
 * Default model: google/gemini-3-flash-preview
 */
export async function aiComplete(options: AICompletionOptions): Promise<AIResponse> {
  const apiKey = getApiKey();

  const body: any = {
    model: options.model || "google/gemini-3-flash-preview",
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.stream) body.stream = true;
  if (options.tools) body.tools = options.tools;
  if (options.tool_choice) body.tool_choice = options.tool_choice;
  if (options.modalities) body.modalities = options.modalities;

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new AIGatewayError("Rate limit exceeded", 429);
    if (response.status === 402) throw new AIGatewayError("AI credits exhausted", 402);
    const errText = await response.text();
    throw new AIGatewayError(`AI Gateway error: ${response.status} - ${errText}`, response.status);
  }

  if (options.stream) {
    // Return the raw response for streaming
    return { text: "", raw: response, images: [] };
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const text = message?.content || "";
  const images = message?.images?.map((img: any) => ({ url: img.image_url?.url || img.url })) || [];

  return { text, raw: data, images };
}

/**
 * Generate text with system + user prompt (most common pattern).
 */
export async function aiText(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const result = await aiComplete({
    model: options?.model,
    temperature: options?.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return result.text;
}

/**
 * Generate JSON output. Extracts the first JSON object/array from the response.
 */
export async function aiJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; temperature?: number }
): Promise<T> {
  const text = await aiText(systemPrompt, userPrompt, options);
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error("AI response did not contain valid JSON");
  return JSON.parse(match[0]) as T;
}

/**
 * Generate structured output using tool calling.
 */
export async function aiStructured<T = any>(
  messages: AIMessage[],
  toolDef: { name: string; description: string; parameters: any },
  options?: { model?: string; temperature?: number }
): Promise<T> {
  const result = await aiComplete({
    model: options?.model,
    temperature: options?.temperature,
    messages,
    tools: [{ type: "function", function: toolDef }],
    tool_choice: { type: "function", function: { name: toolDef.name } },
  });

  const toolCall = result.raw.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("No structured output returned");
  return JSON.parse(toolCall.function.arguments) as T;
}

/**
 * Generate an image from a text prompt using gemini image models.
 * Returns base64 data URL.
 */
export async function aiGenerateImage(
  prompt: string,
  options?: { model?: string; editImage?: string }
): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (options?.editImage) {
    content.push({ type: "image_url", image_url: { url: options.editImage } });
  }

  const result = await aiComplete({
    model: options?.model || "google/gemini-3-pro-image-preview",
    messages: [{ role: "user", content }],
    modalities: ["image", "text"],
  });

  const imageUrl = result.images?.[0]?.url;
  if (!imageUrl) throw new Error("No image generated");
  return imageUrl;
}

/**
 * Chat completion with conversation history.
 */
export async function aiChat(
  systemPrompt: string,
  conversationHistory: AIMessage[],
  userMessage: string,
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const result = await aiComplete({
    model: options?.model,
    temperature: options?.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ],
  });
  return result.text;
}

/**
 * Custom error class for AI Gateway errors with HTTP status.
 */
export class AIGatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AIGatewayError";
    this.status = status;
  }
}

/**
 * Standard CORS headers for edge functions.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Create a JSON error response with CORS headers.
 */
export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Create a JSON success response with CORS headers.
 */
export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Handle AIGatewayError specifically, returning proper HTTP status codes.
 */
export function handleAIError(error: unknown): Response {
  if (error instanceof AIGatewayError) {
    return jsonError(error.message, error.status);
  }
  console.error("AI error:", error);
  return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
}

/**
 * Extract and save agent memories from AI response text.
 * Returns cleaned text with memory markers removed.
 */
export async function extractAndSaveMemories(
  supabase: any,
  text: string,
  agencyId: string,
  agentType: string
): Promise<string> {
  const memMatch = text.match(/<!--MEMORIES:(\[[\s\S]*?\])-->/);
  if (!memMatch) return text;

  try {
    const mems = JSON.parse(memMatch[1]);
    if (Array.isArray(mems) && mems.length > 0) {
      await supabase.from("agent_memories").insert(
        mems.map((m: any) => ({
          agency_id: agencyId,
          agent_type: agentType,
          category: m.category || "general",
          content: m.content,
          importance: Math.min(10, Math.max(1, m.importance || 5)),
        }))
      );
    }
  } catch (e) {
    console.error("Memory parse error:", e);
  }

  return text.replace(/<!--MEMORIES:[\s\S]*?-->/g, "").trim();
}

/**
 * Authenticate request and get user's agency_id.
 * Returns { userId, agencyId } or throws.
 */
export async function authenticateRequest(
  req: Request,
  supabase: any
): Promise<{ userId: string; agencyId: string; userProfile: any }> {
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new AuthError("Unauthorized");

  const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) throw new AuthError("Unauthorized");

  const userId = claimsData.claims.sub as string;
  if (!userId) throw new AuthError("Unauthorized");

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("agency_id, full_name, email")
    .eq("id", userId)
    .single();

  if (!userProfile?.agency_id) throw new AuthError("No agency associated with your account");

  return { userId, agencyId: userProfile.agency_id, userProfile };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
