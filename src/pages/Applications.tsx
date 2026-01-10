import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { usePendingApplications, PendingApplication } from "@/hooks/usePendingApplications";
import { useAgency } from "@/hooks/useAgency";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Link2,
  Copy,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { format } from "date-fns";

export default function Applications() {
  const { applications, loading, stats, approveApplication, rejectApplication, isApproving, isRejecting } = usePendingApplications();
  const { agencyId } = useAgency();
  
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Use the agency's configured website for shareable links
  // Priority: agency.website > VITE_PRODUCTION_URL > window.location.origin
  const { agency } = useAgency();
  
  const getBaseUrl = () => {
    // If agency has a website configured, use it (ensuring https://)
    if (agency?.website) {
      const website = agency.website.trim();
      if (website.startsWith('http://') || website.startsWith('https://')) {
        return website.replace(/\/$/, ''); // Remove trailing slash
      }
      return `https://${website}`.replace(/\/$/, '');
    }
    // Use production URL if available (for deployed apps)
    const productionUrl = import.meta.env.VITE_PRODUCTION_URL;
    if (productionUrl) {
      return productionUrl.replace(/\/$/, '');
    }
    return window.location.origin;
  };
  
  const baseUrl = getBaseUrl();
  const creatorLink = `${baseUrl}/apply/creator/${agencyId}`;
  const employeeLink = `${baseUrl}/apply/employee/${agencyId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} link copied to clipboard`);
  };

  const filteredApplications = applications.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (application: PendingApplication) => {
    try {
      await approveApplication(application);
      setSelectedApplication(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    try {
      await rejectApplication({ id: selectedApplication.id, reason: rejectionReason });
      setShowRejectDialog(false);
      setSelectedApplication(null);
      setRejectionReason("");
    } catch {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Applications</h1>
            <p className="text-muted-foreground">Review and manage incoming applications</p>
          </div>
          <Button onClick={() => setShowLinkDialog(true)}>
            <Link2 className="h-4 w-4 mr-2" />
            Get Shareable Links
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.creators}</p>
                  <p className="text-sm text-muted-foreground">Creators</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.employees}</p>
                  <p className="text-sm text-muted-foreground">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Applications Table */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected", "all"].map((status) => (
            <TabsContent key={status} value={status}>
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications
                          .filter((app) => status === "all" || app.status === status)
                          .map((application) => (
                            <TableRow key={application.id}>
                              <TableCell className="font-medium">{application.name}</TableCell>
                              <TableCell>{application.email}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {application.application_type === "creator" ? (
                                    <><Users className="h-3 w-3 mr-1" /> Creator</>
                                  ) : (
                                    <><Briefcase className="h-3 w-3 mr-1" /> Employee</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(application.status)}</TableCell>
                              <TableCell>
                                {format(new Date(application.submitted_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedApplication(application)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {filteredApplications.filter((app) => status === "all" || app.status === status).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                              No applications found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* View Application Dialog */}
      <Dialog open={!!selectedApplication && !showRejectDialog} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedApplication.application_type === "creator" ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Briefcase className="h-5 w-5" />
                  )}
                  {selectedApplication.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedApplication.application_type === "creator" ? "Creator" : "Employee"} application submitted on{" "}
                  {format(new Date(selectedApplication.submitted_at), "MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedApplication.phone || "Not provided"}</p>
                  </div>
                </div>

                {selectedApplication.application_type === "creator" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Platform</p>
                        <p className="font-medium">{selectedApplication.platform || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Followers</p>
                        <p className="font-medium">{selectedApplication.followers || "Not specified"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Social Links</p>
                      <div className="space-y-1 text-sm">
                        {selectedApplication.onlyfans_url && (
                          <p><span className="text-muted-foreground">OnlyFans:</span> {selectedApplication.onlyfans_url}</p>
                        )}
                        {selectedApplication.instagram_url && (
                          <p><span className="text-muted-foreground">Instagram:</span> {selectedApplication.instagram_url}</p>
                        )}
                        {selectedApplication.tiktok_url && (
                          <p><span className="text-muted-foreground">TikTok:</span> {selectedApplication.tiktok_url}</p>
                        )}
                        {selectedApplication.twitter_url && (
                          <p><span className="text-muted-foreground">Twitter:</span> {selectedApplication.twitter_url}</p>
                        )}
                        {selectedApplication.snapchat_url && (
                          <p><span className="text-muted-foreground">Snapchat:</span> {selectedApplication.snapchat_url}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Desired Role</p>
                        <p className="font-medium">{selectedApplication.role_preference || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{selectedApplication.department_preference || "Not specified"}</p>
                      </div>
                    </div>
                    {selectedApplication.experience && (
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-medium">{selectedApplication.experience}</p>
                      </div>
                    )}
                    {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedApplication.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedApplication.bio && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bio</p>
                        <p className="font-medium">{selectedApplication.bio}</p>
                      </div>
                    )}
                  </>
                )}

                {selectedApplication.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedApplication.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>

                {selectedApplication.rejection_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Rejection Reason</p>
                    <p className="font-medium text-destructive">{selectedApplication.rejection_reason}</p>
                  </div>
                )}
              </div>

              {selectedApplication.status === "pending" && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isRejecting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedApplication)}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve & Add
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this application (optional).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shareable Links Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shareable Application Links</DialogTitle>
            <DialogDescription>
              Share these links with potential creators or employees to apply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Creator Application Link</label>
              <div className="flex gap-2">
                <Input value={creatorLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(creatorLink, "Creator")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee Application Link</label>
              <div className="flex gap-2">
                <Input value={employeeLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(employeeLink, "Employee")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
