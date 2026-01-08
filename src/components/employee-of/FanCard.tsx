import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Fan {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  subscribed_at?: string;
  expires_at?: string;
  total_spent?: number;
  is_active?: boolean;
}

interface FanCardProps {
  fan: Fan;
}

export function FanCard({ fan }: FanCardProps) {
  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={fan.avatar} />
            <AvatarFallback>{fan.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{fan.name}</span>
              {fan.is_active !== undefined && (
                <Badge variant={fan.is_active ? "default" : "secondary"} className="shrink-0">
                  {fan.is_active ? "Active" : "Expired"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">@{fan.username}</p>
            
            <div className="mt-2 space-y-1">
              {fan.total_spent !== undefined && fan.total_spent > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">${fan.total_spent.toFixed(2)}</span>
                  <span className="text-muted-foreground">spent</span>
                </div>
              )}
              
              {fan.subscribed_at && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Since {format(new Date(fan.subscribed_at), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
