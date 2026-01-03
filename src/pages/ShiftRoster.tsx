import { useState, useMemo } from "react";
import { 
  Plus, ChevronLeft, ChevronRight, 
  AlertTriangle, Settings, Users
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useChatterShifts, CreateShiftInput } from "@/hooks/useChatterShifts";
import { useChatters } from "@/hooks/useChatters";
import { useCreators } from "@/hooks/useCreators";
import { useChatterTimeLogs } from "@/hooks/useChatterTimeLogs";
import { TimeAnalytics } from "@/components/shifts";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";

// Shift time blocks configuration
const SHIFT_BLOCKS = [
  { id: "night", label: "12 AM - 8 AM EST", start: 0, end: 8 },
  { id: "day", label: "8 AM - 4 PM EST", altLabel: "OR (6 AM - 4 PM EST)", start: 8, end: 16 },
  { id: "evening", label: "4 PM - 12 AM EST", altLabel: "OR (4 PM - 2 AM EST)", start: 16, end: 24 },
];

// Skill grade colors matching the reference design
const gradeStyles: Record<string, { bg: string; text: string; label: string }> = {
  A: { 
    bg: "bg-red-600", 
    text: "text-white", 
    label: "Red Chatter = Allowed to cover any shift" 
  },
  B: { 
    bg: "bg-orange-500", 
    text: "text-black", 
    label: "Orange Chatter = Allowed to cover Orange or Green Shifts" 
  },
  C: { 
    bg: "bg-green-500", 
    text: "text-black", 
    label: "Green Chatter = Only allowed to cover green shifts" 
  },
};

