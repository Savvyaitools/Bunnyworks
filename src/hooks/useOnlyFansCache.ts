import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOnlyFansAPI } from "./useOnlyFansAPI";
import { useAuth } from "./useAuth";

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

// Helper to get agency_id from profile or creator social account
async function getAgencyIdForAccount(accountId: string): Promise<string | null> {
  // First try to get from current user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .single();
  
  if (profile?.agency_id) {
    return profile.agency_id;
  }
  
  // Fallback: get from the creator's social account
  const { data: socialAccount } = await supabase
    .from("creator_social_accounts")
    .select("creator:creators(agency_id)")
    .eq("of_account_id", accountId)
    .single();
  
  // @ts-ignore - nested select type
  return socialAccount?.creator?.agency_id || null;
}

export function useOnlyFansCache() {
  const api = useOnlyFansAPI();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

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
        
        const { data, error } = await query.limit(50); // OnlyFans API max limit
        
        if (error) {
          console.error("Error fetching cached fans:", error);
          return [];
        }
        
        // If no cached data, trigger a sync via API and persist to DB
        if (!data || data.length === 0) {
          console.log(`[Cache MISS] No fans cached for ${accountId}, triggering API call`);
          // OnlyFans API has a max limit of 50
          const apiResult = activeOnly 
            ? await api.listActiveFans(accountId, 50, 0)
            : await api.listFans(accountId, 50, 0);
          
          if (apiResult?.data && apiResult.data.length > 0) {
            // Get agency_id for persistence
            const agencyId = await getAgencyIdForAccount(accountId);
            
            if (agencyId) {
              // Persist fans to database
              const fansToInsert = apiResult.data.map(fan => ({
                of_account_id: accountId,
                of_fan_id: fan.id,
                agency_id: agencyId,
                name: fan.name || null,
                username: fan.username || null,
                avatar_url: fan.avatar || null,
                subscribed_at: fan.subscribed_at || null,
                expires_at: fan.expires_at || null,
                total_spent: fan.total_spent || 0,
                is_active: fan.is_active ?? true,
                renew_on: false,
                synced_at: new Date().toISOString(),
              }));

              const { error: insertError } = await supabase
                .from("of_fans")
                .upsert(fansToInsert, { onConflict: "of_account_id,of_fan_id" });

              if (insertError) {
                console.error("Error caching fans:", insertError);
              } else {
                console.log(`[Cache STORED] ${fansToInsert.length} fans for ${accountId}`);
              }
            }
            
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

  // Cached chats from database - PERSISTS API RESULTS TO DB
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
          .limit(50); // OnlyFans API max limit
        
        if (error) {
          console.error("Error fetching cached chats:", error);
          return [];
        }
        
        // If no cached data, trigger API call and PERSIST results
        if (!data || data.length === 0) {
          console.log(`[Cache MISS] No chats cached for ${accountId}, triggering API call`);
          const apiResult = await api.listChats(accountId, 50, 0); // OnlyFans API max limit
          
          if (apiResult?.data && apiResult.data.length > 0) {
            // Get agency_id for persistence
            const agencyId = await getAgencyIdForAccount(accountId);
            
            if (agencyId) {
              // Persist chats to database
              const chatsToInsert = apiResult.data.map(chat => ({
                of_account_id: accountId,
                of_chat_id: chat.id,
                agency_id: agencyId,
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

              const { error: insertError } = await supabase
                .from("of_chats")
                .upsert(chatsToInsert, { onConflict: "of_account_id,of_chat_id" });

              if (insertError) {
                console.error("Error caching chats:", insertError);
              } else {
                console.log(`[Cache STORED] ${chatsToInsert.length} chats for ${accountId}`);
              }
            }
            
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
        
        // Check if cache is stale (> 5 minutes old) - refresh in background
        const oldestSync = data.reduce((oldest, chat) => {
          const syncTime = new Date(chat.synced_at || 0).getTime();
          return syncTime < oldest ? syncTime : oldest;
        }, Date.now());
        
        if (Date.now() - oldestSync > CACHE_TTL.chats) {
          console.log(`[Cache STALE] Chats for ${accountId}, refreshing in background`);
          // Trigger background refresh without blocking
          (async () => {
          try {
            const apiResult = await api.listChats(accountId, 50, 0); // OnlyFans API max limit
              if (apiResult?.data && apiResult.data.length > 0) {
                const agencyId = await getAgencyIdForAccount(accountId);
                if (agencyId) {
                  const chatsToUpdate = apiResult.data.map(chat => ({
                    of_account_id: accountId,
                    of_chat_id: chat.id,
                    agency_id: agencyId,
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
                  await supabase.from("of_chats").upsert(chatsToUpdate, { onConflict: "of_account_id,of_chat_id" });
                  queryClient.invalidateQueries({ queryKey: ["of-chats", accountId] });
                }
              }
            } catch (err) {
              console.error("Background chat refresh failed:", err);
            }
          })();
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

  // Force refresh all data for an account - fetches from API and persists
  const forceRefresh = async (accountId: string) => {
    console.log(`[Force Refresh] Starting for account ${accountId}`);
    
    // Clear existing cache
    await invalidateCache(accountId);
    
    // Get agency_id for persistence
    const agencyId = await getAgencyIdForAccount(accountId);
    
    if (!agencyId) {
      console.error("Cannot force refresh: agency_id not found");
      return;
    }
    
    // Fetch and persist chats (OnlyFans API max limit is 50)
    try {
      const chatsResult = await api.listChats(accountId, 50, 0);
      if (chatsResult?.data && chatsResult.data.length > 0) {
        const chatsToInsert = chatsResult.data.map(chat => ({
          of_account_id: accountId,
          of_chat_id: chat.id,
          agency_id: agencyId,
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
        await supabase.from("of_chats").upsert(chatsToInsert, { onConflict: "of_account_id,of_chat_id" });
        console.log(`[Force Refresh] Stored ${chatsToInsert.length} chats`);
      }
    } catch (err) {
      console.error("Failed to refresh chats:", err);
    }
    
    // Fetch and persist fans (OnlyFans API max limit is 50)
    try {
      const fansResult = await api.listActiveFans(accountId, 50, 0);
      if (fansResult?.data && fansResult.data.length > 0) {
        const fansToInsert = fansResult.data.map(fan => ({
          of_account_id: accountId,
          of_fan_id: fan.id,
          agency_id: agencyId,
          name: fan.name || null,
          username: fan.username || null,
          avatar_url: fan.avatar || null,
          subscribed_at: fan.subscribed_at || null,
          expires_at: fan.expires_at || null,
          total_spent: fan.total_spent || 0,
          is_active: fan.is_active ?? true,
          renew_on: false,
          synced_at: new Date().toISOString(),
        }));
        await supabase.from("of_fans").upsert(fansToInsert, { onConflict: "of_account_id,of_fan_id" });
        console.log(`[Force Refresh] Stored ${fansToInsert.length} fans`);
      }
    } catch (err) {
      console.error("Failed to refresh fans:", err);
    }
    
    // Refetch all queries
    await queryClient.refetchQueries({ queryKey: ["of-earnings", accountId] });
    await queryClient.refetchQueries({ queryKey: ["of-fans", accountId] });
    await queryClient.refetchQueries({ queryKey: ["of-chats", accountId] });
    
    console.log(`[Force Refresh] Complete for account ${accountId}`);
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
