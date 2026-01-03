import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDataImports } from "@/hooks/useDataImports";
import { ImportUploader, ReviewQueue, ImportHistory } from "@/components/imports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Clock, History, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function DataImport() {
  const {
    imports,
    loading,
    uploading,
    processingImports,
    pendingReviewImports,
    approvedImports,
    rejectedImports,
    uploadAndAnalyze,
    approveImport,
    rejectImport,
    deleteImport,
    getExtractedData,
  } = useDataImports();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Data Import</h1>
          <p className="text-muted-foreground mt-1">
            Upload screenshots from creator platforms to extract earnings, stats, and analytics
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Loader2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{processingImports.length}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReviewImports.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedImports.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedImports.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2">
              <Clock className="h-4 w-4" />
              Review Queue
              {pendingReviewImports.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingReviewImports.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Upload Screenshot</h2>
              <ImportUploader onUpload={uploadAndAnalyze} uploading={uploading} />
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Review</h2>
              <ReviewQueue
                imports={pendingReviewImports}
                onApprove={approveImport}
                onReject={rejectImport}
                getExtractedData={getExtractedData}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Import History</h2>
              <ImportHistory imports={imports} onDelete={deleteImport} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
