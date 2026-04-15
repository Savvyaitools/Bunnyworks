import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Fan {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  total_spent: number | null;
  is_active: boolean | null;
  subscribed_at: string | null;
  renew_on: boolean | null;
}

interface TopFansTableProps {
  fans: Fan[];
  loading?: boolean;
}

function getSpendTier(spent: number): { label: string; className: string } {
  if (spent >= 500) return { label: "Whale", className: "bg-primary/20 text-primary" };
  if (spent >= 100) return { label: "High", className: "bg-warning/20 text-warning" };
  if (spent >= 25) return { label: "Mid", className: "bg-accent/20 text-accent" };
  return { label: "Low", className: "bg-muted text-muted-foreground" };
}

export function TopFansTable({ fans, loading }: TopFansTableProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center gap-2">
        <Trophy className="h-5 w-5 text-warning" />
        <CardTitle className="text-lg">Top Fans by Spend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : fans.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No fan data yet. Connect your accounts to sync fan data.</p>
        ) : (
          <div className="space-y-2">
            {fans.map((fan, index) => {
              const tier = getSpendTier(fan.total_spent || 0);
              return (
                <div key={fan.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={fan.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {(fan.name || fan.username || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fan.name || fan.username || "Unknown"}
                    </p>
                    {fan.username && fan.name && (
                      <p className="text-xs text-muted-foreground">@{fan.username}</p>
                    )}
                  </div>
                  <Badge className={tier.className}>{tier.label}</Badge>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    ${(fan.total_spent || 0).toFixed(2)}
                  </span>
                  <Badge variant={fan.is_active ? "default" : "secondary"} className="text-xs">
                    {fan.is_active ? "Active" : "Expired"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
