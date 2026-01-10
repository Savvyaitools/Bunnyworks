import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreatorSocialAccount {
  id: string;
  creator_id: string;
  platform: string;
  username: string;
  account_type: "agency_managed" | "creator_managed";
  profile_url: string | null;
  created_at: string;
  updated_at: string;
  // OnlyFans API fields
  of_account_id: string | null;
  of_connected_at: string | null;
  of_last_synced_at: string | null;
}

export interface CreateSocialAccountInput {
  creator_id: string;
  platform: string;
  username: string;
  account_type: "agency_managed" | "creator_managed";
  profile_url?: string;
}

const platformUrls: Record<string, (username: string) => string> = {
  instagram: (u) => `https://instagram.com/${u}`,
  tiktok: (u) => `https://tiktok.com/@${u}`,
  twitter: (u) => `https://twitter.com/${u}`,
  x: (u) => `https://x.com/${u}`,
  fansly: (u) => `https://fansly.com/${u}`,
  youtube: (u) => `https://youtube.com/@${u}`,
  snapchat: (u) => `https://snapchat.com/add/${u}`,
  fanvue: (u) => `https://fanvue.com/${u}`,
  twitch: (u) => `https://twitch.tv/${u}`,
  reddit: (u) => `https://reddit.com/user/${u}`,
};

export function useCreatorSocialAccounts(creatorId?: string) {
  const [accounts, setAccounts] = useState<CreatorSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("creator_social_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching social accounts:", error);
      toast.error("Failed to load social accounts");
    } else {
      setAccounts(data as CreatorSocialAccount[]);
    }
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (input: CreateSocialAccountInput) => {
    // Auto-generate profile URL if not provided
    const profileUrl = input.profile_url || 
      (platformUrls[input.platform.toLowerCase()]?.(input.username) ?? null);

    const { error } = await supabase
      .from("creator_social_accounts")
      .insert({
        ...input,
        platform: input.platform.toLowerCase(),
        profile_url: profileUrl,
      });

    if (error) {
      console.error("Error creating social account:", error);
      toast.error("Failed to add social account");
      return false;
    }

    toast.success("Social account added!");
    fetchAccounts();
    return true;
  };

  const updateAccount = async (id: string, updates: Partial<CreateSocialAccountInput>) => {
    const { error } = await supabase
      .from("creator_social_accounts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating social account:", error);
      toast.error("Failed to update social account");
      return false;
    }

    toast.success("Social account updated!");
    fetchAccounts();
    return true;
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("creator_social_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting social account:", error);
      toast.error("Failed to remove social account");
      return false;
    }

    toast.success("Social account removed!");
    fetchAccounts();
    return true;
  };

  const getPlatformUrl = (platform: string, username: string): string | null => {
    return platformUrls[platform.toLowerCase()]?.(username) ?? null;
  };

  return {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    getPlatformUrl,
    refetch: fetchAccounts,
  };
}
