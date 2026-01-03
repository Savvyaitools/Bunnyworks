import { DataImport } from "@/hooks/useDataImports";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, CheckCircle, XCircle, Clock, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ImportHistoryProps {
  imports: DataImport[];
  onDelete: (params: { importId: string; filePath: string }) => void;
  onRetry?: (importId: string) => void;
  retryingImportId?: string | null;
}

const statusConfig: Record<string, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  processing: { icon: Loader2, variant: "secondary", label: "Processing" },
  pending_review: { icon: Clock, variant: "outline", label: "Pending Review" },
  approved: { icon: CheckCircle, variant: "default", label: "Approved" },
  rejected: { icon: XCircle, variant: "destructive", label: "Rejected" },
};

export function ImportHistory({ imports, onDelete, onRetry, retryingImportId }: ImportHistoryProps) {
  if (imports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No import history yet. Upload your first screenshot above.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((importItem) => {
            const status = statusConfig[importItem.status] || statusConfig.processing;
            const StatusIcon = status.icon;
            const isProcessing = importItem.status === "processing";
            const isRetrying = retryingImportId === importItem.id;
            const canRetry = (importItem.status === "processing" || importItem.status === "rejected") && onRetry;

            return (
              <TableRow key={importItem.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {importItem.url && (
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={importItem.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <span className="truncate max-w-[200px]">{importItem.file_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {importItem.creator?.name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className={`h-3 w-3 ${isProcessing || isRetrying ? "animate-spin" : ""}`} />
                    {isRetrying ? "Retrying..." : status.label}
                  </Badge>
                  {importItem.rejection_reason && (
                    <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                      {importItem.rejection_reason}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {importItem.confidence_score !== null ? (
                    <span className={
                      importItem.confidence_score >= 0.9
                        ? "text-success"
                        : importItem.confidence_score >= 0.7
                        ? "text-warning"
                        : "text-muted-foreground"
                    }>
                      {Math.round(importItem.confidence_score * 100)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(importItem.created_at), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canRetry && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onRetry(importItem.id)}
                            disabled={isRetrying}
                          >
                            <RotateCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Retry analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {importItem.url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                      >
                        <a href={importItem.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Import</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this import? This will also remove all extracted data associated with it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDelete({ importId: importItem.id, filePath: importItem.file_path })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
