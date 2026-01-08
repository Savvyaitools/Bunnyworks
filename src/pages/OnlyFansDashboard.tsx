import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Users, DollarSign, User, Activity } from "lucide-react";
import { AccountSelector } from "@/components/employee-of/AccountSelector";
import { ChatList } from "@/components/employee-of/ChatList";
import { ChatWindow } from "@/components/employee-of/ChatWindow";
import { FanList } from "@/components/employee-of/FanList";
import { EarningsOverview } from "@/components/employee-of/EarningsOverview";
import { useAgency } from "@/hooks/useAgency";

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

export default function OnlyFansDashboard() {
  const { agency } = useAgency();
  const [selectedAccount, setSelectedAccount] = useState<SocialAccountWithOF | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountWithOF[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("messages");

  // Fetch all social accounts for the agency's creators
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!agency?.id) {
        setAccountsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("creator_social_accounts")
        .select(`
          id,
          creator_id,
          of_account_id,
          username,
          creator:creators!inner(id, name, alias, avatar_url, agency_id)
        `)
        .eq("platform", "OnlyFans")
        .eq("creators.agency_id", agency.id)
        .not("of_account_id", "is", null);

      if (error) {
        console.error("Error fetching social accounts:", error);
      } else if (data) {
        const accounts = data.map(item => ({
          id: item.id,
          creator_id: item.creator_id,
          of_account_id: item.of_account_id,
          username: item.username,
          creator: item.creator as { id: string; name: string; alias: string | null; avatar_url: string | null },
        }));
        setSocialAccounts(accounts);
        
        if (accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(accounts[0]);
        }
      }
      
      setAccountsLoading(false);
    };

    fetchSocialAccounts();
  }, [agency?.id, selectedAccount]);

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (socialAccounts.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Connected Accounts</h2>
              <p className="text-muted-foreground max-w-md">
                No creators have connected OnlyFans accounts yet. Connect an account from the Creator detail page.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header with Account Selector */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Subscriber DMs</h1>
            <p className="text-muted-foreground">Manage messages, subscribers, and earnings</p>
          </div>
          <div className="md:ml-auto flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {socialAccounts.length} account{socialAccounts.length !== 1 ? 's' : ''} connected
            </Badge>
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

        {/* Main Content */}
        {selectedAccount && selectedAccount.of_account_id && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="messages" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2">
                <Users className="h-4 w-4" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger value="earnings" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Earnings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="m-0">
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
                    canSendMessages={true}
                  />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscribers" className="m-0">
              <FanList accountId={selectedAccount.of_account_id} />
            </TabsContent>

            <TabsContent value="earnings" className="m-0">
              <EarningsOverview accountId={selectedAccount.of_account_id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
