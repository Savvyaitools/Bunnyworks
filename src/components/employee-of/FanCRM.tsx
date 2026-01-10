import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Crown,
  AlertTriangle,
  Clock,
  DollarSign,
  MessageSquare,
  Gift,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useOnlyFansAPI, DiscoveredCreator } from "@/hooks/useOnlyFansAPI";
import { formatCurrency } from "@/lib/formatters";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

interface FanCRMProps {
  accountId: string;
  onSelectFan?: (fan: Fan) => void;
  onSendMessage?: (fanId: string, message: string) => void;
}

export function FanCRM({ accountId, onSelectFan, onSendMessage }: FanCRMProps) {
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("whales");
  
  const { listActiveFans, listExpiredFans, loading } = useOnlyFansAPI();
  const [activeFans, setActiveFans] = useState<Fan[]>([]);
  const [expiredFans, setExpiredFans] = useState<Fan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch fans on mount
  useState(() => {
    const fetchFans = async () => {
      setIsLoading(true);
      const [active, expired] = await Promise.all([
        listActiveFans(accountId, 100),
        listExpiredFans(accountId, 100),
      ]);
      setActiveFans(active?.data || []);
      setExpiredFans(expired?.data || []);
      setIsLoading(false);
    };
    fetchFans();
  });

  // Categorize fans
  const whales = useMemo(() => {
    return [...activeFans]
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, Math.ceil(activeFans.length * 0.1)); // Top 10%
  }, [activeFans]);

  const atRisk = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return activeFans.filter((fan) => {
      if (!fan.expires_at) return false;
      const expiry = new Date(fan.expires_at);
      return expiry > now && expiry <= threeDaysFromNow;
    });
  }, [activeFans]);

  const newFans = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return activeFans.filter((fan) => {
      if (!fan.subscribed_at) return false;
      return new Date(fan.subscribed_at) >= weekAgo;
    });
  }, [activeFans]);

  const filteredFans = useMemo(() => {
    let fans: Fan[] = [];
    switch (selectedTab) {
      case "whales":
        fans = whales;
        break;
      case "at-risk":
        fans = atRisk;
        break;
      case "new":
        fans = newFans;
        break;
      case "expired":
        fans = expiredFans;
        break;
      default:
        fans = activeFans;
    }

    if (search) {
      const searchLower = search.toLowerCase();
      fans = fans.filter(
        (f) =>
          f.name?.toLowerCase().includes(searchLower) ||
          f.username?.toLowerCase().includes(searchLower)
      );
    }

    return fans;
  }, [selectedTab, search, whales, atRisk, newFans, expiredFans, activeFans]);

  const aiSuggestions = useMemo(() => {
    const suggestions: { fan: Fan; message: string; type: "upsell" | "retention" | "re-engage" }[] = [];

    // Whale upsell suggestions
    whales.slice(0, 3).forEach((fan) => {
      suggestions.push({
        fan,
        message: `Hey ${fan.name?.split(" ")[0] || "babe"} 💕 I have some exclusive content just for my VIPs... want a sneak peek? 😏`,
        type: "upsell",
      });
    });

    // At-risk retention suggestions
    atRisk.slice(0, 3).forEach((fan) => {
      suggestions.push({
        fan,
        message: `Miss you ${fan.name?.split(" ")[0] || "handsome"} 🥺 I've got something special planned and would hate for you to miss it...`,
        type: "retention",
      });
    });

    // Re-engage expired fans
    expiredFans.slice(0, 2).forEach((fan) => {
      suggestions.push({
        fan,
        message: `Hey ${fan.name?.split(" ")[0] || "stranger"} 👋 Haven't seen you in a while! Come back and see what you've been missing 💋`,
        type: "re-engage",
      });
    });

    return suggestions;
  }, [whales, atRisk, expiredFans]);

  const stats = {
    total: activeFans.length + expiredFans.length,
    active: activeFans.length,
    whales: whales.length,
    atRisk: atRisk.length,
    avgSpend:
      activeFans.length > 0
        ? activeFans.reduce((sum, f) => sum + (f.total_spent || 0), 0) / activeFans.length
        : 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Fans</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Whales</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.whales}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">At Risk</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.atRisk}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Avg Spend</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.avgSpend)}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Message Suggestions
            </CardTitle>
            <CardDescription>
              Personalized messages to boost engagement and revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestions.slice(0, 4).map((suggestion, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={suggestion.fan.avatar} />
                  <AvatarFallback>
                    {suggestion.fan.name?.charAt(0) || suggestion.fan.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {suggestion.fan.name || suggestion.fan.username}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        suggestion.type === "upsell" && "border-warning text-warning",
                        suggestion.type === "retention" && "border-destructive text-destructive",
                        suggestion.type === "re-engage" && "border-accent text-accent"
                      )}
                    >
                      {suggestion.type === "upsell" && "💰 Upsell"}
                      {suggestion.type === "retention" && "🔄 Retain"}
                      {suggestion.type === "re-engage" && "👋 Re-engage"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{suggestion.message}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSendMessage?.(suggestion.fan.id, suggestion.message)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fan List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fan Directory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="whales" className="gap-1">
                <Crown className="h-4 w-4" />
                Whales ({whales.length})
              </TabsTrigger>
              <TabsTrigger value="at-risk" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
                At Risk ({atRisk.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1">
                <Sparkles className="h-4 w-4" />
                New ({newFans.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="gap-1">
                <Clock className="h-4 w-4" />
                Expired ({expiredFans.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({activeFans.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-0">
              {filteredFans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No fans in this category
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredFans.slice(0, 30).map((fan) => (
                    <div
                      key={fan.id}
                      onClick={() => onSelectFan?.(fan)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={fan.avatar} />
                        <AvatarFallback>
                          {fan.name?.charAt(0) || fan.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {fan.name || fan.username}
                        </p>
                        <p className="text-xs text-muted-foreground">@{fan.username}</p>
                      </div>
                      <div className="text-right">
                        {fan.total_spent && (
                          <p className="text-sm font-medium text-success">
                            {formatCurrency(fan.total_spent)}
                          </p>
                        )}
                        {fan.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(fan.expires_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
