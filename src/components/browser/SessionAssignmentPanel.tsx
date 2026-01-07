import { useState } from "react";
import { UserPlus, X, User, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSessionLinkAssignments, CreateAssignmentInput } from "@/hooks/useSessionLinkAssignments";
import { useChatters } from "@/hooks/useChatters";
import { useChatterShifts } from "@/hooks/useChatterShifts";
import { CreatorSessionLink } from "@/hooks/useCreatorSessionLinks";
import { format } from "date-fns";

interface SessionAssignmentPanelProps {
  sessionLinks: CreatorSessionLink[];
  getCreatorName: (creatorId: string) => string;
}

export function SessionAssignmentPanel({ sessionLinks, getCreatorName }: SessionAssignmentPanelProps) {
  const { assignments, loading, createAssignment, deleteAssignment } = useSessionLinkAssignments();
  const { chatters, loading: loadingChatters } = useChatters();
  const { shifts, loading: loadingShifts } = useChatterShifts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSessionLink, setSelectedSessionLink] = useState<string>("");
  const [selectedChatter, setSelectedChatter] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeChatters = chatters.filter(c => c.is_active);
  const readySessionLinks = sessionLinks.filter(s => s.session_status === "ready");

  // Get shifts for the selected chatter
  const chatterShifts = shifts.filter(s => s.chatter_id === selectedChatter);

  const handleAssign = async () => {
    if (!selectedSessionLink || !selectedChatter) return;

    setIsSubmitting(true);
    try {
      const input: CreateAssignmentInput = {
        session_link_id: selectedSessionLink,
        chatter_id: selectedChatter,
        shift_id: selectedShift || null,
      };
      await createAssignment(input);
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await deleteAssignment(id);
    } catch (err) {
      console.error("Failed to remove assignment:", err);
    }
  };

  const resetForm = () => {
    setSelectedSessionLink("");
    setSelectedChatter("");
    setSelectedShift("");
  };

  const getSessionLabel = (linkId: string) => {
    const link = sessionLinks.find(l => l.id === linkId);
    if (!link) return "Unknown Session";
    const creatorName = getCreatorName(link.creator_id);
    return `${creatorName} - ${link.platform}`;
  };

  const isLoading = loading || loadingChatters || loadingShifts;

  return (
    <Card className="glass-card animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Session Assignments
            </CardTitle>
            <CardDescription>
              Assign browser sessions to chatters for their shifts
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={readySessionLinks.length === 0}>
                <UserPlus className="h-4 w-4" />
                Assign Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Session to Chatter</DialogTitle>
                <DialogDescription>
                  Select a browser session and chatter to create an assignment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Browser Session</Label>
                  <Select value={selectedSessionLink} onValueChange={setSelectedSessionLink}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      {readySessionLinks.map(link => (
                        <SelectItem key={link.id} value={link.id}>
                          {getCreatorName(link.creator_id)} - {link.platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {readySessionLinks.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No ready sessions available. Set up and save a session first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Chatter</Label>
                  <Select value={selectedChatter} onValueChange={(val) => {
                    setSelectedChatter(val);
                    setSelectedShift(""); // Reset shift when chatter changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chatter" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeChatters.map(chatter => (
                        <SelectItem key={chatter.id} value={chatter.id}>
                          <div className="flex items-center gap-2">
                            <span>{chatter.name}</span>
                            <Badge variant="outline" className="text-xs">
                              Grade {chatter.skill_grade}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shift (optional)</Label>
                  <Select 
                    value={selectedShift} 
                    onValueChange={setSelectedShift}
                    disabled={!selectedChatter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shift (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific shift</SelectItem>
                      {chatterShifts.map(shift => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {format(new Date(shift.shift_start), "MMM d, h:mm a")} - 
                          {format(new Date(shift.shift_end), "h:mm a")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedChatter && chatterShifts.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No shifts scheduled for this chatter.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedSessionLink || !selectedChatter || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Session"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No assignments yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Assign ready sessions to chatters for their shifts
            </p>
          </div>
        ) : (
          assignments.map(assignment => (
            <div
              key={assignment.id}
              className="p-4 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignment.chatter?.name || 'chatter'}`}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {assignment.chatter?.name?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">
                      {assignment.chatter?.name || "Unknown Chatter"}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Grade {assignment.chatter?.skill_grade || "?"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      {getSessionLabel(assignment.session_link_id)}
                    </Badge>
                    {assignment.shift && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(assignment.shift.shift_start), "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>
                  {assignment.access_count > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Accessed {assignment.access_count} time{assignment.access_count !== 1 ? 's' : ''}
                      {assignment.accessed_at && (
                        <> • Last: {format(new Date(assignment.accessed_at), "MMM d, h:mm a")}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => handleRemoveAssignment(assignment.id)}
                title="Remove Assignment"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
