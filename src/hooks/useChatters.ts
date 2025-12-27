import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SkillGrade = "A" | "B" | "C";

export interface Chatter {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  skill_grade: SkillGrade;
  timezone: string | null;
  is_active: boolean;
  avatar_seed: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateChatterInput = Omit<Chatter, "id" | "created_at" | "updated_at">;
export type UpdateChatterInput = Partial<CreateChatterInput>;

export function useChatters() {
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChatters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("chatters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChatters(data as Chatter[]);
    } catch (error) {
      console.error("Error fetching chatters:", error);
      toast.error("Failed to load chatters");
    } finally {
      setLoading(false);
    }
  }, []);

  const createChatter = async (input: CreateChatterInput) => {
    try {
      const { data, error } = await supabase
        .from("chatters")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      setChatters((prev) => [data as Chatter, ...prev]);
      toast.success("Chatter added successfully");
      return data as Chatter;
    } catch (error) {
      console.error("Error creating chatter:", error);
      toast.error("Failed to add chatter");
      return null;
    }
  };

  const updateChatter = async (id: string, input: UpdateChatterInput) => {
    try {
      const { data, error } = await supabase
        .from("chatters")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setChatters((prev) => prev.map((c) => (c.id === id ? (data as Chatter) : c)));
      toast.success("Chatter updated successfully");
      return data as Chatter;
    } catch (error) {
      console.error("Error updating chatter:", error);
      toast.error("Failed to update chatter");
      return null;
    }
  };

  const deleteChatter = async (id: string) => {
    try {
      const { error } = await supabase.from("chatters").delete().eq("id", id);

      if (error) throw error;
      setChatters((prev) => prev.filter((c) => c.id !== id));
      toast.success("Chatter removed successfully");
      return true;
    } catch (error) {
      console.error("Error deleting chatter:", error);
      toast.error("Failed to remove chatter");
      return false;
    }
  };

  useEffect(() => {
    fetchChatters();
  }, [fetchChatters]);

  const stats = {
    total: chatters.length,
    active: chatters.filter((c) => c.is_active).length,
    gradeA: chatters.filter((c) => c.skill_grade === "A").length,
    gradeB: chatters.filter((c) => c.skill_grade === "B").length,
    gradeC: chatters.filter((c) => c.skill_grade === "C").length,
  };

  return {
    chatters,
    loading,
    stats,
    createChatter,
    updateChatter,
    deleteChatter,
    refetch: fetchChatters,
  };
}
