import { useState } from "react";
import { Plus, DollarSign, Calendar, Clock, CheckCircle, XCircle, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomRequests, CustomRequest } from "@/hooks/useCustomRequests";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CreatorCustomRequestsProps {
  creatorId: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

export function CreatorCustomRequests({ creatorId }: CreatorCustomRequestsProps) {
  const { requests, loading, stats, createRequest, updateRequest, deleteRequest } = useCustomRequests(creatorId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    due_date: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    await createRequest.mutateAsync({
      creator_id: creatorId,
      title: formData.title,
      description: formData.description || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      due_date: formData.due_date || undefined,
      notes: formData.notes || undefined,
    });

    setFormData({ title: "", description: "", price: "", due_date: "", notes: "" });
    setIsAddOpen(false);
  };

  const handleStatusUpdate = async (id: string, status: CustomRequest["status"]) => {
    await updateRequest.mutateAsync({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Custom Requests</h3>
          <p className="text-sm text-muted-foreground">
            Track custom content requests and their status
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Request Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <Textarea
                placeholder="Internal Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
              <Button 
                onClick={handleCreate} 
                className="w-full"
                disabled={createRequest.isPending}
              >
                {createRequest.isPending ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No custom requests yet.</p>
          <p className="text-sm mt-1">Create a request to track custom content orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="glass-card">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{request.title}</h4>
                      <Badge className={cn("text-xs border", statusStyles[request.status])}>
                        <span className="mr-1">{statusIcons[request.status]}</span>
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {request.description && (
                      <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {request.price !== null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(request.price)}
                        </span>
                      )}
                      {request.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {formatDate(request.due_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {formatDate(request.created_at)}
                      </span>
                    </div>
                    {request.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Note: {request.notes}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {request.status === "pending" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, "in_progress")}>
                          Start Work
                        </DropdownMenuItem>
                      )}
                      {request.status === "in_progress" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, "completed")}>
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      {request.status !== "cancelled" && request.status !== "completed" && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(request.id, "cancelled")}
                          className="text-destructive"
                        >
                          Cancel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => deleteRequest.mutate(request.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
