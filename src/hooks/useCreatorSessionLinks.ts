import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CreatorSessionLink {
  id: string;
  agency_id: string;
  creator_id: string;
  platform: string;
  encrypted_session: string;
  expires_at: string;
  is_active: boolean;
  created_by: string;
  notes: string | null;
  hyperbeam_session_id: string | null;
  hyperbeam_admin_token: string | null;
  hyperbeam_profile_id: string | null;
  session_status: string | null;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateSessionLinkInput = {
  creator_id: string;
  platform: string;
  notes?: string | null;
};

export function useCreatorSessionLinks(creatorId?: string) {
  const crud = useSupabaseCRUD<CreatorSessionLink>({
    table: "creator_session_links",
    queryKey: creatorId ? `creator_session_links_${creatorId}` : "creator_session_links",
    orderBy: { column: "created_at", ascending: false },
    filter: creatorId ? { column: "creator_id", value: creatorId } : undefined,
    messages: {
      createSuccess: "Session link created",
      updateSuccess: "Session link updated",
      deleteSuccess: "Session link removed",
    },
  });

  const createSessionLink = useCallback(async (input: CreateSessionLinkInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!profile?.agency_id) throw new Error("Agency not found");

    // Create with placeholder encrypted_session and future expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    return crud.create({
      ...input,
      agency_id: profile.agency_id,
      created_by: user.id,
      encrypted_session: "pending",
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });
  }, [crud]);

  const getActiveSessionLinks = useCallback(() => {
    return crud.items.filter(link => link.is_active && link.session_status === "ready");
  }, [crud.items]);

  const getPendingSessionLinks = useCallback(() => {
    return crud.items.filter(link => link.session_status === "pending" || !link.hyperbeam_profile_id);
  }, [crud.items]);

  return {
    sessionLinks: crud.items,
    loading: crud.loading,
    createSessionLink,
    updateSessionLink: crud.update,
    deleteSessionLink: crud.remove,
    getActiveSessionLinks,
    getPendingSessionLinks,
    refetch: crud.refetch,
  };
}
