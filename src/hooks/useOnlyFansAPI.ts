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
    return callAPI<{ data: unknown[]; total: number }>("list-fans", {
      accountId,
      limit,
      offset,
    });
  };

  return {
    loading,
    error,
    authenticate,
    listAccounts,
    getAccountInfo,
    getEarnings,
    listTransactions,
    listFans,
  };
}
