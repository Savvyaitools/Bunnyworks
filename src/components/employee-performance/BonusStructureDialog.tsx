import { useState } from "react";
import { Trophy, Award, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeBonuses, BonusStructure } from "@/hooks/useEmployeeBonuses";

interface BonusStructureDialogProps {
  existingStructure?: BonusStructure;
  onClose?: () => void;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function BonusStructureDialog({ existingStructure, onClose }: BonusStructureDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { createBonusStructure, updateBonusStructure } = useEmployeeBonuses();
  
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    name: existingStructure?.name || "",
    period_month: existingStructure?.period_month || currentDate.getMonth() + 1,
    period_year: existingStructure?.period_year || currentDate.getFullYear(),
    department: existingStructure?.department || ("chatting" as "chatting" | "marketing"),
    grade_a_bonus: existingStructure?.grade_a_bonus || 200,
    grade_b_bonus: existingStructure?.grade_b_bonus || 100,
    grade_c_bonus: existingStructure?.grade_c_bonus || 50,
    grade_a_threshold: existingStructure?.grade_a_threshold || 90,
    grade_b_threshold: existingStructure?.grade_b_threshold || 75,
    grade_c_threshold: existingStructure?.grade_c_threshold || 60,
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (existingStructure) {
      await updateBonusStructure.mutateAsync({
        id: existingStructure.id,
        ...formData,
      });
    } else {
      await createBonusStructure.mutateAsync(formData);
    }

    setIsOpen(false);
    onClose?.();
  };

  const years = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Trophy className="h-4 w-4 mr-2" />
          {existingStructure ? "Edit Bonus" : "Create Bonus Structure"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>{existingStructure ? "Edit" : "Create"} Bonus Structure</DialogTitle>
          <DialogDescription>
            Define performance thresholds and bonus amounts for each grade.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Structure Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., January 2026 Chatters Bonus"
            />
          </div>

          {/* Period and Department */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={formData.period_month.toString()}
                onValueChange={(v) => setFormData({ ...formData, period_month: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={formData.period_year.toString()}
                onValueChange={(v) => setFormData({ ...formData, period_year: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.department}
                onValueChange={(v: "chatting" | "marketing") => setFormData({ ...formData, department: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chatting">Chatting</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grade A */}
          <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-warning" />
              <span className="font-semibold text-warning">Grade A</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Bonus Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.grade_a_bonus}
                  onChange={(e) => setFormData({ ...formData, grade_a_bonus: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Threshold (%)</Label>
                <Input
                  type="number"
                  value={formData.grade_a_threshold}
                  onChange={(e) => setFormData({ ...formData, grade_a_threshold: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Grade B */}
          <div className="p-4 rounded-lg border border-muted-foreground/30 bg-muted/10">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-muted-foreground">Grade B</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Bonus Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.grade_b_bonus}
                  onChange={(e) => setFormData({ ...formData, grade_b_bonus: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Threshold (%)</Label>
                <Input
                  type="number"
                  value={formData.grade_b_threshold}
                  onChange={(e) => setFormData({ ...formData, grade_b_threshold: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Grade C */}
          <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Medal className="h-5 w-5 text-orange-400" />
              <span className="font-semibold text-orange-400">Grade C</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Bonus Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.grade_c_bonus}
                  onChange={(e) => setFormData({ ...formData, grade_c_bonus: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Threshold (%)</Label>
                <Input
                  type="number"
                  value={formData.grade_c_threshold}
                  onChange={(e) => setFormData({ ...formData, grade_c_threshold: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createBonusStructure.isPending || updateBonusStructure.isPending}
            className="w-full bg-gradient-primary"
          >
            {existingStructure ? "Update" : "Create"} Bonus Structure
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
