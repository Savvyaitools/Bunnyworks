import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useMemo, useCallback } from "react";
import { useAgency } from "./useAgency";

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
  agency_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateChatterInput = Omit<Chatter, "id" | "created_at" | "updated_at" | "agency_id">;
export type UpdateChatterInput = Partial<CreateChatterInput>;

export function useChatters() {
  const { agencyId } = useAgency();

  const crud = useSupabaseCRUD<Chatter>({
    table: "chatters",
    queryKey: "chatters",
    orderBy: { column: "created_at", ascending: false },
    messages: {
      createSuccess: "Chatter added successfully",
      updateSuccess: "Chatter updated successfully",
      deleteSuccess: "Chatter removed successfully",
    },
  });

  const stats = useMemo(() => ({
    total: crud.items.length,
    active: crud.items.filter((c) => c.is_active).length,
    gradeA: crud.items.filter((c) => c.skill_grade === "A").length,
    gradeB: crud.items.filter((c) => c.skill_grade === "B").length,
    gradeC: crud.items.filter((c) => c.skill_grade === "C").length,
  }), [crud.items]);

  // Wrapper that adds agency_id when creating
  const createChatter = useCallback(async (input: CreateChatterInput) => {
    return crud.create({ ...input, agency_id: agencyId });
  }, [crud, agencyId]);

  return {
    chatters: crud.items,
    loading: crud.loading,
    stats,
    createChatter,
    updateChatter: crud.update,
    deleteChatter: crud.remove,
  };
}
