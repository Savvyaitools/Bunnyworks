import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";

export interface ProxyConfig {
  id: string;
  agency_id: string;
  name: string;
  proxy_type: string;
  provider: string;
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  protocol: string;
  country: string | null;
  state: string | null;
  city: string | null;
  is_rotating: boolean;
  sticky_session_ttl: number | null;
  is_default: boolean;
  is_active: boolean;
  health_status: string;
  last_health_check_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProxyConfigs() {
  const { agency } = useAgency();
  const agencyId = agency?.id;
  const qc = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["proxy-configs", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_proxy_configs")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProxyConfig[];
    },
    enabled: !!agencyId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["proxy-configs", agencyId] });

  const createConfig = useMutation({
    mutationFn: async (config: Partial<ProxyConfig>) => {
      const { data, error } = await supabase
        .from("agency_proxy_configs")
        .insert({ ...config, agency_id: agencyId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Proxy configuration saved"); invalidate(); },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProxyConfig> & { id: string }) => {
      const { error } = await supabase
        .from("agency_proxy_configs")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proxy updated"); invalidate(); },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agency_proxy_configs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proxy removed"); invalidate(); },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  const assignToCreator = useMutation({
    mutationFn: async ({ creatorId, configId }: { creatorId: string; configId: string | null }) => {
      const { error } = await supabase
        .from("creators")
        .update({ proxy_config_id: configId } as any)
        .eq("id", creatorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proxy assigned to creator");
      qc.invalidateQueries({ queryKey: ["creators"] });
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  return {
    configs: configs ?? [],
    isLoading,
    createConfig,
    updateConfig,
    deleteConfig,
    assignToCreator,
  };
}
