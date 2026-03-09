import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  UserCog,
  CheckSquare,
  Calendar,
  BookOpen,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  UserPlus,
  CalendarClock,
  
  ClipboardList,
  Globe,
  Search,
  HelpCircle,
  Bot,
  BrainCircuit,
  Share2,
  MessagesSquare,
} from "lucide-react";

const commandItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", group: "Main" },
  { label: "OF AI", icon: Bot, path: "/of-ai", group: "Main" },
  { label: "Creators", icon: Users, path: "/creators", group: "Main" },
  { label: "Creator Messages", icon: MessageSquare, path: "/messages", group: "Main" },
  { label: "Team", icon: UserCog, path: "/team", group: "Main" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks", group: "Main" },
  { label: "Calendar", icon: Calendar, path: "/calendar", group: "Main" },
  { label: "Invoices", icon: FileText, path: "/invoices", group: "Main" },
  { label: "Live Sessions", icon: Globe, path: "/browser-sync", group: "OnlyFans" },
  { label: "Shift Roster", icon: CalendarClock, path: "/shifts", group: "OnlyFans" },
  { label: "Team Chat", icon: MessageSquare, path: "/team-chat", group: "OnlyFans" },
  { label: "Recruiting", icon: UserPlus, path: "/recruiting", group: "Recruiting" },
  { label: "OF Discovery", icon: Search, path: "/tools/creator-discovery", group: "Recruiting" },
  { label: "Applications", icon: ClipboardList, path: "/applications", group: "Recruiting" },
  { label: "Tatum (Social Media)", icon: Share2, path: "/coach/social-media", group: "Coach PBF" },
  { label: "Jodie (AI Chatter)", icon: MessagesSquare, path: "/coach/ai-chatter", group: "Coach PBF" },
  { label: "AI Image Generator", icon: BrainCircuit, path: "/of-ai/image-generator", group: "Coach PBF" },
  { label: "SOP Library", icon: BookOpen, path: "/sop", group: "Resources" },
  
  { label: "User Guide", icon: HelpCircle, path: "/guide", group: "Resources" },
  { label: "Notifications", icon: Bell, path: "/notifications", group: "Settings" },
  { label: "Settings", icon: Settings, path: "/settings", group: "Settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const groups = [...new Set(commandItems.map((i) => i.group))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages... (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {commandItems
              .filter((i) => i.group === group)
              .map((item) => (
                <CommandItem
                  key={item.path}
                  onSelect={() => handleSelect(item.path)}
                  className="cursor-pointer"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
