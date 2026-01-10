import { useState, useEffect } from "react";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllMyOFPermissions } from "@/hooks/useEmployeeOFPermissions";
import { useOnlyFansCache } from "@/hooks/useOnlyFansCache";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Users, DollarSign, AlertCircle, User, RefreshCw } from "lucide-react";
import { AccountSelector } from "@/components/employee-of/AccountSelector";
import { ChatList } from "@/components/employee-of/ChatList";
import { ChatWindow } from "@/components/employee-of/ChatWindow";
import { FanList } from "@/components/employee-of/FanList";
import { EarningsOverview } from "@/components/employee-of/EarningsOverview";
import { PermissionGate } from "@/components/employee-of/PermissionGate";
import { toast } from "sonner";

interface SocialAccountWithOF {
  id: string;
  creator_id: string;
  of_account_id: string | null;
  username: string;
  creator: {
    id: string;
    name: string;
    alias: string | null;
    avatar_url: string | null;
  };
}

export default function EmployeeOnlyFans() {
  const { data: permissions, isLoading: permissionsLoading } = useAllMyOFPermissions();
  const { forceRefresh } = useOnlyFansCache();
  const [selectedAccount, setSelectedAccount] = useState<SocialAccountWithOF | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountWithOF[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    if (!selectedAccount?.of_account_id) return;
    
    setIsSyncing(true);
    toast.info("Syncing messages and subscribers...");
    
    try {
      await forceRefresh(selectedAccount.of_account_id);
      toast.success("Sync complete!");
    } catch (err) {
      console.error("Sync failed:", err);
      toast.error("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch social accounts for creators the employee has permissions for
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!permissions || permissions.length === 0) {
        setAccountsLoading(false);
        return;
      }

      const creatorIds = permissions.map(p => p.creator_id);
      
      const { data, error } = await supabase
        .from("creator_social_accounts")
        .select(`
          id,
          creator_id,
          of_account_id,
          username,
          creator:creators(id, name, alias, avatar_url)
        `)
        .eq("platform", "OnlyFans")
        .in("creator_id", creatorIds)
        .not("of_account_id", "is", null);

      if (error) {
        console.error("Error fetching social accounts:", error);
      } else if (data) {
        // Transform data to match our interface
        const accounts = data.map(item => ({
          id: item.id,
          creator_id: item.creator_id,
          of_account_id: item.of_account_id,
          username: item.username,
          creator: item.creator as { id: string; name: string; alias: string | null; avatar_url: string | null },
        }));
        setSocialAccounts(accounts);
        
        // Auto-select first account if available
        if (accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(accounts[0]);
        }
      }
      
      setAccountsLoading(false);
    };

    fetchSocialAccounts();
  }, [permissions, selectedAccount]);

  // Get current permissions for selected creator
  const currentPermissions = selectedAccount
    ? permissions?.find(p => p.creator_id === selectedAccount.creator_id)
    : null;

  if (permissionsLoading || accountsLoading) {
    return (
      <EmployeeLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px]" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!permissions || permissions.length === 0) {
    return (
      <EmployeeLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Access Configured</h2>
              <p className="text-muted-foreground max-w-md">
                You don't have access to any OnlyFans accounts yet. Please contact your manager to get permissions assigned.
              </p>
            </CardContent>
          </Card>
        </div>
      </EmployeeLayout>
    );
  }

  if (socialAccounts.length === 0) {
    return (
      <EmployeeLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Connected Accounts</h2>
              <p className="text-muted-foreground max-w-md">
                The creators you have access to don't have any connected OnlyFans accounts. Please contact your manager.
              </p>
            </CardContent>
          </Card>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header with Account Selector */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">OnlyFans Dashboard</h1>
            <p className="text-muted-foreground">Manage DMs, subscribers, and content</p>
          </div>
          <div className="md:ml-auto">
            <AccountSelector
              accounts={socialAccounts}
              selectedAccount={selectedAccount}
              onSelect={(account) => {
                setSelectedAccount(account);
                setSelectedChatId(null);
              }}
            />
          </div>
        </div>

        {/* Permission Badges and Sync Button */}
        {currentPermissions && (
          <div className="flex flex-wrap items-center gap-2">
            {currentPermissions.can_view_chats && <Badge variant="secondary">Messages</Badge>}
            {currentPermissions.can_send_messages && <Badge variant="secondary">Reply to DMs</Badge>}
            {currentPermissions.can_view_fans && <Badge variant="secondary">Subscribers</Badge>}
            {currentPermissions.can_view_earnings && <Badge variant="secondary">Earnings</Badge>}
            {currentPermissions.can_view_posts && <Badge variant="secondary">Posts</Badge>}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        )}

        {/* Main Content */}
        {selectedAccount && selectedAccount.of_account_id && currentPermissions && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              {currentPermissions.can_view_chats && (
                <TabsTrigger value="chats" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </TabsTrigger>
              )}
              {currentPermissions.can_view_fans && (
                <TabsTrigger value="fans" className="gap-2">
                  <Users className="h-4 w-4" />
                  Subscribers
                </TabsTrigger>
              )}
              {currentPermissions.can_view_earnings && (
                <TabsTrigger value="earnings" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Earnings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="chats" className="m-0">
              <PermissionGate permission={currentPermissions.can_view_chats}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
                  {/* Chat List */}
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">DMs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ChatList
                        accountId={selectedAccount.of_account_id}
                        selectedChatId={selectedChatId}
                        onSelectChat={setSelectedChatId}
                      />
                    </CardContent>
                  </Card>

                  {/* Chat Window */}
                  <Card className="lg:col-span-2">
                    <ChatWindow
                      accountId={selectedAccount.of_account_id}
                      chatId={selectedChatId}
                      canSendMessages={currentPermissions.can_send_messages}
                    />
                  </Card>
                </div>
              </PermissionGate>
            </TabsContent>

            <TabsContent value="fans" className="m-0">
              <PermissionGate permission={currentPermissions.can_view_fans}>
                <FanList accountId={selectedAccount.of_account_id} />
              </PermissionGate>
            </TabsContent>

            <TabsContent value="earnings" className="m-0">
              <PermissionGate permission={currentPermissions.can_view_earnings}>
                <EarningsOverview accountId={selectedAccount.of_account_id} />
              </PermissionGate>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </EmployeeLayout>
  );
}
