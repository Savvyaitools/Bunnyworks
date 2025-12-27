import { useNavigate } from "react-router-dom";
import { MoreVertical, DollarSign, Trash2, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Creator } from "@/hooks/useCreators";
import { cn } from "@/lib/utils";

interface CreatorCardProps {
  creator: Creator;
  onDelete: (id: string) => void;
  index?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function CreatorCard({ creator, onDelete, index = 0 }: CreatorCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/creators/${creator.id}`);
  };

  return (
    <div
      className="creator-card animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
      style={{ animationDelay: `${150 + index * 50}ms` }}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {creator.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                creator.online_status ? "bg-success" : "bg-muted-foreground"
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{creator.name}</h3>
            {creator.alias && (
              <p className="text-sm text-muted-foreground">@{creator.alias}</p>
            )}
            {!creator.alias && creator.platform && (
              <p className="text-sm text-muted-foreground">{creator.platform}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem 
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(creator.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Creator
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {creator.followers && (
          <span className="text-xs text-muted-foreground">{creator.followers} followers</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{formatCurrency(Number(creator.revenue))}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{creator.email.split("@")[0]}</p>
            <p className="text-xs text-muted-foreground">Contact</p>
          </div>
        </div>
      </div>
    </div>
  );
}
