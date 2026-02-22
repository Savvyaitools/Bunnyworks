import { supabase } from "@/integrations/supabase/client";

/**
 * Shared helper to invoke browserbase-session edge function actions.
 * Used by useBrowserSessions, useBrowserFeatures, and useProfileWarmups.
 */
export async function invokeBrowserAction(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("browserbase-session", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
