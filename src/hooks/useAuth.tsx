import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: "agency" | "creator" | "employee";
  agency_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  userType: "agency" | "creator" | "employee" | null;
  signUp: (email: string, password: string, fullName: string, userType: "agency" | "creator" | "employee") => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);
  // Monotonic sequence — every fetchProfile call gets a strictly increasing
  // id. Only the result of the latest call is ever applied to state, so a
  // slow in-flight request for user A can never overwrite a newer result
  // for user B (the "refresh flips to wrong user/agency" bug).
  const fetchSeqRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const seq = ++fetchSeqRef.current;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Discard if a newer fetch has started, or if the active user changed
    // mid-flight (logout / switch account between request and response).
    if (seq !== fetchSeqRef.current) return null;
    if (currentUserIdRef.current !== userId) return null;
    if (error) {
      console.error("[useAuth] profile fetch failed", error);
      return null;
    }
    if (data) {
      const profileData = data as Profile;
      setProfile(profileData);
      return profileData;
    }
    return null;
  };

  useEffect(() => {
    let initialSessionHandled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        const newUserId = session?.user?.id ?? null;
        const userChanged = currentUserIdRef.current !== newUserId;
        currentUserIdRef.current = newUserId;

        // If the authenticated user changed (login as different user, or
        // logout), wipe all react-query caches so the new user never sees
        // data fetched for the previous user.
        if (previousUserIdRef.current !== newUserId) {
          queryClient.clear();
          previousUserIdRef.current = newUserId;
          // Invalidate any in-flight profile fetch from the previous user.
          fetchSeqRef.current++;
          if (!newUserId) setProfile(null);
        }

        if (session?.user) {
          // Skip if getSession already handled this same user
          if (initialSessionHandled && event === "INITIAL_SESSION") return;
          // Only refetch profile when the user actually changed or on an
          // explicit sign-in. TOKEN_REFRESHED fires frequently and the
          // profile row hasn't changed — skip it to avoid pointless races.
          if (!userChanged && event !== "SIGNED_IN") return;
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialSessionHandled = true;
      setSession(session);
      setUser(session?.user ?? null);
      previousUserIdRef.current = session?.user?.id ?? null;
      currentUserIdRef.current = session?.user?.id ?? null;

      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string, fullName: string, userType: "agency" | "creator" | "employee") => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Invalidate any in-flight profile fetch before clearing state.
    fetchSeqRef.current++;
    currentUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    queryClient.clear();
    previousUserIdRef.current = null;
  };

  // Compute userType from profile or fallback to auth metadata
  const userType: "agency" | "creator" | "employee" | null = 
    profile?.user_type ?? 
    (user?.user_metadata?.user_type as "agency" | "creator" | "employee" | undefined) ?? 
    null;

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, userType, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
