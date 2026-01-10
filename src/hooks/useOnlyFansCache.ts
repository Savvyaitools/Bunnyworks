import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOnlyFansAPI } from "./useOnlyFansAPI";

// Cache TTL in milliseconds
const CACHE_TTL = {
  earnings: 4 * 60 * 60 * 1000,      // 4 hours
  fans: 1 * 60 * 60 * 1000,          // 1 hour
  chats: 5 * 60 * 1000,              // 5 minutes
  vault: 24 * 60 * 60 * 1000,        // 24 hours
  account: 6 * 60 * 60 * 1000,       // 6 hours
  posts: 2 * 60 * 60 * 1000,         // 2 hours
};

interface CacheEntry {
  of_account_id: string;
  cache_key: string;
  data: unknown;
  cached_at: string;
  expires_at: string;
}

interface EarningStatistics {
  total: number;
  tips: number;
  subscriptions: number;
  messages: number;
  posts: number;
  referrals: number;
}

interface CachedFan {
  id: string;
  of_account_id: string;
  of_fan_id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  subscribed_at: string | null;
  expires_at: string | null;
  total_spent: number;
  is_active: boolean;
  renew_on: boolean;
  synced_at: string;
}

interface CachedChat {
  id: string;
  of_account_id: string;
  of_chat_id: string;
  of_fan_id: string | null;
  fan_name: string | null;
  fan_username: string | null;
  fan_avatar: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  last_message_is_from_me: boolean | null;
  unread_count: number;
  is_pinned: boolean;
  synced_at: string;
}

function isCacheValid(cachedAt: string, ttlMs: number): boolean {
  const cachedTime = new Date(cachedAt).getTime();
  return Date.now() - cachedTime < ttlMs;
}

async function getCacheEntry(accountId: string, cacheKey: string): Promise<CacheEntry | null> {
  const { data } = await supabase
    .from("of_cache")
    .select("*")
    .eq("of_account_id", accountId)
    .eq("cache_key", cacheKey)
    .single();
  
  return data as CacheEntry | null;
}

