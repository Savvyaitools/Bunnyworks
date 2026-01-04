import { MessageSquare, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateType = "no-conversations" | "no-messages" | "select-conversation" | "not-linked";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  className?: string;
}

const icons = {
  "no-conversations": Users,
  "no-messages": MessageSquare,
  "select-conversation": MessageSquare,
  "not-linked": Bell,
};

const defaults: Record<EmptyStateType, { title: string; description: string }> = {
  "no-conversations": {
    title: "No Contacts Yet",
    description: "Add creators or employees to start messaging.",
  },
  "no-messages": {
    title: "No messages yet",
    description: "Start the conversation!",
  },
  "select-conversation": {
    title: "Select a conversation",
    description: "Choose someone to start messaging",
  },
  "not-linked": {
    title: "Account Not Linked",
    description: "Your account is not linked. Please contact the administrator.",
  },
};

export function MessagingEmptyState({
  type,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  const Icon = icons[type];
  const defaultContent = defaults[type];

  return (
    <div className={cn("flex items-center justify-center h-full", className)}>
      <div className="text-center max-w-md px-6">
        <Icon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {title || defaultContent.title}
        </h2>
        <p className="text-muted-foreground mb-4">
          {description || defaultContent.description}
        </p>
        {actions && actions.length > 0 && (
          <div className="flex gap-2 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={action.onClick || (() => action.href && (window.location.href = action.href))}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
