import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BunnyChatTopBar } from "@/components/bunnychat/BunnyChatTopBar";
import { ChatList } from "@/components/bunnychat/ChatList";
import { Conversation } from "@/components/bunnychat/Conversation";
import { FanSidebar } from "@/components/bunnychat/FanSidebar";
import { MassMessageComposer } from "@/components/bunnychat/MassMessageComposer";
import { useOfAccounts, type OfAccount } from "@/hooks/useOfAccounts";
import { useOfChats, type OfChatRow } from "@/hooks/useOfChats";

export default function BunnyChat() {
  const { accounts, loading: accountsLoading } = useOfAccounts();
  const [activeAccount, setActiveAccount] = useState<OfAccount | null>(null);
  const [speedMode, setSpeedMode] = useState(false);
  const [aiAssist, setAiAssist] = useState(true);

  useEffect(() => {
    if (!activeAccount && accounts.length > 0) setActiveAccount(accounts[0]);
  }, [accounts, activeAccount]);

  const { chats, loading: chatsLoading, sync } = useOfChats(activeAccount?.of_account_id ?? null);
  const [activeChat, setActiveChat] = useState<OfChatRow | null>(null);
  const [massOpen, setMassOpen] = useState(false);

  useEffect(() => { setActiveChat(null); }, [activeAccount?.of_account_id]);

  useEffect(() => {
    if (!activeChat) return;
    const fresh = chats.find((c) => c.id === activeChat.id);
    if (fresh && fresh !== activeChat) setActiveChat(fresh);
  }, [chats, activeChat]);

  return (
    <DashboardLayout>
      <div
        className="bunnychat-root h-[calc(100vh-6rem)] flex flex-col rounded-2xl overflow-hidden border border-border/40 bg-background/40 backdrop-blur-xl shadow-2xl animate-fade-in"
        style={{
          // Infloww orange accent scoped to this page only
          ['--mp-accent' as any]: '20 90% 58%',
          ['--mp-accent-glow' as any]: '20 100% 65%',
        }}
      >
        <BunnyChatTopBar
          accounts={accounts}
          activeAccount={activeAccount}
          onSelectAccount={setActiveAccount}
          chats={chats}
          speedMode={speedMode}
          onSpeedModeChange={setSpeedMode}
          aiAssist={aiAssist}
          onAiAssistChange={setAiAssist}
          onOpenMassMessage={() => setMassOpen(true)}
        />
        <div className="flex-1 flex min-h-0">
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
      </div>
      <MassMessageComposer
        open={massOpen}
        onOpenChange={setMassOpen}
        ofAccountId={activeAccount?.of_account_id ?? null}
        chats={chats}
        accountLabel={activeAccount?.username ?? undefined}
      />
      {accounts.length === 0 && !accountsLoading && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto bg-card border border-border rounded-xl p-6 max-w-sm text-center shadow-2xl">
            <h3 className="text-base font-semibold mb-2">No OnlyFans accounts connected</h3>
            <p className="text-xs text-muted-foreground">
              Go to a Creator → Platform Accounts and connect via OnlyFansAPI to start using BunnyChat Arcade.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
