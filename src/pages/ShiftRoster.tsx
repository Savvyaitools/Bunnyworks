import { useState, useMemo, useCallback } from "react";
import { 
  Plus, ChevronLeft, ChevronRight, 
  AlertTriangle, Shield, GripVertical,
  Clock, User, Zap, MoreHorizontal, Edit, Trash2, LayoutGrid, Table as TableIcon
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useChatterShifts, CreateShiftInput } from "@/hooks/useChatterShifts";
import { useChatters } from "@/hooks/useChatters";
import { useCreators } from "@/hooks/useCreators";
import { useChatterTimeLogs } from "@/hooks/useChatterTimeLogs";
import { useEmployees } from "@/hooks/useEmployees";
import { useQCAssignments } from "@/hooks/useQCAssignments";
import { useCreatorAssignments } from "@/hooks/useCreatorAssignments";
import { TimeAnalytics } from "@/components/shifts";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Shift time blocks configuration
const SHIFT_BLOCKS = [
  { id: "night" as const, label: "12 AM - 8 AM", sublabel: "Night Shift", start: 0, end: 8, icon: "🌙" },
  { id: "day" as const, label: "8 AM - 4 PM", sublabel: "Day Shift", start: 8, end: 16, icon: "☀️" },
  { id: "evening" as const, label: "4 PM - 12 AM", sublabel: "Evening Shift", start: 16, end: 24, icon: "🌆" },
];

// Skill grade styles matching the dark theme
const gradeStyles: Record<string, { 
  bg: string; 
  border: string; 
  text: string; 
  glow: string;
  label: string;
}> = {
  A: { 
    bg: "bg-red-500/20", 
    border: "border-red-500/40",
    text: "text-red-400", 
    glow: "shadow-[0_0_15px_hsl(0,72%,51%,0.3)]",
    label: "Can cover any shift" 
  },
  B: { 
    bg: "bg-orange-500/20", 
    border: "border-orange-500/40",
    text: "text-orange-400", 
    glow: "shadow-[0_0_15px_hsl(25,95%,53%,0.3)]",
    label: "Can cover Orange/Green" 
  },
  C: { 
    bg: "bg-emerald-500/20", 
    border: "border-emerald-500/40",
    text: "text-emerald-400", 
    glow: "shadow-[0_0_15px_hsl(142,70%,45%,0.3)]",
    label: "Can cover Green only" 
  },
};

// Draggable shift card component
interface ShiftCardProps {
  chatter: {
    id: string;
    name: string;
    skill_grade: string;
    avatar_seed?: string | null;
  };
  creators: string[];
  isOnline: boolean;
  shiftBlock: string;
  onDragStart: (e: React.DragEvent, chatterId: string, fromBlock: string) => void;
}

