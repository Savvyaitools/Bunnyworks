import { useAgencyScopedCRUD } from "./useAgencyScopedCRUD";

export interface ProxyConfig {
  id: string;
  creator_id: string;
  agency_id: string;
  provider: "browserbase" | "brightdata" | "custom";
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
  proxy_protocol: "http" | "socks5";
  is_active: boolean;
  label: string | null;
  stealth_profile: {
    enabled: boolean;
    userAgent?: string;
    screenWidth?: number;
    screenHeight?: number;
    webglVendor?: string;
    webglRenderer?: string;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    languages?: string[];
    platform?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export function useProxyConfigs() {
  const crud = useAgencyScopedCRUD<ProxyConfig>({
    table: "creator_proxy_configs",
    queryKey: "proxy-configs",
    orderBy: { column: "created_at", ascending: false },
  });

  return {
    configs: crud.items as ProxyConfig[],
    isLoading: crud.loading,
    create: crud.create,
    update: crud.update,
    remove: crud.remove,
  };
}
