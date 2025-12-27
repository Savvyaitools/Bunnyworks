import { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatorEarning {
  id: string;
  amount: number;
  period_start: string;
  period_end: string;
  platform: string | null;
  notes: string | null;
  creator_id: string;
  created_at: string;
}

interface CreatorEarningsProps {
  creatorId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function CreatorEarnings({ creatorId }: CreatorEarningsProps) {
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    period_start: "",
    period_end: "",
    platform: "",
    notes: "",
  });

  const fetchEarnings = useCallback(async () => {
    const { data, error } = await supabase
      .from("creator_earnings")
      .select("*")
      .eq("creator_id", creatorId)
      .order("period_start", { ascending: false });

    if (data) setEarnings(data as CreatorEarning[]);
  }, [creatorId]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const addEarning = async () => {
    if (!formData.amount || !formData.period_start || !formData.period_end) return;

    const { error } = await supabase
      .from("creator_earnings")
      .insert({
        amount: parseFloat(formData.amount),
        period_start: formData.period_start,
        period_end: formData.period_end,
        platform: formData.platform || null,
        notes: formData.notes || null,
        creator_id: creatorId,
      });

    if (error) {
      toast.error("Failed to add earning record");
    } else {
      toast.success("Earning record added");
      setFormData({ amount: "", period_start: "", period_end: "", platform: "", notes: "" });
      setIsAddOpen(false);
      fetchEarnings();
    }
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgEarnings = earnings.length > 0 ? totalEarnings / earnings.length : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalEarnings)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average per Period</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(avgEarnings)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Periods</p>
              <p className="text-xl font-bold text-foreground">{earnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Earning */}
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Earning
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Earning Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Period Start</label>
                  <Input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Period End</label>
                  <Input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  />
                </div>
              </div>
              <Input
                placeholder="Platform (optional)"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
              <Input
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <Button onClick={addEarning} className="w-full">Add Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Earnings List */}
      <div className="space-y-3">
        {earnings.map((earning) => (
          <div
            key={earning.id}
            className="p-4 rounded-lg border border-border bg-card flex items-center justify-between"
          >
            <div>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(Number(earning.amount))}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{new Date(earning.period_start).toLocaleDateString()}</span>
                <span>-</span>
                <span>{new Date(earning.period_end).toLocaleDateString()}</span>
                {earning.platform && (
                  <>
                    <span>•</span>
                    <span>{earning.platform}</span>
                  </>
                )}
              </div>
              {earning.notes && (
                <p className="text-xs text-muted-foreground mt-1">{earning.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {earnings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No earnings recorded yet. Add your first earning record.</p>
        </div>
      )}
    </div>
  );
}
