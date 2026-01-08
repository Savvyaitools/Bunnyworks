import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnlyFansAccount {
  id: string;
  username: string;
  name: string;
  created_at: string;
}

interface EarningStatistics {
  total: number;
  tips: number;
  subscriptions: number;
  messages: number;
  posts: number;
  referrals: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  created_at: string;
  description: string;
}

interface Chat {
  id: string;
  with_user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  last_message?: {
    text: string;
    created_at: string;
    is_from_me: boolean;
  };
  unread_count: number;
}

interface Message {
  id: string;
  text: string;
  created_at: string;
  is_from_me: boolean;
  media?: { id: string; url: string; type: string }[];
  price?: number;
}

interface Fan {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  subscribed_at?: string;
  expires_at?: string;
  total_spent?: number;
  is_active?: boolean;
}

interface Post {
  id: string;
  text: string;
  created_at: string;
  media?: { id: string; url: string; type: string }[];
  price?: number;
  likes_count?: number;
  comments_count?: number;
}

interface VaultMedia {
  id: string;
  url: string;
  thumb_url?: string;
  type: string;
  created_at: string;
}

export function useOnlyFansAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = async <T>(action: string, params: Record<string, unknown> = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("onlyfans-api", {
        body: { action, ...params },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      // Don't throw on error if it's a duplicate_account response (we handle it specially)
      if (data?.error && !data?.duplicate_account) {
        throw new Error(data.error);
      }

      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : "API request failed";
      setError(message);
      console.error("OnlyFans API error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async (email: string, password: string, code?: string, forceConnect?: boolean) => {
    const result = await callAPI<{ 
      account_id?: string; 
      requires_2fa?: boolean; 
      duplicate_account?: boolean;
      existing_account?: { id: string; display_name?: string };
    }>("authenticate", {
      email,
      password,
      ...(code && { code }),
      ...(forceConnect && { force_connect: true }),
    });

    if (result?.requires_2fa) {
      toast.info("2FA required - please enter your verification code");
      return { requires2FA: true, accountId: null, duplicateAccount: false };
    }

    if (result?.account_id) {
      toast.success("OnlyFans account connected successfully!");
      return { requires2FA: false, accountId: result.account_id, duplicateAccount: false };
    }

    // Handle duplicate account - return the existing account ID
    if (result?.duplicate_account && result?.existing_account?.id) {
      return { requires2FA: false, accountId: result.existing_account.id, duplicateAccount: true };
    }

    return { requires2FA: false, accountId: null, duplicateAccount: false };
  };

  const listAccounts = async () => {
    return callAPI<OnlyFansAccount[]>("list-accounts");
  };

  const getAccountInfo = async (accountId: string) => {
    return callAPI<OnlyFansAccount>("get-account-info", { accountId });
  };

  const getEarnings = async (accountId: string) => {
    return callAPI<EarningStatistics>("get-earnings", { accountId });
  };

  const listTransactions = async (accountId: string, limit = 50, offset = 0) => {
    return callAPI<{ data: Transaction[]; total: number }>("list-transactions", {
      accountId,
      limit,
      offset,
    });
  };

  const listFans = async (accountId: string, limit = 50, offset = 0) => {
    return callAPI<{ data: Fan[]; total: number }>("list-fans", {
      accountId,
      limit,
      offset,
    });
  };

  // ========== CHAT METHODS ==========
  const listChats = async (accountId: string, limit = 50, offset = 0) => {
    return callAPI<{ data: Chat[]; total: number }>("list-chats", {
      accountId,
      limit,
      offset,
    });
  };

  const getChatMessages = async (accountId: string, chatId: string, limit = 50, offset = 0) => {
    return callAPI<{ data: Message[]; total: number }>("get-chat-messages", {
      accountId,
      chatId,
      limit,
      offset,
    });
  };

  const sendMessage = async (accountId: string, chatId: string, text: string, mediaIds?: string[], price?: number) => {
    const result = await callAPI<{ id: string }>("send-message", {
      accountId,
      chatId,
      text,
      ...(mediaIds && { mediaIds }),
      ...(price && { price }),
    });
    if (result) {
      toast.success("Message sent!");
    }
    return result;
  };

  const sendMassMessage = async (
    accountId: string, 
    text: string, 
    targetType: "all" | "active" | "expired" = "all",
    mediaIds?: string[], 
    price?: number
  ) => {
    const result = await callAPI<{ id: string; sent_count: number }>("send-mass-message", {
      accountId,
      text,
      targetType,
      ...(mediaIds && { mediaIds }),
      ...(price && { price }),
    });
    if (result) {
      toast.success(`Mass message sent to ${result.sent_count} fans!`);
    }
    return result;
  };

  // ========== FAN METHODS ==========
  const listActiveFans = async (accountId: string, limit = 50, offset = 0, search?: string) => {
    return callAPI<{ data: Fan[]; total: number }>("list-active-fans", {
      accountId,
      limit,
      offset,
      ...(search && { search }),
    });
  };

  const listExpiredFans = async (accountId: string, limit = 50, offset = 0) => {
    return callAPI<{ data: Fan[]; total: number }>("list-expired-fans", {
      accountId,
      limit,
      offset,
    });
  };

  const getFanDetails = async (accountId: string, fanId: string) => {
    return callAPI<Fan>("get-fan-details", {
      accountId,
      fanId,
    });
  };

  // ========== POST/CONTENT METHODS ==========
  const listPosts = async (accountId: string, limit = 50, offset = 0) => {
    return callAPI<{ data: Post[]; total: number }>("list-posts", {
      accountId,
      limit,
      offset,
    });
  };

  const createPost = async (accountId: string, text: string, mediaIds?: string[], price?: number, scheduledAt?: string) => {
    const result = await callAPI<{ id: string }>("create-post", {
      accountId,
      text,
      ...(mediaIds && { mediaIds }),
      ...(price && { price }),
      ...(scheduledAt && { scheduledAt }),
    });
    if (result) {
      toast.success("Post created!");
    }
    return result;
  };

  const listVaultMedia = async (accountId: string, limit = 50, offset = 0, type?: "photo" | "video") => {
    return callAPI<{ data: VaultMedia[]; total: number }>("list-vault-media", {
      accountId,
      limit,
      offset,
      ...(type && { type }),
    });
  };

  const listQueue = async (accountId: string) => {
    return callAPI<{ data: Post[] }>("list-queue", { accountId });
  };

  // ========== NOTIFICATIONS ==========
  const getNotifications = async (accountId: string, limit = 50) => {
    return callAPI<{ data: unknown[] }>("get-notifications", {
      accountId,
      limit,
    });
  };

  return {
    loading,
    error,
    // Auth
    authenticate,
    listAccounts,
    getAccountInfo,
    // Earnings
    getEarnings,
    listTransactions,
    // Fans
    listFans,
    listActiveFans,
    listExpiredFans,
    getFanDetails,
    // Chats
    listChats,
    getChatMessages,
    sendMessage,
    sendMassMessage,
    // Posts
    listPosts,
    createPost,
    listVaultMedia,
    listQueue,
    // Notifications
    getNotifications,
  };
}