export default function ShiftRoster() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    chatter_id: "",
    creator_id: "",
    shift_start: "",
    shift_end: "",
    shift_type: "regular",
    notes: "",
  });

  const { shifts, loading, createShift } = useChatterShifts();
  const { chatters } = useChatters();
  const { creators } = useCreators();
  const { timeLogs } = useChatterTimeLogs();

  const activeClockedIn = useMemo(() => {
    return new Set(timeLogs.filter(log => !log.clock_out).map(log => log.chatter_id));
  }, [timeLogs]);

  // Get QCs (Quality Controllers) from chatters or employees
  const qcAssignments = useMemo(() => {
    // For now, we'll show "QC" placeholder - can be enhanced to pull from actual QC assignments
    return {
      night: "QC",
      day: "QC", 
      evening: "QC",
    };
  }, []);

  // Group chatters by skill grade
  const chattersByGrade = useMemo(() => {
    const activeChatters = chatters.filter(c => c.is_active);
    return {
      A: activeChatters.filter(c => c.skill_grade === "A"),
      B: activeChatters.filter(c => c.skill_grade === "B"),
      C: activeChatters.filter(c => c.skill_grade === "C"),
    };
  }, [chatters]);

  // Get shift assignments for a specific chatter and shift block
  const getChatterShiftAssignments = (chatterId: string, shiftBlockId: string) => {
    const shiftBlock = SHIFT_BLOCKS.find(b => b.id === shiftBlockId);
    if (!shiftBlock) return [];

    return shifts.filter(shift => {
      if (shift.chatter_id !== chatterId) return false;
      const shiftHour = new Date(shift.shift_start).getHours();
      return shiftHour >= shiftBlock.start && shiftHour < shiftBlock.end;
    });
  };

  // Get creator names for a chatter's shift
  const getCreatorNames = (chatterId: string, shiftBlockId: string) => {
    const assignments = getChatterShiftAssignments(chatterId, shiftBlockId);
    if (assignments.length === 0) return null;
    return assignments.map(a => a.creator?.name || "Unknown").join(" / ");
  };

  const handlePrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chatter_id || !formData.creator_id || !formData.shift_start || !formData.shift_end) return;

    const input: CreateShiftInput = {
      chatter_id: formData.chatter_id,
      creator_id: formData.creator_id,
      shift_start: formData.shift_start,
      shift_end: formData.shift_end,
      shift_type: formData.shift_type,
      notes: formData.notes || null,
    };

    await createShift(input);
    setFormData({ chatter_id: "", creator_id: "", shift_start: "", shift_end: "", shift_type: "regular", notes: "" });
    setIsAddDialogOpen(false);
  };

  // Calculate coverage warnings
  const coverageWarnings = useMemo(() => {
    const warnings: string[] = [];
    const allChatters = chatters.filter(c => c.is_active);
    
    SHIFT_BLOCKS.forEach(block => {
      const hasAnyAssignment = allChatters.some(chatter => 
        getChatterShiftAssignments(chatter.id, block.id).length > 0
      );
      if (!hasAnyAssignment) {
        warnings.push(`${block.label} has no coverage`);
      }
    });
    
    return warnings;
  }, [chatters, shifts]);

  // Render a shift cell
  const renderShiftCell = (chatterId: string | null, shiftBlockId: string, grade: string) => {
    if (!chatterId) {
      return (
        <TableCell className={cn("text-center border border-border/50", gradeStyles[grade].bg, gradeStyles[grade].text)}>
          —
        </TableCell>
      );
    }

    const creatorNames = getCreatorNames(chatterId, shiftBlockId);
    const isOnline = activeClockedIn.has(chatterId);

    return (
      <TableCell 
        className={cn(
          "text-center border border-border/50 font-medium relative",
          gradeStyles[grade].bg,
          gradeStyles[grade].text
        )}
      >
        {isOnline && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        {creatorNames || "—"}
      </TableCell>
    );
  };

  // Render chatter name cell
  const renderChatterCell = (chatter: { id: string; name: string; skill_grade: string } | null, grade: string) => {
    if (!chatter) {
      return (
        <TableCell className={cn("font-medium border border-border/50", gradeStyles[grade].bg, gradeStyles[grade].text)}>
          N/A
        </TableCell>
      );
    }

    const isOnline = activeClockedIn.has(chatter.id);

    return (
      <TableCell 
        className={cn(
          "font-medium border border-border/50 relative",
          gradeStyles[grade].bg,
          gradeStyles[grade].text
        )}
      >
        {isOnline && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        <span className={cn(isOnline && "ml-3")}>{chatter.name}</span>
      </TableCell>
    );
  };

  // Calculate max rows needed
  const maxRows = Math.max(
    chattersByGrade.A.length,
    chattersByGrade.B.length,
    chattersByGrade.C.length,
    6 // Minimum 6 rows
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Shift Schedule</h1>
            <p className="text-muted-foreground mt-1">
              {format(currentWeekStart, "MMMM d")} - {format(addDays(currentWeekStart, 6), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-card rounded-lg border border-border">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Shift</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddShift} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chatter *</Label>
                    <Select value={formData.chatter_id} onValueChange={(v) => setFormData({ ...formData, chatter_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select chatter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatters.filter((c) => c.is_active).map((chatter) => (
                          <SelectItem key={chatter.id} value={chatter.id}>
                            <span className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", gradeStyles[chatter.skill_grade]?.bg || "bg-muted")} />
                              {chatter.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Creator *</Label>
                    <Select value={formData.creator_id} onValueChange={(v) => setFormData({ ...formData, creator_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {creators.filter((c) => c.status === "Active").map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>{creator.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start *</Label>
                      <Input 
                        type="datetime-local" 
                        value={formData.shift_start} 
                        onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End *</Label>
                      <Input 
                        type="datetime-local" 
                        value={formData.shift_end} 
                        onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary">Add Shift</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Time Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            {coverageWarnings.length > 0 && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium text-yellow-400">Coverage Gaps</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coverageWarnings.map((warning, i) => (
                    <Badge key={i} variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {warning}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-center border border-border/50 bg-muted font-bold text-foreground w-20">
                        <div className="flex items-center justify-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span>QC</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        colSpan={2} 
                        className="text-center border border-border/50 bg-muted font-bold text-foreground"
                      >
                        <div>{SHIFT_BLOCKS[0].label}</div>
                      </TableHead>
                      <TableHead className="text-center border border-border/50 bg-muted font-bold text-foreground w-20">
                        <div className="flex items-center justify-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span>QC</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        colSpan={2} 
                        className="text-center border border-border/50 bg-muted font-bold text-foreground"
                      >
                        <div>{SHIFT_BLOCKS[1].label}</div>
                        <div className="text-xs text-muted-foreground font-normal">{SHIFT_BLOCKS[1].altLabel}</div>
                      </TableHead>
                      <TableHead className="text-center border border-border/50 bg-muted font-bold text-foreground w-20">
                        <div className="flex items-center justify-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span>QC</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        colSpan={2} 
                        className="text-center border border-border/50 bg-muted font-bold text-foreground"
                      >
                        <div>{SHIFT_BLOCKS[2].label}</div>
                        <div className="text-xs text-muted-foreground font-normal">{SHIFT_BLOCKS[2].altLabel}</div>
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-center border border-border/50 text-muted-foreground">
                        {qcAssignments.night}
                      </TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">
                        <Users className="h-4 w-4 mx-auto" />
                        Chatter
                      </TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">Models</TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">
                        {qcAssignments.day}
                      </TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">
                        <Users className="h-4 w-4 mx-auto" />
                        Chatter
                      </TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">Models</TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">
                        {qcAssignments.evening}
                      </TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">
                        <Users className="h-4 w-4 mx-auto" />
                        Chatter
                      </TableHead>
                      <TableHead className="text-center border border-border/50 text-muted-foreground">Models</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: maxRows }).map((_, rowIndex) => {
                      const gradeAChatter = chattersByGrade.A[rowIndex] || null;
                      const gradeBChatter = chattersByGrade.B[rowIndex] || null;
                      const gradeCChatter = chattersByGrade.C[rowIndex] || null;

                      return (
                        <TableRow key={rowIndex} className="hover:bg-transparent">
                          {/* Night Shift - Grade A */}
                          <TableCell className="border border-border/50 bg-muted/20" />
                          {renderChatterCell(gradeAChatter, "A")}
                          {renderShiftCell(gradeAChatter?.id || null, "night", "A")}
                          
                          {/* Day Shift - Grade B */}
                          <TableCell className="border border-border/50 bg-muted/20" />
                          {renderChatterCell(gradeBChatter, "B")}
                          {renderShiftCell(gradeBChatter?.id || null, "day", "B")}
                          
                          {/* Evening Shift - Grade C */}
                          <TableCell className="border border-border/50 bg-muted/20" />
                          {renderChatterCell(gradeCChatter, "C")}
                          {renderShiftCell(gradeCChatter?.id || null, "evening", "C")}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer message */}
            <div className="p-4 rounded-xl bg-amber-900/30 border border-amber-700/50 text-center">
              <p className="text-amber-200 font-semibold">
                EVERY CHATTER MUST WORK THEIR OWN SHIFT IN ORDER TO BE ABLE TO COVER A SHIFT!!!
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className={cn("px-3 py-1 rounded text-xs font-medium", gradeStyles.A.bg, gradeStyles.A.text)}>
                  Red
                </span>
                <span className="text-muted-foreground">= Allowed to cover any shift</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-3 py-1 rounded text-xs font-medium", gradeStyles.B.bg, gradeStyles.B.text)}>
                  Orange
                </span>
                <span className="text-muted-foreground">= Allowed to cover Orange or Green Shifts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-3 py-1 rounded text-xs font-medium", gradeStyles.C.bg, gradeStyles.C.text)}>
                  Green
                </span>
                <span className="text-muted-foreground">= Only allowed to cover green shifts</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <TimeAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
