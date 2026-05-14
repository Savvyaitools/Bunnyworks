import { Trophy, Award, Medal, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useEmployeeBonuses, BonusStructure } from "@/hooks/useEmployeeBonuses";
import { useEmployeeKPIs } from "@/hooks/useEmployeeKPIs";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface BonusLeaderboardProps {
  department: "chatting" | "marketing";
  structure?: BonusStructure;
}

const gradeStyles: Record<string, string> = {
  A: "bg-warning/20 text-warning border-warning",
  B: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground",
  C: "bg-orange-500/20 text-orange-400 border-orange-500",
};

const gradeIcons: Record<string, React.ReactNode> = {
  A: <Trophy className="h-4 w-4" />,
  B: <Award className="h-4 w-4" />,
  C: <Medal className="h-4 w-4" />,
};

export function BonusLeaderboard({ department, structure }: BonusLeaderboardProps) {
  const { calculateGrade, getBonusAmount } = useEmployeeBonuses();
  const { performanceSummaries, loading } = useEmployeeKPIs();

  if (!structure) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No bonus structure defined for this month.</p>
          <p className="text-sm mt-1">Create a bonus structure to see the leaderboard.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter by department (using role as proxy - Chatter for chatting, others for marketing)
  const filteredPerformers = performanceSummaries.filter((p) => {
    if (department === "chatting") {
      return p.employee_role === "Chatter";
    } else {
      return p.employee_role !== "Chatter";
    }
  });

  // Sort by completion rate (performance score)
  const rankedPerformers = [...filteredPerformers].sort(
    (a, b) => b.completion_rate - a.completion_rate
  );

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading leaderboard...
        </CardContent>
      </Card>
    );
  }

  if (rankedPerformers.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {department} performance data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          {department === "chatting" ? "Chatting" : "Marketing"} Bonus Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {structure.name} - Thresholds: A≥{structure.grade_a_threshold}%, B≥{structure.grade_b_threshold}%, C≥{structure.grade_c_threshold}%
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rankedPerformers.map((performer, index) => {
          const grade = calculateGrade(performer.completion_rate, structure);
          const bonusAmount = grade ? getBonusAmount(grade, structure) : 0;

          return (
            <div
              key={performer.employee_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg",
                index === 0 
                  ? "bg-gradient-to-r from-warning/20 to-transparent border border-warning/30" 
                  : "bg-muted/30"
              )}
            >
              {/* Rank */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  index === 0
                    ? "bg-warning text-warning-foreground"
                    : index === 1
                    ? "bg-muted-foreground/50 text-foreground"
                    : index === 2
                    ? "bg-orange-500/50 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>

              {/* Avatar & Name */}
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/initials/svg?backgroundColor=ec4899,db2777,be185d,a21caf,9333ea,7c3aed,6d28d9&fontWeight=600&textColor=ffffff&seed=${performer.employee_name}`}
                />
                <AvatarFallback>{performer.employee_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{performer.employee_name}</p>
                <p className="text-xs text-muted-foreground">{performer.employee_role}</p>
              </div>

              {/* Score Progress */}
              <div className="flex-1 max-w-[150px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className="text-sm font-medium">{performer.completion_rate.toFixed(0)}%</span>
                </div>
                <Progress value={performer.completion_rate} className="h-2" />
              </div>

              {/* Grade Badge */}
              {grade ? (
                <Badge className={cn("text-xs border px-3", gradeStyles[grade])}>
                  <span className="mr-1">{gradeIcons[grade]}</span>
                  Grade {grade}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Below C
                </Badge>
              )}

              {/* Projected Bonus */}
              <div className="text-right min-w-[80px]">
                <p className={cn(
                  "font-semibold",
                  bonusAmount > 0 ? "text-success" : "text-muted-foreground"
                )}>
                  {formatCurrency(bonusAmount)}
                </p>
                <p className="text-xs text-muted-foreground">bonus</p>
              </div>
            </div>
          );
        })}

        {/* Summary */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Total potential payouts this month
          </div>
          <p className="text-lg font-bold text-success">
            {formatCurrency(
              rankedPerformers.reduce((sum, p) => {
                const grade = calculateGrade(p.completion_rate, structure);
                return sum + (grade ? getBonusAmount(grade, structure) : 0);
              }, 0)
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
