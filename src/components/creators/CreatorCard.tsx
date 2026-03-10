import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, DollarSign, Trash2, Mail, KeyRound, Check, Heart, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Creator } from "@/hooks/useCreators";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { copyToClipboard } from "@/lib/passwordUtils";
import { toast } from "sonner";

interface CreatorCardProps {
  creator: Creator;
  onDelete: (id: string) => void;
  onCreateAccount?: (creator: Creator) => void;
  index?: number;
}

export function CreatorCard({ creator, onDelete, onCreateAccount, index = 0 }: CreatorCardProps) {
  const navigate = useNavigate();
  const hasAccount = Boolean(creator.auth_user_id);
  const [ofAccounts, setOfAccounts] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    supabase
      .from("creator_social_accounts")
      .select("id, username")
      .eq("creator_id", creator.id)
      .eq("platform", "OnlyFans")
      .then(({ data }) => {
        if (data) setOfAccounts(data);
      });
  }, [creator.id]);

  const handleCardClick = () => {
    navigate(`/creators/${creator.id}`);
  };

  const loginUrl = `${window.location.origin}/auth`;

  const handleCopyLoginInfo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const credentials = `Login URL: ${loginUrl}\nEmail: ${creator.email}\nPassword: (set during account creation)`;
    const success = await copyToClipboard(credentials);
    toast[success ? "success" : "error"](
      success ? "Login info copied!" : "Failed to copy"
    );
  };

  const avatarImageUrl = creator.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`;

  return (
    <div
      className="creator-card animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
      style={{ animationDelay: `${150 + index * 50}ms` }}
      onClick={handleCardClick}
    >
      {/* Creator Photo Banner */}
      <div className="relative h-24 -mx-4 -mt-4 mb-4 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar className="h-16 w-16 ring-4 ring-card shadow-lg">
            <AvatarImage src={avatarImageUrl} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              {creator.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        </div>
        <span
          className={cn(
            "absolute bottom-2 left-1/2 translate-x-4 h-4 w-4 rounded-full border-2 border-card",
            creator.online_status ? "bg-success" : "bg-muted-foreground"
          )}
        />
        {hasAccount && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-success/20 text-success border-success/30 text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Login Active
          </Badge>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/70 hover:text-foreground bg-card/50 backdrop-blur-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              {hasAccount && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLoginInfo(e); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Login Info
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!hasAccount && onCreateAccount && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateAccount(creator); }}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Create Login
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(creator.id); }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Creator
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Creator Info */}
      <div className="text-center mb-3">
        <h3 className="font-semibold text-foreground">{creator.name}</h3>
        {creator.alias && <p className="text-sm text-muted-foreground">@{creator.alias}</p>}
        {!creator.alias && creator.platform && <p className="text-sm text-muted-foreground">{creator.platform}</p>}
        {creator.followers && <p className="text-xs text-muted-foreground mt-1">{creator.followers} followers</p>}
        {ofAccounts.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            {ofAccounts.map((acc) => (
              <Badge key={acc.id} variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">
                <Heart className="h-3 w-3 mr-1" />
                {acc.username}
              </Badge>
            ))}
          </div>
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