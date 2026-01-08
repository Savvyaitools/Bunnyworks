import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface OFPermissions {
  id: string;
  agency_id: string;
  employee_id: string;
  creator_id: string;
  can_view_chats: boolean;
  can_send_messages: boolean;
  can_send_mass_messages: boolean;
  can_view_fans: boolean;
  can_view_posts: boolean;
  can_create_posts: boolean;
  can_view_vault: boolean;
  can_view_earnings: boolean;
  can_view_notifications: boolean;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionUpdate {
  can_view_chats?: boolean;
  can_send_messages?: boolean;
  can_send_mass_messages?: boolean;
  can_view_fans?: boolean;
  can_view_posts?: boolean;
  can_create_posts?: boolean;
  can_view_vault?: boolean;
  can_view_earnings?: boolean;
  can_view_notifications?: boolean;
}

// Preset permission configurations
export const PERMISSION_PRESETS = {
  chatter: {
    can_view_chats: true,
    can_send_messages: true,
    can_send_mass_messages: false,
    can_view_fans: true,
    can_view_posts: false,
    can_create_posts: false,
    can_view_vault: false,
    can_view_earnings: false,
    can_view_notifications: true,
  },
  manager: {
    can_view_chats: true,
    can_send_messages: true,
    can_send_mass_messages: true,
    can_view_fans: true,
    can_view_posts: true,
    can_create_posts: true,
    can_view_vault: true,
    can_view_earnings: true,
    can_view_notifications: true,
  },
  none: {
    can_view_chats: false,
    can_send_messages: false,
    can_send_mass_messages: false,
    can_view_fans: false,
    can_view_posts: false,
    can_create_posts: false,
    can_view_vault: false,
    can_view_earnings: false,
    can_view_notifications: false,
  },
};

// Hook for employees to check their own permissions
export function useMyOFPermissions(creatorId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-of-permissions", creatorId],
    queryFn: async () => {
      if (!user || !creatorId) return null;

      // Get employee record for current user
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee) return null;

      const { data, error } = await supabase
        .from("employee_of_permissions")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("creator_id", creatorId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching permissions:", error);
        return null;
      }

      return data as OFPermissions | null;
    },
    enabled: !!user && !!creatorId,
  });
}

// Hook for employees to get all their permissions
export function useAllMyOFPermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-my-of-permissions"],
    queryFn: async () => {
      if (!user) return [];

      // Get employee record for current user
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee) return [];

      const { data, error } = await supabase
        .from("employee_of_permissions")
        .select(`
          *,
          creator:creators(id, name, alias, avatar_url)
        `)
        .eq("employee_id", employee.id);

      if (error) {
        console.error("Error fetching permissions:", error);
        return [];
      }

      return data as (OFPermissions & { creator: { id: string; name: string; alias: string | null; avatar_url: string | null } })[];
    },
    enabled: !!user,
  });
}

// Hook for agency admins to manage permissions
export function useOFPermissionsManagement(creatorId?: string) {
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: ["creator-of-permissions", creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      const { data, error } = await supabase
        .from("employee_of_permissions")
        .select(`
          *,
          employee:employees(id, name, email, role)
        `)
        .eq("creator_id", creatorId);

      if (error) {
        console.error("Error fetching permissions:", error);
        return [];
      }

      return data as (OFPermissions & { employee: { id: string; name: string; email: string; role: string } })[];
    },
    enabled: !!creatorId,
  });

  const grantPermission = useMutation({
    mutationFn: async ({ 
      employeeId, 
      creatorId, 
      permissions 
    }: { 
      employeeId: string; 
      creatorId: string; 
      permissions: PermissionUpdate 
    }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id, id")
        .single();

      if (!profile?.agency_id) {
        throw new Error("Agency not found");
      }

      const { data, error } = await supabase
        .from("employee_of_permissions")
        .upsert({
          agency_id: profile.agency_id,
          employee_id: employeeId,
          creator_id: creatorId,
          granted_by: profile.id,
          ...permissions,
        }, {
          onConflict: "employee_id,creator_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-of-permissions"] });
      toast.success("Permissions updated!");
    },
    onError: (error) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    },
  });

  const revokePermission = useMutation({
    mutationFn: async ({ employeeId, creatorId }: { employeeId: string; creatorId: string }) => {
      const { error } = await supabase
        .from("employee_of_permissions")
        .delete()
        .eq("employee_id", employeeId)
        .eq("creator_id", creatorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-of-permissions"] });
      toast.success("Permissions revoked!");
    },
    onError: (error) => {
      toast.error(`Failed to revoke permissions: ${error.message}`);
    },
  });

  const applyPreset = useMutation({
    mutationFn: async ({ 
      employeeId, 
      creatorId, 
      preset 
    }: { 
      employeeId: string; 
      creatorId: string; 
      preset: keyof typeof PERMISSION_PRESETS 
    }) => {
      return grantPermission.mutateAsync({
        employeeId,
        creatorId,
        permissions: PERMISSION_PRESETS[preset],
      });
    },
  });

  return {
    permissions: permissionsQuery.data || [],
    isLoading: permissionsQuery.isLoading,
    grantPermission,
    revokePermission,
    applyPreset,
  };
}

// Hook for activity logs
export function useOFActivityLogs(creatorId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ["of-activity-logs", creatorId, employeeId],
    queryFn: async () => {
      let query = supabase
        .from("employee_of_activity_logs")
        .select(`
          *,
          employee:employees(id, name),
          creator:creators(id, name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (creatorId) {
        query = query.eq("creator_id", creatorId);
      }

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching activity logs:", error);
        return [];
      }

      return data;
    },
    enabled: !!creatorId || !!employeeId,
  });
}
