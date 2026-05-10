import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreatorRail } from "@/components/messages-pro/CreatorRail";
import { ChatList } from "@/components/messages-pro/ChatList";
import { Conversation } from "@/components/messages-pro/Conversation";
import { FanSidebar } from "@/components/messages-pro/FanSidebar";
import { useOfAccounts, type OfAccount } from "@/hooks/useOfAccounts";
import { useOfChats, type OfChatRow } from "@/hooks/useOfChats";

export default function MessagesPro() {
  const { accounts, loading: accountsLoading } = useOfAccounts();
  const [activeAccount, setActiveAccount] = useState<OfAccount | null>(null);

  useEffect(() => {
    if (!activeAccount && accounts.length > 0) setActiveAccount(accounts[0]);
  }, [accounts, activeAccount]);

  const { chats, loading: chatsLoading, sync } = useOfChats(activeAccount?.of_account_id ?? null);
  const [activeChat, setActiveChat] = useState<OfChatRow | null>(null);

  // Reset chat when account changes
  useEffect(() => { setActiveChat(null); }, [activeAccount?.of_account_id]);

  // Keep activeChat in sync with realtime updates
  useEffect(() => {
    if (!activeChat) return;
    const fresh = chats.find((c) => c.id === activeChat.id);
    if (fresh && fresh !== activeChat) setActiveChat(fresh);
  }, [chats, activeChat]);

  const unreadByAccount = useMemo(() => {
    // For now we only know unread for the active account; future: per-account aggregation
    const map: Record<string, number> = {};
    if (activeAccount) {
      map[activeAccount.of_account_id] = chats.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);
    }
    return map;
  }, [chats, activeAccount]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] flex rounded-2xl overflow-hidden border border-border/40 bg-background/40 backdrop-blur-xl shadow-2xl animate-fade-in">
        <CreatorRail
          accounts={accounts}
          activeId={activeAccount?.of_account_id ?? null}
          onSelect={setActiveAccount}
          unreadByAccount={unreadByAccount}
        />
        <ChatList
          chats={chats}
          loading={chatsLoading}
          activeChatId={activeChat?.id ?? null}
          onSelect={setActiveChat}
          onSync={sync}
        />
        <Conversation chat={activeChat} ofAccountId={activeAccount?.of_account_id ?? null} />
        <FanSidebar chat={activeChat} />
      </div>
      {accounts.length === 0 && !accountsLoading && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto bg-card border border-border rounded-xl p-6 max-w-sm text-center shadow-2xl">
            <h3 className="text-base font-semibold mb-2">No OnlyFans accounts connected</h3>
            <p className="text-xs text-muted-foreground">
              Go to a Creator → Platform Accounts and connect via OnlyFansAPI to start using Messages Pro.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
