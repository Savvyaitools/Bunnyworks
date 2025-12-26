import { useState } from "react";
import { Search, Plus, Filter, MoreVertical, MessageSquare, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type LifecycleState = "Active" | "Onboarding" | "Paused" | "Offboarded";

interface Creator {
  id: string;
  name: string;
  avatar: string;
  platform: string;
  state: LifecycleState;
  revenue: string;
  unreadMessages: number;
  assignedManager: string;
  joinDate: string;
}

const creators: Creator[] = [
  {
    id: "1",
    name: "Emma Rose",
    avatar: "emma",
    platform: "OnlyFans",
    state: "Active",
    revenue: "$12,450",
    unreadMessages: 2,
    assignedManager: "Sarah",
    joinDate: "Jan 2024",
  },
  {
    id: "2",
    name: "Luna Star",
    avatar: "luna",
    platform: "Fansly",
    state: "Active",
    revenue: "$8,920",
    unreadMessages: 0,
    assignedManager: "Mike",
    joinDate: "Feb 2024",
  },
  {
    id: "3",
    name: "Jessica Blake",
    avatar: "jessica",
    platform: "OnlyFans",
    state: "Onboarding",
    revenue: "$0",
    unreadMessages: 5,
    assignedManager: "Sarah",
    joinDate: "Dec 2024",
  },
  {
    id: "4",
    name: "Mia Chen",
    avatar: "mia",
    platform: "Both",
    state: "Active",
    revenue: "$15,200",
    unreadMessages: 1,
    assignedManager: "Alex",
    joinDate: "Mar 2024",
  },
  {
    id: "5",
    name: "Sophie Taylor",
    avatar: "sophie",
    platform: "OnlyFans",
    state: "Paused",
    revenue: "$6,800",
    unreadMessages: 0,
    assignedManager: "Mike",
    joinDate: "Nov 2023",
  },
  {
    id: "6",
    name: "Ava Wilson",
    avatar: "ava",
    platform: "Fansly",
    state: "Offboarded",
    revenue: "$2,100",
    unreadMessages: 0,
    assignedManager: "Sarah",
    joinDate: "Jun 2023",
  },
];

const stateStyles: Record<LifecycleState, string> = {
  Active: "badge-active",
  Onboarding: "badge-onboarding",
  Paused: "badge-paused",
  Offboarded: "badge-offboarded",
};

export default function Creators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<LifecycleState | "All">("All");

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === "All" || creator.state === selectedState;
    return matchesSearch && matchesState;
  });

  const states: (LifecycleState | "All")[] = ["All", "Active", "Onboarding", "Paused", "Offboarded"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Creators</h1>
            <p className="text-muted-foreground mt-1">Manage your creator roster and lifecycle</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Creator
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary input-glow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {states.map((state) => (
              <Button
                key={state}
                variant={selectedState === state ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedState(state)}
                className={cn(
                  selectedState === state 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {state}
              </Button>
            ))}
          </div>
        </div>

        {/* Creator Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCreators.map((creator, index) => (
            <div
              key={creator.id}
              className="creator-card animate-fade-in"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar}`} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {creator.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {creator.unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground animate-pulse-glow">
                        {creator.unreadMessages}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{creator.name}</h3>
                    <p className="text-sm text-muted-foreground">{creator.platform}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>View Content Vault</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Remove Creator</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge className={cn("text-xs", stateStyles[creator.state])}>
                  {creator.state}
                </Badge>
                <span className="text-xs text-muted-foreground">Since {creator.joinDate}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{creator.revenue}</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{creator.assignedManager}</p>
                    <p className="text-xs text-muted-foreground">Manager</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCreators.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No creators found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