function ShiftCard({ chatter, creators, isOnline, shiftBlock, onDragStart }: ShiftCardProps) {
  const grade = gradeStyles[chatter.skill_grade] || gradeStyles.B;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, chatter.id, shiftBlock)}
      className={cn(
        "group p-3 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        grade.bg, grade.border,
        "hover:shadow-lg",
        isOnline && grade.glow
      )}
    >
      <div className="flex items-start gap-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatter.avatar_seed || chatter.name}`} />
              <AvatarFallback className="text-xs">{chatter.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className={cn("font-medium text-sm truncate", grade.text)}>
              {chatter.name}
            </span>
            {isOnline && (
              <span className="ml-auto flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400">Live</span>
              </span>
            )}
          </div>
          {creators.length > 0 && (
            <p className="text-xs text-muted-foreground truncate pl-8">
              → {creators.join(" / ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// QC Badge component
interface QCBadgeProps {
  qcName: string | null;
  shiftBlock: "night" | "day" | "evening";
  employees: Array<{ id: string; name: string; role: string }>;
  onAssign: (employeeId: string) => void;
}

function QCBadge({ qcName, shiftBlock, employees, onAssign }: QCBadgeProps) {
  const qcEmployees = employees.filter(e => e.role === "Quality Controller" || e.role === "QC");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto py-1 px-2 gap-1.5",
            qcName 
              ? "text-primary hover:text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{qcName || "Assign QC"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {qcEmployees.length === 0 ? (
          <DropdownMenuItem disabled>
            No QC employees found
          </DropdownMenuItem>
        ) : (
          qcEmployees.map((emp) => (
            <DropdownMenuItem key={emp.id} onClick={() => onAssign(emp.id)}>
              <User className="h-4 w-4 mr-2" />
              {emp.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ShiftRoster() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [draggedChatter, setDraggedChatter] = useState<{ id: string; fromBlock: string } | null>(null);
  const [formData, setFormData] = useState({
    chatter_id: "",
    creator_id: "",
    shift_date: "",
    shift_block: "",
    shift_type: "regular",
    notes: "",
  });

  const { shifts, loading, createShift, updateShift, deleteShift } = useChatterShifts();
  const { chatters } = useChatters();
  const { creators } = useCreators();
  const { timeLogs } = useChatterTimeLogs();
  const { employees } = useEmployees();
  const { assignments: qcAssignments, assignQC, getQCForShift } = useQCAssignments();
  const { assignments: creatorAssignments } = useCreatorAssignments();

  const activeClockedIn = useMemo(() => {
    return new Set(timeLogs.filter(log => !log.clock_out).map(log => log.chatter_id));
  }, [timeLogs]);

  // Get active chatters grouped by grade
  const chattersByGrade = useMemo(() => {
    const activeChatters = chatters.filter(c => c.is_active);
    return {
      A: activeChatters.filter(c => c.skill_grade === "A"),
      B: activeChatters.filter(c => c.skill_grade === "B"),
      C: activeChatters.filter(c => c.skill_grade === "C"),
    };
  }, [chatters]);

  // Get shifts for a specific block
  const getShiftsForBlock = useCallback((shiftBlockId: string) => {
    const shiftBlock = SHIFT_BLOCKS.find(b => b.id === shiftBlockId);
    if (!shiftBlock) return [];

    return shifts.filter(shift => {
      const shiftHour = new Date(shift.shift_start).getHours();
      return shiftHour >= shiftBlock.start && shiftHour < shiftBlock.end;
    });
  }, [shifts]);

  // Get chatters assigned to a shift block
  const getChattersInBlock = useCallback((shiftBlockId: string) => {
    const blockShifts = getShiftsForBlock(shiftBlockId);
    const chatterIds = new Set(blockShifts.map(s => s.chatter_id));
    return chatters.filter(c => c.is_active && chatterIds.has(c.id));
  }, [getShiftsForBlock, chatters]);

  // Get unassigned chatters (not in any shift today)
  const unassignedChatters = useMemo(() => {
    const assignedIds = new Set(shifts.map(s => s.chatter_id));
    return chatters.filter(c => c.is_active && !assignedIds.has(c.id));
  }, [shifts, chatters]);

  // Get creator names for a chatter's shifts in a block
  const getCreatorNamesForChatter = useCallback((chatterId: string, shiftBlockId: string) => {
    const blockShifts = getShiftsForBlock(shiftBlockId);
    const chatterShifts = blockShifts.filter(s => s.chatter_id === chatterId);
    return chatterShifts.map(s => s.creator?.name || "Unknown");
  }, [getShiftsForBlock]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, chatterId: string, fromBlock: string) => {
    setDraggedChatter({ id: chatterId, fromBlock });
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, toBlock: string) => {
    e.preventDefault();
    if (!draggedChatter || draggedChatter.fromBlock === toBlock) {
      setDraggedChatter(null);
      return;
    }

    // Find the shifts for this chatter in the original block
    const originalShifts = getShiftsForBlock(draggedChatter.fromBlock)
      .filter(s => s.chatter_id === draggedChatter.id);

    if (originalShifts.length === 0) {
      toast({
        title: "Cannot move",
        description: "No shifts found to move.",
        variant: "destructive",
      });
      setDraggedChatter(null);
      return;
    }

    // Get the target block times
    const targetBlock = SHIFT_BLOCKS.find(b => b.id === toBlock);
    if (!targetBlock) {
      setDraggedChatter(null);
      return;
    }

    // Update each shift to the new time block
    for (const shift of originalShifts) {
      const originalStart = new Date(shift.shift_start);
      const originalEnd = new Date(shift.shift_end);
      
      // Calculate new times based on target block
      const newStart = new Date(originalStart);
      newStart.setHours(targetBlock.start, 0, 0, 0);
      
      const newEnd = new Date(originalEnd);
      newEnd.setHours(targetBlock.end, 0, 0, 0);

      await updateShift(shift.id, {
        shift_start: newStart.toISOString(),
        shift_end: newEnd.toISOString(),
      });
    }

    toast({
      title: "Shift moved",
      description: `Moved chatter to ${targetBlock.label}`,
    });

    setDraggedChatter(null);
  }, [draggedChatter, getShiftsForBlock, updateShift]);

  const handlePrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chatter_id || !formData.creator_id || !formData.shift_date || !formData.shift_block) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Get block times from SHIFT_BLOCKS
    const block = SHIFT_BLOCKS.find(b => b.id === formData.shift_block);
    if (!block) {
      toast({
        title: "Invalid shift block",
        description: "Please select a valid shift block.",
        variant: "destructive",
      });
      return;
    }

    // Create shift start and end times based on selected date and block
    const shiftDate = new Date(formData.shift_date);
    const shiftStart = new Date(shiftDate);
    shiftStart.setHours(block.start, 0, 0, 0);
    
    const shiftEnd = new Date(shiftDate);
    shiftEnd.setHours(block.end, 0, 0, 0);

    const input: CreateShiftInput = {
      chatter_id: formData.chatter_id,
      creator_id: formData.creator_id,
      shift_start: shiftStart.toISOString(),
      shift_end: shiftEnd.toISOString(),
      shift_type: formData.shift_type || null,
      notes: formData.notes || null,
      employee_id: null,
    };

    try {
      await createShift(input);
      setFormData({ chatter_id: "", creator_id: "", shift_date: "", shift_block: "", shift_type: "regular", notes: "" });
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  // Coverage warnings
  const coverageWarnings = useMemo(() => {
    const warnings: string[] = [];
    SHIFT_BLOCKS.forEach(block => {
      const chattersInBlock = getChattersInBlock(block.id);
      if (chattersInBlock.length === 0) {
        warnings.push(`${block.label} has no coverage`);
      }
    });
    return warnings;
  }, [getChattersInBlock]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Shift Schedule</h1>
            <p className="text-muted-foreground mt-1">
              {format(currentWeekStart, "MMMM d")} - {format(addDays(currentWeekStart, 6), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-card rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Week Navigation */}
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
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                chatter.skill_grade === "A" && "bg-red-500",
                                chatter.skill_grade === "B" && "bg-orange-500",
                                chatter.skill_grade === "C" && "bg-emerald-500"
                              )} />
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
                      <Label>Shift Date *</Label>
                      <Input 
                        type="date" 
                        value={formData.shift_date || ""} 
                        onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })} 
                        required 
                        className="block w-full [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shift Block *</Label>
                      <Select 
                        value={formData.shift_block || ""} 
                        onValueChange={(v) => setFormData({ ...formData, shift_block: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift block" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="night">🌙 Night (12 AM - 8 AM)</SelectItem>
                          <SelectItem value="day">☀️ Day (8 AM - 4 PM)</SelectItem>
                          <SelectItem value="evening">🌆 Evening (4 PM - 12 AM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary"
                    disabled={!formData.chatter_id || !formData.creator_id || !formData.shift_date || !formData.shift_block}
                  >
                    Add Shift
                  </Button>
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
            {/* Coverage Warnings */}
            {coverageWarnings.length > 0 && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="font-medium text-warning">Coverage Gaps</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coverageWarnings.map((warning, i) => (
                    <Badge key={i} variant="outline" className="bg-warning/20 text-warning border-warning/30">
                      {warning}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card p-6 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ) : viewMode === "table" ? (
              <>
                {/* Table View */}
                <div className="glass-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Chatter</TableHead>
                        <TableHead className="text-muted-foreground">Shift</TableHead>
                        <TableHead className="text-muted-foreground">Grade</TableHead>
                        <TableHead className="text-muted-foreground">Creator</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No shifts scheduled</p>
                            <p className="text-sm">Click "Add Shift" to create one</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        shifts.map((shift) => {
                          const chatter = chatters.find((c) => c.id === shift.chatter_id);
                          const creator = creators.find((c) => c.id === shift.creator_id);
                          const isOnline = activeClockedIn.has(shift.chatter_id);
                          const grade = gradeStyles[chatter?.skill_grade || "B"] || gradeStyles.B;

                          // Determine shift block
                          const shiftHour = new Date(shift.shift_start).getHours();
                          const shiftBlock = SHIFT_BLOCKS.find(
                            (b) => shiftHour >= b.start && shiftHour < b.end
                          );

                          return (
                            <TableRow key={shift.id} className="border-border">
                              {/* Chatter */}
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatter?.avatar_seed || chatter?.name}`}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {chatter?.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">
                                    {chatter?.name || "Unknown"}
                                  </span>
                                </div>
                              </TableCell>

                              {/* Shift */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{shiftBlock?.icon}</span>
                                  <div>
                                    <p className="font-medium text-foreground text-sm">
                                      {shiftBlock?.label || "Custom"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(shift.shift_start), "h:mm a")} -{" "}
                                      {format(new Date(shift.shift_end), "h:mm a")}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Grade */}
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-semibold",
                                    grade.bg,
                                    grade.border,
                                    grade.text
                                  )}
                                >
                                  Grade {chatter?.skill_grade || "B"}
                                </Badge>
                              </TableCell>

                              {/* Creator */}
                              <TableCell>
                                {creator ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage
                                        src={
                                          creator.avatar_url ||
                                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`
                                        }
                                      />
                                      <AvatarFallback className="text-xs">
                                        {creator.name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-foreground text-sm">
                                      {creator.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                {isOnline ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                                    Online
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-muted/50 text-muted-foreground"
                                  >
                                    Offline
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        // Determine shift block from shift start hour
                                        const startHour = new Date(shift.shift_start).getHours();
                                        let shiftBlock = "day";
                                        if (startHour >= 0 && startHour < 8) shiftBlock = "night";
                                        else if (startHour >= 16) shiftBlock = "evening";
                                        
                                        setFormData({
                                          chatter_id: shift.chatter_id,
                                          creator_id: shift.creator_id,
                                          shift_date: shift.shift_start.slice(0, 10),
                                          shift_block: shiftBlock,
                                          shift_type: shift.shift_type || "regular",
                                          notes: shift.notes || "",
                                        });
                                        setIsAddDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => deleteShift(shift.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {Object.entries(gradeStyles).map(([grade, style]) => (
                    <div key={grade} className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded", style.bg, style.border)} />
                      <span className={style.text}>Grade {grade}</span>
                      <span className="text-muted-foreground">— {style.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Grid View (Original) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {SHIFT_BLOCKS.map((block) => {
                    const chattersInBlock = getChattersInBlock(block.id);
                    const qcAssignment = getQCForShift(block.id);

                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "glass-card p-5 transition-all duration-200",
                          draggedChatter && draggedChatter.fromBlock !== block.id && "ring-2 ring-primary/50 ring-dashed"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, block.id)}
                      >
                        {/* Block Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{block.icon}</div>
                            <div>
                              <h3 className="font-semibold text-foreground">{block.label}</h3>
                              <p className="text-xs text-muted-foreground">{block.sublabel}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-muted/50">
                            {chattersInBlock.length} active
                          </Badge>
                        </div>

                        {/* QC Assignment */}
                        <div className="mb-4 pb-3 border-b border-border">
                          <QCBadge
                            qcName={qcAssignment?.employee?.name || null}
                            shiftBlock={block.id}
                            employees={employees}
                            onAssign={(employeeId) => assignQC({ shiftBlock: block.id, employeeId })}
                          />
                        </div>

                        {/* Chatters List */}
                        <div className="space-y-2 min-h-[200px]">
                          {chattersInBlock.length === 0 ? (
                            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                              <div className="text-center text-muted-foreground">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No chatters assigned</p>
                                <p className="text-xs">Drag chatters here</p>
                              </div>
                            </div>
                          ) : (
                            chattersInBlock.map((chatter) => (
                              <ShiftCard
                                key={chatter.id}
                                chatter={chatter}
                                creators={getCreatorNamesForChatter(chatter.id, block.id)}
                                isOnline={activeClockedIn.has(chatter.id)}
                                shiftBlock={block.id}
                                onDragStart={handleDragStart}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unassigned Chatters */}
                {unassignedChatters.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">Unassigned Chatters</h3>
                      <Badge variant="outline" className="ml-auto">
                        {unassignedChatters.length} available
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {unassignedChatters.map((chatter) => {
                        const grade = gradeStyles[chatter.skill_grade] || gradeStyles.B;
                        return (
                          <div
                            key={chatter.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border",
                              grade.bg, grade.border
                            )}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatter.avatar_seed || chatter.name}`} />
                              <AvatarFallback className="text-xs">{chatter.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className={cn("text-sm font-medium", grade.text)}>{chatter.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Important Notice */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                  <p className="text-primary font-medium text-sm">
                    ⚡ Every chatter must work their own shift to be eligible to cover another shift
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  {Object.entries(gradeStyles).map(([grade, style]) => (
                    <div key={grade} className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded", style.bg, style.border)} />
                      <span className={style.text}>Grade {grade}</span>
                      <span className="text-muted-foreground">— {style.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <TimeAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
