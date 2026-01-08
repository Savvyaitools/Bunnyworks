import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlyFansAPI } from "@/hooks/useOnlyFansAPI";
import { Search, Users, UserX } from "lucide-react";
import { FanCard } from "./FanCard";

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

interface FanListProps {
  accountId: string;
}

export function FanList({ accountId }: FanListProps) {
  const { listActiveFans, listExpiredFans, loading } = useOnlyFansAPI();
  const [activeFans, setActiveFans] = useState<Fan[]>([]);
  const [expiredFans, setExpiredFans] = useState<Fan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFans = async () => {
      setIsLoading(true);
      
      const [activeResult, expiredResult] = await Promise.all([
        listActiveFans(accountId, 100, 0, searchQuery || undefined),
        listExpiredFans(accountId, 100, 0),
      ]);

      if (activeResult?.data) {
        setActiveFans(activeResult.data);
      }
      if (expiredResult?.data) {
        setExpiredFans(expiredResult.data);
      }
      
      setIsLoading(false);
    };

    fetchFans();
  }, [accountId, searchQuery]);

  const currentFans = activeTab === "active" ? activeFans : expiredFans;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Subscribers</CardTitle>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{activeFans.length}</span> active •{" "}
            <span className="font-medium text-foreground">{expiredFans.length}</span> expired
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active" className="gap-2">
                <Users className="h-4 w-4" />
                Active Subs
              </TabsTrigger>
              <TabsTrigger value="expired" className="gap-2">
                <UserX className="h-4 w-4" />
                Expired Subs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Fan Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : currentFans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery
              ? "No subscribers found matching your search"
              : activeTab === "active"
              ? "No active subscribers"
              : "No expired subscribers"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentFans.map((fan) => (
              <FanCard key={fan.id} fan={fan} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
