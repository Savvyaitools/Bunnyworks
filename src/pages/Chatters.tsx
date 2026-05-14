import { useState } from "react";
import { 
  Search, MoreVertical, Trash2, Star, 
  Clock, Users, CheckCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChatters, type SkillGrade } from "@/hooks/useChatters";
import { useCreatorAssignments } from "@/hooks/useCreatorAssignments";
import { PageHeader } from "@/components/shared/PageHeader";

const gradeStyles: Record<SkillGrade, string> = {
  A: "bg-green-500/20 text-green-400 border-green-500/30",
  B: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  C: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};


export default function Chatters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<SkillGrade | "all">("all");

  const { chatters, loading, stats, updateChatter, deleteChatter } = useChatters();
  const { assignments } = useCreatorAssignments();

  const getChatterAssignments = (chatterId: string) => {
    return assignments.filter((a) => a.employee_id === chatterId || a.chatter_id === chatterId);
  };

  const filteredChatters = chatters.filter((chatter) => {
    const matchesSearch = 
      chatter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chatter.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === "all" || chatter.skill_grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleGradeChange = async (id: string, grade: SkillGrade) => {
    await updateChatter(id, { skill_grade: grade });
  };

  const handleActiveToggle = async (id: string, isActive: boolean) => {
    await updateChatter(id, { is_active: isActive });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <PageHeader
          title="Chatters"
          subtitle={loading ? "Loading..." : `${stats.total} chatters · ${stats.active} active`}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-green-400" />
              <span className="text-sm text-muted-foreground">Grade A</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.gradeA}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-muted-foreground">Grade B/C</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.gradeB + stats.gradeC}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chatters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "A", "B", "C"] as const).map((grade) => (
              <Button
                key={grade}
                variant={selectedGrade === grade ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGrade(grade)}
                className={cn(
                  selectedGrade === grade
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {grade === "all" ? "All Grades" : `Grade ${grade}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredChatters.map((chatter, index) => {
              const chatterAssignments = getChatterAssignments(chatter.id);
              return (
                <div
                  key={chatter.id}
                  className={cn(
                    "p-5 rounded-xl bg-card border transition-all animate-fade-in",
                    chatter.is_active ? "border-border hover:border-primary/50" : "border-border/50 opacity-60"
                  )}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?backgroundColor=ec4899,db2777,be185d,a21caf,9333ea,7c3aed,6d28d9&fontWeight=600&textColor=ffffff&seed=${chatter.avatar_seed || chatter.name}`} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {chatter.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{chatter.name}</h3>
                        {chatter.email && (
                          <p className="text-sm text-muted-foreground truncate max-w-[150px]">{chatter.email}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => handleGradeChange(chatter.id, "A")}>
                          Set Grade A
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGradeChange(chatter.id, "B")}>
                          Set Grade B
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGradeChange(chatter.id, "C")}>
                          Set Grade C
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteChatter(chatter.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Chatter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={cn("text-xs", gradeStyles[chatter.skill_grade])}>
                      Grade {chatter.skill_grade}
                    </Badge>
                    <Badge className={cn(
                      "text-xs",
                      chatter.is_active 
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {chatter.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {chatter.timezone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{chatter.timezone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{chatterAssignments.length} assigned creators</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>📨 Target: {chatter.daily_target_messages}/day</span>
                      <span>💰 PPV: {chatter.daily_target_ppv}/day</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Status</span>
                    <Switch
                      checked={chatter.is_active}
                      onCheckedChange={(checked) => handleActiveToggle(chatter.id, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredChatters.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No chatters found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
