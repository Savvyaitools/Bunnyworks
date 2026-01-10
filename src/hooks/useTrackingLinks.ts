import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useAgency } from "./useAgency";
import { useCallback, useMemo } from "react";

export interface TrackingLink {
  id: string;
  agency_id: string;
  creator_id: string;
  of_account_id: string | null;
  name: string;
  code: string;
  url: string;
  campaign: string | null;
  source: string | null;
  clicks: number;
  conversions: number;
  revenue: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateTrackingLinkInput = Omit<
  TrackingLink,
  "id" | "created_at" | "updated_at" | "agency_id" | "clicks" | "conversions" | "revenue"
>;

export type UpdateTrackingLinkInput = Partial<
  Omit<TrackingLink, "id" | "created_at" | "updated_at" | "agency_id">
>;

export function useTrackingLinks(creatorId?: string) {
  const { agencyId } = useAgency();

  const crud = useSupabaseCRUD<TrackingLink>({
    table: "tracking_links",
    queryKey: `tracking-links-${creatorId || "all"}`,
    orderBy: { column: "created_at", ascending: false },
    filter: creatorId ? { column: "creator_id", value: creatorId } : undefined,
    messages: {
      createSuccess: "Tracking link created",
      updateSuccess: "Tracking link updated",
      deleteSuccess: "Tracking link deleted",
    },
  });

  const createTrackingLink = useCallback(
    async (input: CreateTrackingLinkInput) => {
      if (!agencyId) throw new Error("Agency ID not found");
      return crud.create({ ...input, agency_id: agencyId });
    },
    [crud, agencyId]
  );

  const stats = useMemo(() => {
    const links = crud.items;
    return {
      total: links.length,
      active: links.filter((l) => l.is_active).length,
      totalClicks: links.reduce((sum, l) => sum + l.clicks, 0),
      totalConversions: links.reduce((sum, l) => sum + l.conversions, 0),
      totalRevenue: links.reduce((sum, l) => sum + Number(l.revenue), 0),
      conversionRate:
        links.reduce((sum, l) => sum + l.clicks, 0) > 0
          ? (links.reduce((sum, l) => sum + l.conversions, 0) /
              links.reduce((sum, l) => sum + l.clicks, 0)) *
            100
          : 0,
    };
  }, [crud.items]);

  return {
    trackingLinks: crud.items,
    loading: crud.loading,
    stats,
    createTrackingLink,
    updateTrackingLink: crud.update,
    deleteTrackingLink: crud.remove,
    refetch: crud.refetch,
  };
}
