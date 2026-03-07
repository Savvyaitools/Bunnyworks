import { useAgencyScopedCRUD } from "./useAgencyScopedCRUD";
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
  const crud = useAgencyScopedCRUD<TrackingLink>({
    table: "tracking_links",
    queryKey: `tracking-links-${creatorId || "all"}`,
    orderBy: { column: "created_at", ascending: false },
    extraFilter: creatorId ? { column: "creator_id", value: creatorId } : undefined,
    messages: {
      createSuccess: "Tracking link created",
      updateSuccess: "Tracking link updated",
      deleteSuccess: "Tracking link deleted",
    },
  });

  const stats = useMemo(() => {
    const links = crud.items;
    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
    const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);
    return {
      total: links.length,
      active: links.filter((l) => l.is_active).length,
      totalClicks,
      totalConversions,
      totalRevenue: links.reduce((sum, l) => sum + Number(l.revenue), 0),
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    };
  }, [crud.items]);

  return {
    trackingLinks: crud.items,
    loading: crud.loading,
    stats,
    createTrackingLink: crud.create,
    updateTrackingLink: crud.update,
    deleteTrackingLink: crud.remove,
    refetch: crud.refetch,
  };
}
