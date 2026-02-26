/**
 * @deprecated This hook provides DB-backed caching for useOnlyFansAPI which is
 * itself deprecated. Earnings are now scraped via CDP in save_and_close.
 * Kept for potential future use.
 */
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

// Helper moved inside the hook so we can scope profile lookup to the logged-in user


export function useOnlyFansCache() {
  const api = useOnlyFansAPI();
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  const getAgencyIdForAccount = async (accountId: string): Promise<string | null> => {
    // Prefer already-loaded profile (fast + avoids extra queries)
    if (profile?.agency_id) return profile.agency_id;

    // Fallback to fetching ONLY the current user's profile row
    if (user?.id) {
      const { data: scopedProfile, error } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && scopedProfile?.agency_id) {
        return scopedProfile.agency_id;
      }
    }

    // Final fallback: get from the creator's social account
    const { data: socialAccount } = await supabase
      .from("creator_social_accounts")
      .select("creator:creators(agency_id)")
      .eq("of_account_id", accountId)
      .maybeSingle();

    // @ts-ignore - nested select type
    return socialAccount?.creator?.agency_id || null;
  };


  // Normalize raw API earnings data (nested or flat) into our flat interface
  const normalizeEarnings = (raw: any): EarningStatistics => {
    // Already flat format from edge function mapping
    if (typeof raw?.total === "number" && typeof raw?.tips === "number") {
      return raw as EarningStatistics;
    }

    // Real API format: data.list.months.{timestamp}.{category}[] with {gross, net} entries
    const months = raw?.data?.list?.months || {};
    let tips = 0, subscriptions = 0, messages = 0, posts = 0, referrals = 0, total = 0;

    for (const monthKey of Object.keys(months)) {
      const month = months[monthKey];
      // Sum total_net per month if available
      total += month?.total_net ?? 0;

      // Sum net from daily arrays per category
      const sumNet = (arr: any[]) => (arr || []).reduce((s: number, e: any) => s + (e?.net ?? 0), 0);
      tips += sumNet(month?.tips);
      subscriptions += sumNet(month?.subscribes);
      messages += sumNet(month?.chat_messages);
      posts += sumNet(month?.posts);
      referrals += sumNet(month?.referrals);
    }

    // If total wasn't set per-month, calculate from categories
    if (total === 0) {
      total = tips + subscriptions + messages + posts + referrals;
    }

    return { total, tips, subscriptions, messages, posts, referrals };
  };

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
          return normalizeEarnings(cached.data);
        }
        
        // 2. Cache miss or stale - call API
        console.log(`[Cache MISS] Fetching earnings for ${accountId}`);
        const data = await api.getEarnings(accountId);
        return data ? normalizeEarnings(data) : null;
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
        
        const { data, error } = await query.limit(20); // OnlyFans API max limit for fans
        
        if (error) {
          console.error("Error fetching cached fans:", error);
          throw error;
        }
        
        // If no cached data, trigger a sync via API and persist to DB
        if (!data || data.length === 0) {
          console.log(`[Cache MISS] No fans cached for ${accountId}, triggering API call`);
          // OnlyFans API has a max limit of 20 for fans
          const apiResult = activeOnly 
            ? await api.listActiveFans(accountId, 20, 0)
            : await api.listFans(accountId, 20, 0);

          if (!apiResult) {
            throw new Error(api.error ?? "Failed to fetch fans from OnlyFans");
          }
          
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
          .limit(20); // OnlyFans API max limit
        
        if (error) {
          console.error("Error fetching cached chats:", error);
          throw error;
        }
        
        // If no cached data, trigger API call and PERSIST results
        if (!data || data.length === 0) {
          console.log(`[Cache MISS] No chats cached for ${accountId}, triggering API call`);
          const apiResult = await api.listChats(accountId, 20, 0); // OnlyFans API max limit

          if (!apiResult) {
            throw new Error(api.error ?? "Failed to fetch chats from OnlyFans");
          }
          
          if (apiResult?.data && apiResult.data.length > 0) {
            // Get agency_id for persistence
            const agencyId = await getAgencyIdForAccount(accountId);
            
            if (agencyId) {
              // Persist chats to database
              const chatsToInsert = apiResult.data.map((chat: any) => {
                const fan = chat?.with_user ?? chat?.fan ?? null;
                const last = chat?.last_message ?? chat?.lastMessage ?? null;
                const ofChatId = (chat?.id ?? fan?.id)?.toString?.() ?? chat?.id ?? fan?.id;

                return {
                  of_account_id: accountId,
                  of_chat_id: String(ofChatId),
                  agency_id: agencyId,
                  of_fan_id: fan?.id ? String(fan.id) : null,
                  fan_name: fan?.name ?? fan?.displayName ?? fan?.username ?? null,
                  fan_username: fan?.username ?? null,
                  fan_avatar: fan?.avatar ?? fan?.avatar_url ?? null,
                  last_message_text: last?.text ?? null,
                  last_message_at: last?.created_at ?? last?.createdAt ?? null,
                  last_message_is_from_me: last?.is_from_me ?? last?.isFromMe ?? null,
                  unread_count: chat?.unread_count ?? chat?.unreadMessagesCount ?? 0,
                  is_pinned: false,
                  synced_at: new Date().toISOString(),
                };
              });

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
            return apiResult.data.map((chat: any) => {
              const fan = chat?.with_user ?? chat?.fan ?? null;
              const last = chat?.last_message ?? chat?.lastMessage ?? null;
              const ofChatId = (chat?.id ?? fan?.id)?.toString?.() ?? chat?.id ?? fan?.id;

              return {
                id: String(ofChatId),
                of_account_id: accountId,
                of_chat_id: String(ofChatId),
                of_fan_id: fan?.id ? String(fan.id) : null,
                fan_name: fan?.name ?? fan?.displayName ?? fan?.username ?? null,
                fan_username: fan?.username ?? null,
                fan_avatar: fan?.avatar ?? fan?.avatar_url ?? null,
                last_message_text: last?.text ?? null,
                last_message_at: last?.created_at ?? last?.createdAt ?? null,
                last_message_is_from_me: last?.is_from_me ?? last?.isFromMe ?? null,
                unread_count: chat?.unread_count ?? chat?.unreadMessagesCount ?? 0,
                is_pinned: false,
                synced_at: new Date().toISOString(),
              };
            });
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
              const apiResult = await api.listChats(accountId, 20, 0); // OnlyFans API max limit
              if (apiResult?.data && apiResult.data.length > 0) {
                const agencyId = await getAgencyIdForAccount(accountId);
                if (agencyId) {
                  const chatsToUpdate = apiResult.data.map((chat: any) => {
                    const fan = chat?.with_user ?? chat?.fan ?? null;
                    const last = chat?.last_message ?? chat?.lastMessage ?? null;
                    const ofChatId = (chat?.id ?? fan?.id)?.toString?.() ?? chat?.id ?? fan?.id;

                    return {
                      of_account_id: accountId,
                      of_chat_id: String(ofChatId),
                      agency_id: agencyId,
                      of_fan_id: fan?.id ? String(fan.id) : null,
                      fan_name: fan?.name ?? fan?.displayName ?? fan?.username ?? null,
                      fan_username: fan?.username ?? null,
                      fan_avatar: fan?.avatar ?? fan?.avatar_url ?? null,
                      last_message_text: last?.text ?? null,
                      last_message_at: last?.created_at ?? last?.createdAt ?? null,
                      last_message_is_from_me: last?.is_from_me ?? last?.isFromMe ?? null,
                      unread_count: chat?.unread_count ?? chat?.unreadMessagesCount ?? 0,
                      is_pinned: false,
                      synced_at: new Date().toISOString(),
                    };
                  });
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
    
    // Fetch and persist chats (OnlyFans API max limit is 20)
    try {
      const chatsResult = await api.listChats(accountId, 20, 0);
      if (chatsResult?.data && chatsResult.data.length > 0) {
        const chatsToInsert = chatsResult.data.map((chat: any) => {
          const fan = chat?.with_user ?? chat?.fan ?? null;
          const last = chat?.last_message ?? chat?.lastMessage ?? null;
          const ofChatId = (chat?.id ?? fan?.id)?.toString?.() ?? chat?.id ?? fan?.id;

          return {
            of_account_id: accountId,
            of_chat_id: String(ofChatId),
            agency_id: agencyId,
            of_fan_id: fan?.id ? String(fan.id) : null,
            fan_name: fan?.name ?? fan?.displayName ?? fan?.username ?? null,
            fan_username: fan?.username ?? null,
            fan_avatar: fan?.avatar ?? fan?.avatar_url ?? null,
            last_message_text: last?.text ?? null,
            last_message_at: last?.created_at ?? last?.createdAt ?? null,
            last_message_is_from_me: last?.is_from_me ?? last?.isFromMe ?? null,
            unread_count: chat?.unread_count ?? chat?.unreadMessagesCount ?? 0,
            is_pinned: false,
            synced_at: new Date().toISOString(),
          };
        });
        await supabase.from("of_chats").upsert(chatsToInsert, { onConflict: "of_account_id,of_chat_id" });
        console.log(`[Force Refresh] Stored ${chatsToInsert.length} chats`);
      }
    } catch (err) {
      console.error("Failed to refresh chats:", err);
    }
    
    // Fetch and persist fans (OnlyFans API max limit is 20)
    try {
      const fansResult = await api.listActiveFans(accountId, 20, 0);
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
