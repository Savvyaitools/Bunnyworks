/**
 * Higher-level CRUD hook that auto-injects agency_id, checks entity limits,
 * and invalidates limit counters on create/delete.
 *
 * Eliminates duplicated wrapper logic across useCreators, useEmployees,
 * useRecruitingCreators, useTrackingLinks, etc.
 */

import { useCallback } from "react";
import { useAgency } from "./useAgency";
import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { toast } from "sonner";

interface AgencyScopedCRUDConfig {
  table: string;
  queryKey: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  /** Extra filters beyond agency_id (e.g. creator_id scoping) */
  extraFilter?: { column: string; value: unknown };
  extraFilters?: { column: string; value: unknown }[];
  enabled?: boolean;
  pageSize?: number;
  messages?: {
    createSuccess?: string;
    createError?: string;
    updateSuccess?: string;
    updateError?: string;
    deleteSuccess?: string;
    deleteError?: string;
  };
  /**
   * Which limit to check before creating.
   * 'creator' checks canAddCreator, 'employee' checks canAddEmployee.
   * Omit to skip limit checks.
   */
  limitType?: "creator" | "employee";
}

export function useAgencyScopedCRUD<T extends { id: string }>(config: AgencyScopedCRUDConfig) {
  const {
    table,
    queryKey,
    select,
    orderBy,
    extraFilter,
    extraFilters,
    enabled = true,
    pageSize,
    messages,
    limitType,
  } = config;

  const { agencyId, limits, invalidateLimits } = useAgency();

  // Build filters: always include agency_id + any extras
  const filter = extraFilter ?? (agencyId ? { column: "agency_id", value: agencyId } : undefined);
  const filters = extraFilter && agencyId
    ? [{ column: "agency_id", value: agencyId }, ...(extraFilters ?? [])]
    : extraFilters;

  // If extraFilter is set but we still need agency scoping, use filters array
  const effectiveFilter = extraFilter
    ? undefined // use filters array instead
    : (agencyId ? { column: "agency_id", value: agencyId } : undefined);

  const effectiveFilters = extraFilter
    ? [{ column: "agency_id", value: agencyId! }, extraFilter, ...(extraFilters ?? [])]
    : extraFilters;

  const crud = useSupabaseCRUD<T>({
    table,
    queryKey,
    select,
    orderBy,
    enabled: enabled && Boolean(agencyId),
    filter: effectiveFilter,
    filters: effectiveFilters,
    pageSize,
    messages,
  });

  /** Create with auto agency_id injection + optional limit check */
  const createScoped = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (input: Record<string, any>) => {
      if (!agencyId) {
        toast.error("Agency not found. Please log in again.");
        throw new Error("Agency ID not found");
      }

      if (limitType && limits) {
        if (limitType === "creator" && !limits.canAddCreator) {
          toast.error(
            `Creator limit reached (${limits.currentCreators}/${limits.maxCreators}). Upgrade your plan to add more creators.`
          );
          throw new Error("Creator limit reached");
        }
        if (limitType === "employee" && !limits.canAddEmployee) {
          toast.error(
            `Employee limit reached (${limits.currentEmployees}/${limits.maxEmployees}). Upgrade your plan to add more employees.`
          );
          throw new Error("Employee limit reached");
        }
      }

      const result = await crud.create({ ...input, agency_id: agencyId });
      if (limitType) invalidateLimits();
      return result;
    },
    [crud, agencyId, limits, limitType, invalidateLimits]
  );

  /** Delete with limit invalidation */
  const deleteScoped = useCallback(
    async (id: string) => {
      const result = await crud.remove(id);
      if (limitType) invalidateLimits();
      return result;
    },
    [crud, limitType, invalidateLimits]
  );

  return {
    ...crud,
    create: createScoped,
    remove: deleteScoped,
    agencyId,
    limits,
  };
}
