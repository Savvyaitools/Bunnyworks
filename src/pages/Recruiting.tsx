import { useState } from "react";
import { 
  Search, Plus, MoreVertical, Trash2, UserCheck, 
  Phone, Mail, Globe, MessageSquare
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  useRecruitingCreators, 
  RecruitingStatus, 
  CreateRecruitingInput 
} from "@/hooks/useRecruitingCreators";

const statusStyles: Record<RecruitingStatus, string> = {
  prospecting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  interviewed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<RecruitingStatus, string> = {
  prospecting: "Prospecting",
  contacted: "Contacted",
  interviewed: "Interviewed",
  approved: "Approved",
  rejected: "Rejected",
};

const allStatuses: RecruitingStatus[] = ["prospecting", "contacted", "interviewed", "approved", "rejected"];

export default function Recruiting() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<RecruitingStatus | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateRecruitingInput>>({
    name: "",
    alias: "",
    email: "",
    phone: "",
    source: "",
    status: "prospecting",
    notes: "",
  });

  const {
    recruitingCreators,
    loading,
    stats,
    createRecruitingCreator,
    updateRecruitingCreator,
    deleteRecruitingCreator,
    onboardCreator,
  } = useRecruitingCreators();

  const filteredCreators = recruitingCreators.filter((creator) => {
    const matchesSearch = 
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.alias?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || creator.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    await createRecruitingCreator({
      name: formData.name,
      alias: formData.alias || null,
      email: formData.email || null,
      phone: formData.phone || null,
      source: formData.source || null,
      status: formData.status as RecruitingStatus,
      notes: formData.notes || null,
    });

    setFormData({ name: "", alias: "", email: "", phone: "", source: "", status: "prospecting", notes: "" });
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = async (id: string, newStatus: RecruitingStatus) => {
    await updateRecruitingCreator(id, { status: newStatus });
  };

  const handleOnboard = async (id: string) => {
    await onboardCreator(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Recruiting</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `${stats.total} prospects in pipeline`}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Prospect
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Prospect</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Creator name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alias">Alias / Handle</Label>
                    <Input
                      id="alias"
                      value={formData.alias}
                      onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                      placeholder="@handle"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="Instagram, Referral, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as RecruitingStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  Add Prospect
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in" style={{ animationDelay: "50ms" }}>
          {allStatuses.map((status) => (
            <div
              key={status}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                selectedStatus === status ? "ring-2 ring-primary" : "hover:border-primary/50",
                "bg-card"
              )}
              onClick={() => setSelectedStatus(selectedStatus === status ? "all" : status)}
            >
              <p className="text-2xl font-bold text-foreground">{stats[status]}</p>
              <p className="text-sm text-muted-foreground capitalize">{statusLabels[status]}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
          {selectedStatus !== "all" && (
            <Button
              variant="outline"
              onClick={() => setSelectedStatus("all")}
              className="bg-transparent border-border"
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border">
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
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all animate-fade-in"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {creator.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{creator.name}</h3>
                      {creator.alias && (
                        <p className="text-sm text-muted-foreground">{creator.alias}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      {allStatuses.map((status) => (
                        <DropdownMenuItem 
                          key={status}
                          onClick={() => handleStatusChange(creator.id, status)}
                          disabled={creator.status === status}
                        >
                          Set {statusLabels[status]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      {creator.status === "approved" && (
                        <DropdownMenuItem onClick={() => handleOnboard(creator.id)} className="text-green-400">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Onboard Creator
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteRecruitingCreator(creator.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Prospect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge className={cn("text-xs mb-3", statusStyles[creator.status])}>
                  {statusLabels[creator.status]}
                </Badge>

                <div className="space-y-2 text-sm">
                  {creator.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{creator.email}</span>
                    </div>
                  )}
                  {creator.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{creator.phone}</span>
                    </div>
                  )}
                  {creator.source && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>{creator.source}</span>
                    </div>
                  )}
                </div>

                {creator.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="line-clamp-2">{creator.notes}</p>
                    </div>
                  </div>
                )}

                {creator.status === "approved" && (
                  <Button 
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => handleOnboard(creator.id)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Onboard Creator
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCreators.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No prospects found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
