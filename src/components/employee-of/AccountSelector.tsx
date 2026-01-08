import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface AccountSelectorProps {
  accounts: SocialAccountWithOF[];
  selectedAccount: SocialAccountWithOF | null;
  onSelect: (account: SocialAccountWithOF) => void;
}

export function AccountSelector({ accounts, selectedAccount, onSelect }: AccountSelectorProps) {
  if (accounts.length === 0) {
    return null;
  }

  if (accounts.length === 1) {
    const account = accounts[0];
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-lg">
        <Avatar className="h-8 w-8">
          <AvatarImage src={account.creator.avatar_url || undefined} />
          <AvatarFallback>{account.creator.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{account.creator.alias || account.creator.name}</div>
          <div className="text-xs text-muted-foreground">@{account.username}</div>
        </div>
      </div>
    );
  }

  return (
    <Select
      value={selectedAccount?.id || ""}
      onValueChange={(value) => {
        const account = accounts.find(a => a.id === value);
        if (account) onSelect(account);
      }}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select an account">
          {selectedAccount && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedAccount.creator.avatar_url || undefined} />
                <AvatarFallback>{selectedAccount.creator.name[0]}</AvatarFallback>
              </Avatar>
              <span>{selectedAccount.creator.alias || selectedAccount.creator.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={account.creator.avatar_url || undefined} />
                <AvatarFallback>{account.creator.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{account.creator.alias || account.creator.name}</div>
                <div className="text-xs text-muted-foreground">@{account.username}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
