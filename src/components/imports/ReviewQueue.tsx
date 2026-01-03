import { useState, useEffect } from "react";
import { DataImport, ExtractedData } from "@/hooks/useDataImports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Eye, AlertCircle, DollarSign, Users, MessageSquare, Gift } from "lucide-react";
import { useCreators } from "@/hooks/useCreators";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ReviewQueueProps {
  imports: DataImport[];
  onApprove: (params: { importId: string; creatorId?: string }) => void;
  onReject: (params: { importId: string; reason: string }) => void;
  getExtractedData: (importId: string) => Promise<ExtractedData[]>;
}

const dataTypeIcons: Record<string, React.ElementType> = {
  earnings: DollarSign,
  subscribers: Users,
  messages: MessageSquare,
  tips: Gift,
  ppv_sales: DollarSign,
  referrals: Users,
};

const dataTypeLabels: Record<string, string> = {
  earnings: "Earnings",
  subscribers: "Subscribers",
  messages: "Messages",
  tips: "Tips",
  ppv_sales: "PPV Sales",
  referrals: "Referrals",
};

export function ReviewQueue({ imports, onApprove, onReject, getExtractedData }: ReviewQueueProps) {
  const [selectedImport, setSelectedImport] = useState<DataImport | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { creators } = useCreators();

  useEffect(() => {
    if (selectedImport) {
      setLoadingData(true);
      getExtractedData(selectedImport.id)
        .then(setExtractedData)
        .finally(() => setLoadingData(false));
      setSelectedCreator(selectedImport.creator_id || "");
    }
  }, [selectedImport, getExtractedData]);

  const handleApprove = () => {
    if (selectedImport) {
      onApprove({ 
        importId: selectedImport.id, 
        creatorId: selectedCreator || undefined 
      });
      setSelectedImport(null);
    }
  };

  const handleReject = () => {
    if (selectedImport && rejectReason) {
      onReject({ importId: selectedImport.id, reason: rejectReason });
      setSelectedImport(null);
      setShowRejectDialog(false);
      setRejectReason("");
    }
  };

  if (imports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No imports pending review</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {imports.map((importItem) => (
          <Card key={importItem.id} className="glass-card overflow-hidden">
            <div className="aspect-video relative bg-muted">
              {importItem.url ? (
                <img
                  src={importItem.url}
                  alt={importItem.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Badge 
                className="absolute top-2 right-2"
                variant={importItem.confidence_score && importItem.confidence_score >= 0.7 ? "default" : "secondary"}
              >
                {Math.round((importItem.confidence_score || 0) * 100)}% confidence
              </Badge>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium truncate flex-1">{importItem.file_name}</p>
              </div>
              {importItem.creator && (
                <p className="text-xs text-muted-foreground mb-3">
                  Linked to: {importItem.creator.name}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedImport(importItem)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedImport} onOpenChange={() => setSelectedImport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Extracted Data</DialogTitle>
          </DialogHeader>

          {selectedImport && (
            <div className="space-y-6">
              {/* Screenshot Preview */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {selectedImport.url && (
                  <img
                    src={selectedImport.url}
                    alt={selectedImport.file_name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Creator Selection */}
              <div className="space-y-2">
                <Label>Link to Creator</Label>
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a creator..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No creator</SelectItem>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Extracted Data */}
              <div className="space-y-3">
                <Label>Extracted Data</Label>
                {loadingData ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : extractedData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data extracted</p>
                ) : (
                  <div className="space-y-2">
                    {extractedData.map((data) => {
                      const Icon = dataTypeIcons[data.data_type] || DollarSign;
                      return (
                        <div
                          key={data.id}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="p-2 rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {dataTypeLabels[data.data_type] || data.data_type}:{" "}
                              {data.data_type === "earnings" || data.data_type === "tips" || data.data_type === "ppv_sales"
                                ? `$${data.value.toLocaleString()}`
                                : data.value.toLocaleString()}
                            </p>
                            {data.period_start && data.period_end && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(data.period_start), "MMM d")} - {format(new Date(data.period_end), "MMM d, yyyy")}
                              </p>
                            )}
                            {data.platform && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {data.platform}
                              </Badge>
                            )}
                          </div>
                          <Badge variant={data.confidence && data.confidence >= 0.9 ? "default" : "secondary"}>
                            {Math.round((data.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button onClick={handleApprove}>
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Import</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Reject Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
