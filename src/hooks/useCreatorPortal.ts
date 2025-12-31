import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CreatorTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface CreatorInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
}

export interface CreatorEarning {
  id: string;
  amount: number;
  period_start: string;
  period_end: string;
  platform: string | null;
  notes: string | null;
}

export interface CreatorProfile {
  id: string;
  name: string;
  email: string;
  status: string;
}

export function useCreatorPortal() {
  const { user, profile } = useAuth();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [tasks, setTasks] = useState<CreatorTask[]>([]);
  const [invoices, setInvoices] = useState<CreatorInvoice[]>([]);
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the creator record matching the logged-in user's email (case-insensitive)
  const fetchCreatorId = useCallback(async () => {
    if (!user?.email) return null;

    const { data, error } = await supabase
      .from("creators")
      .select("id, name, email, status")
      .ilike("email", user.email)
      .maybeSingle();

    if (!error && data) {
      setCreatorId(data.id);
      setCreatorProfile(data);
      return data.id;
    }
    return null;
  }, [user?.email]);

  const fetchTasks = useCallback(async (cId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, priority, status, due_date, created_at")
      .eq("creator_id", cId)
      .order("created_at", { ascending: false });

    if (!error) {
      setTasks(data || []);
    }
  }, []);

  const fetchInvoices = useCallback(async (cId: string) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, amount, status, issue_date, due_date, notes")
      .eq("creator_id", cId)
      .order("issue_date", { ascending: false });

    if (!error) {
      setInvoices(data || []);
    }
  }, []);

  const fetchEarnings = useCallback(async (cId: string) => {
    const { data, error } = await supabase
      .from("creator_earnings")
      .select("*")
      .eq("creator_id", cId)
      .order("period_end", { ascending: false });

    if (!error) {
      setEarnings(data || []);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const cId = await fetchCreatorId();
      if (cId) {
        await Promise.all([
          fetchTasks(cId),
          fetchInvoices(cId),
          fetchEarnings(cId),
        ]);
      }
      setLoading(false);
    };

    if (user && profile?.user_type === "creator") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, profile, fetchCreatorId, fetchTasks, fetchInvoices, fetchEarnings]);

  // Computed stats
  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
  const activeTasks = tasks.filter((t) => t.status !== "Completed").length;
  const pendingInvoices = invoices.filter((i) => i.status === "Pending").length;
  const pendingInvoiceAmount = invoices
    .filter((i) => i.status === "Pending")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    creatorId,
    creatorProfile,
    tasks,
    invoices,
    earnings,
    loading,
    totalEarnings,
    activeTasks,
    pendingInvoices,
    pendingInvoiceAmount,
    refetchTasks: () => creatorId && fetchTasks(creatorId),
    refetchInvoices: () => creatorId && fetchInvoices(creatorId),
    refetchEarnings: () => creatorId && fetchEarnings(creatorId),
  };
}
