import { useSupabaseCRUD } from "./useSupabaseCRUD";
import { useAgency } from "./useAgency";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMemo, useCallback } from "react";

export type ApplicationType = "creator" | "employee";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface PendingApplication {
  id: string;
  agency_id: string;
  application_type: ApplicationType;
  name: string;
  email: string;
  phone: string | null;
  platform: string | null;
  followers: string | null;
  onlyfans_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  snapchat_url: string | null;
  role_preference: string | null;
  department_preference: string | null;
  experience: string | null;
  skills: string[] | null;
  bio: string | null;
  notes: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationInput {
  agency_id: string;
  application_type: ApplicationType;
  name: string;
  email: string;
  phone?: string;
  platform?: string;
  followers?: string;
  onlyfans_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  snapchat_url?: string;
  role_preference?: string;
  department_preference?: string;
  experience?: string;
  skills?: string[];
  bio?: string;
  notes?: string;
}

export function usePendingApplications() {
  const { agencyId } = useAgency();
  const queryClient = useQueryClient();

  const crud = useSupabaseCRUD<PendingApplication>({
    table: "pending_applications",
    queryKey: "pending_applications",
    orderBy: { column: "submitted_at", ascending: false },
    messages: {
      updateSuccess: "Application updated",
      deleteSuccess: "Application deleted",
    },
  });

  const stats = useMemo(() => ({
    total: crud.items.length,
    pending: crud.items.filter((a) => a.status === "pending").length,
    approved: crud.items.filter((a) => a.status === "approved").length,
    rejected: crud.items.filter((a) => a.status === "rejected").length,
    creators: crud.items.filter((a) => a.application_type === "creator").length,
    employees: crud.items.filter((a) => a.application_type === "employee").length,
  }), [crud.items]);

  // Approve and create creator
  const approveCreatorMutation = useMutation({
    mutationFn: async (application: PendingApplication) => {
      // Create creator record
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .insert({
          agency_id: application.agency_id,
          name: application.name,
          email: application.email,
          phone: application.phone,
          platform: application.platform,
          followers: application.followers,
          onlyfans_url: application.onlyfans_url,
          instagram_url: application.instagram_url,
          tiktok_url: application.tiktok_url,
          twitter_url: application.twitter_url,
          snapchat_url: application.snapchat_url,
          notes: application.notes,
          status: "Onboarding",
        })
        .select()
        .single();

      if (creatorError) throw creatorError;

      // Update application status
      const { error: updateError } = await supabase
        .from("pending_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      return creator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_applications"] });
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      toast.success("Creator application approved and creator added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Approve and create employee
  const approveEmployeeMutation = useMutation({
    mutationFn: async (application: PendingApplication) => {
      // Create employee record
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .insert({
          agency_id: application.agency_id,
          name: application.name,
          email: application.email,
          phone: application.phone,
          role: application.role_preference || "Chatter",
          department: application.department_preference,
          experience: application.experience,
          skills: application.skills,
          bio: application.bio,
          status: "Active",
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Update application status
      const { error: updateError } = await supabase
        .from("pending_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_applications"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee application approved and employee added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Reject application
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase
        .from("pending_applications")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_applications"] });
      toast.success("Application rejected");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const approveApplication = useCallback(async (application: PendingApplication) => {
    if (application.application_type === "creator") {
      return approveCreatorMutation.mutateAsync(application);
    } else {
      return approveEmployeeMutation.mutateAsync(application);
    }
  }, [approveCreatorMutation, approveEmployeeMutation]);

  return {
    applications: crud.items,
    loading: crud.loading,
    stats,
    approveApplication,
    rejectApplication: rejectMutation.mutateAsync,
    deleteApplication: crud.remove,
    refetch: crud.refetch,
    isApproving: approveCreatorMutation.isPending || approveEmployeeMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// Hook for public form submission (no auth required)
export function useSubmitApplication() {
  const submitMutation = useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const { data, error } = await supabase
        .from("pending_applications")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });

  return {
    submit: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}