export function useOnlyFansCache() {
  const api = useOnlyFansAPI();
  const queryClient = useQueryClient();

  // Cached earnings hook with database-first approach
  const useCachedEarnings = (accountId: string | null, enabled = true) => {
    return useQuery({
      queryKey: ["of-earnings", accountId],
      queryFn: async (): Promise<EarningStatistics | null> => {
        if (!accountId) return null;
        
        // 1. Check database cache first
        const cached = await getCacheEntry(accountId, "earnings");
        if (cached && isCacheValid(cached.cached_at, CACHE_TTL.earnings)) {
          console.log(`[Cache HIT] Earnings for ${accountId}`);
          return cached.data as EarningStatistics;
        }
        
        // 2. Cache miss or stale - call API
        console.log(`[Cache MISS] Fetching earnings for ${accountId}`);
        const data = await api.getEarnings(accountId);
        return data;
      },
      enabled: enabled && !!accountId,
      staleTime: 15 * 60 * 1000, // 15 minutes in-memory
      gcTime: 60 * 60 * 1000,    // 1 hour cache retention
    });
  };

  // Cached fans from database
  const useCachedFans = (accountId: string | null, activeOnly = true, enabled = true) => {
    return useQuery({
      queryKey: ["of-fans", accountId, activeOnly],
      queryFn: async (): Promise<CachedFan[]> => {
        if (!accountId) return [];
        
        // Get fans from database cache
        let query = supabase
          .from("of_fans")
          .select("*")
          .eq("of_account_id", accountId)
          .order("total_spent", { ascending: false });
        
        if (activeOnly) {
          query = query.eq("is_active", true);
        }
        
        const { data, error } = await query.limit(100);
        
        if (error) {
          console.error("Error fetching cached fans:", error);
          return [];
        }
        
        // If no cached data, trigger a sync via API
        if (!data || data.length === 0) {
          console.log(`[Cache MISS] No fans cached for ${accountId}, triggering API call`);
          const apiResult = activeOnly 
            ? await api.listActiveFans(accountId, 100, 0)
            : await api.listFans(accountId, 100, 0);
          
          if (apiResult?.data) {
            // Transform API data to match CachedFan interface
            return apiResult.data.map(fan => ({
              id: fan.id,
              of_account_id: accountId,
              of_fan_id: fan.id,
              name: fan.name,
              username: fan.username,
              avatar_url: fan.avatar || null,
              subscribed_at: fan.subscribed_at || null,
              expires_at: fan.expires_at || null,
              total_spent: fan.total_spent || 0,
              is_active: fan.is_active ?? true,
              renew_on: false,
              synced_at: new Date().toISOString(),
            }));
          }
          return [];
        }
        
        console.log(`[Cache HIT] ${data.length} fans for ${accountId}`);
        return data as CachedFan[];
      },
      enabled: enabled && !!accountId,
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes
    });
  };

  // Cached chats from database
  const useCachedChats = (accountId: string | null, enabled = true) => {
    return useQuery({
      queryKey: ["of-chats", accountId],
      queryFn: async (): Promise<CachedChat[]> => {
        if (!accountId) return [];
        
        // Get chats from database cache
        const { data, error } = await supabase
          .from("of_chats")
          .select("*")
          .eq("of_account_id", accountId)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(100);
        
        if (error) {
          console.error("Error fetching cached chats:", error);
          return [];
        }
        
        // If no cached data or very stale, trigger API call
        if (!data || data.length === 0) {
          console.log(`[Cache MISS] No chats cached for ${accountId}, triggering API call`);
          const apiResult = await api.listChats(accountId, 100, 0);
          
          if (apiResult?.data) {
            // Transform API data to match CachedChat interface
            return apiResult.data.map(chat => ({
              id: chat.id,
              of_account_id: accountId,
              of_chat_id: chat.id,
              of_fan_id: chat.with_user?.id || null,
              fan_name: chat.with_user?.name || null,
              fan_username: chat.with_user?.username || null,
              fan_avatar: chat.with_user?.avatar || null,
              last_message_text: chat.last_message?.text || null,
              last_message_at: chat.last_message?.created_at || null,
              last_message_is_from_me: chat.last_message?.is_from_me || null,
              unread_count: chat.unread_count || 0,
              is_pinned: false,
              synced_at: new Date().toISOString(),
            }));
          }
          return [];
        }
        
        // Check if cache is stale (> 5 minutes old)
        const oldestSync = data.reduce((oldest, chat) => {
          const syncTime = new Date(chat.synced_at).getTime();
          return syncTime < oldest ? syncTime : oldest;
        }, Date.now());
        
        if (Date.now() - oldestSync > CACHE_TTL.chats) {
          console.log(`[Cache STALE] Chats for ${accountId}, refreshing in background`);
          // Trigger background refresh without blocking
          api.listChats(accountId, 100, 0).catch(console.error);
        }
        
        console.log(`[Cache HIT] ${data.length} chats for ${accountId}`);
        return data as CachedChat[];
      },
      enabled: enabled && !!accountId,
      staleTime: 1 * 60 * 1000,  // 1 minute
      gcTime: 10 * 60 * 1000,    // 10 minutes
    });
  };

  // Invalidate cache for an account
  const invalidateCache = async (accountId: string, cacheKeys?: string[]) => {
    const keys = cacheKeys || ["earnings", "fans", "chats"];
    
    // Invalidate React Query cache
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [`of-${key}`, accountId] });
    });
    
    // Optionally invalidate database cache
    for (const key of keys) {
      await supabase
        .from("of_cache")
        .delete()
        .eq("of_account_id", accountId)
        .eq("cache_key", key);
    }
  };

  // Force refresh all data for an account
  const forceRefresh = async (accountId: string) => {
    await invalidateCache(accountId);
    
    // Refetch all queries
    await queryClient.refetchQueries({ queryKey: ["of-earnings", accountId] });
    await queryClient.refetchQueries({ queryKey: ["of-fans", accountId] });
    await queryClient.refetchQueries({ queryKey: ["of-chats", accountId] });
  };

  return {
    useCachedEarnings,
    useCachedFans,
    useCachedChats,
    invalidateCache,
    forceRefresh,
    // Re-export original API for non-cached actions
    api,
  };
}
