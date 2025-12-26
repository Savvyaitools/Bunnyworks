import { useState } from "react";
import { Search, Plus, MoreVertical, MessageSquare, DollarSign, Loader2, Trash2, Edit } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreators, Creator, CreateCreatorInput } from "@/hooks/useCreators";
import { Skeleton } from "@/components/ui/skeleton";

type LifecycleState = "Active" | "Onboarding" | "Paused" | "Offboarded";

const stateStyles: Record<LifecycleState, string> = {
  Active: "badge-active",
  Onboarding: "badge-onboarding",
  Paused: "badge-paused",
  Offboarded: "badge-offboarded",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Creators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<LifecycleState | "All">("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateCreatorInput>>({
    name: "",
    email: "",
    status: "Onboarding",
    revenue: 0,
    platform: "",
    followers: "",
  });

  const { creators, loading, stats, createCreator, updateCreator, deleteCreator } = useCreators();

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === "All" || creator.status === selectedState;
    return matchesSearch && matchesState;
  });

  const states: (LifecycleState | "All")[] = ["All", "Active", "Onboarding", "Paused", "Offboarded"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    await createCreator({
      name: formData.name,
      email: formData.email,
      phone: null,
      avatar_seed: formData.name.toLowerCase().split(" ")[0],
      status: formData.status as LifecycleState,
      revenue: formData.revenue || 0,
      platform: formData.platform || null,
      followers: formData.followers || null,
      notes: null,
    });

    setFormData({ name: "", email: "", status: "Onboarding", revenue: 0, platform: "", followers: "" });
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = async (creator: Creator, newStatus: LifecycleState) => {
    await updateCreator(creator.id, { status: newStatus });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Creators</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `${stats.total} creators • ${formatCurrency(stats.totalRevenue)} total revenue`}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Creator
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New Creator</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Creator name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="creator@email.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Input
                      id="platform"
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      placeholder="YouTube, TikTok, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followers">Followers</Label>
                    <Input
                      id="followers"
                      value={formData.followers}
                      onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                      placeholder="1.5M"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as LifecycleState })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Offboarded">Offboarded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  Add Creator
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="creator-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="creator-card animate-fade-in"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {creator.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{creator.name}</h3>
                      <p className="text-sm text-muted-foreground">{creator.platform || "No platform"}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => handleStatusChange(creator, "Active")}>
                        Set Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(creator, "Paused")}>
                        Set Paused
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(creator, "Offboarded")}>
                        Set Offboarded
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteCreator(creator.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Creator
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={cn("text-xs", stateStyles[creator.status as LifecycleState])}>
                    {creator.status}
                  </Badge>
                  {creator.followers && (
                    <span className="text-xs text-muted-foreground">{creator.followers} followers</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(Number(creator.revenue))}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{creator.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">Contact</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCreators.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No creators found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
