import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { firecrawlApi, ScrapeResult, SearchResult } from "@/lib/api/firecrawl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Globe,
  Search,
  Loader2,
  ExternalLink,
  Copy,
  UserPlus,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function WebScraper() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"scrape" | "search">("scrape");
  
  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Import dialog
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<{ name?: string; url?: string } | null>(null);

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast.error("Please enter a URL to scrape");
      return;
    }

    setScrapeLoading(true);
    setScrapeResult(null);

    try {
      const response = await firecrawlApi.scrape(scrapeUrl, {
        formats: ["markdown", "links"],
        onlyMainContent: true,
      });

      if (response.success && response.data) {
        setScrapeResult(response.data);
        toast.success("Page scraped successfully");
      } else {
        toast.error(response.error || "Failed to scrape page");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error("Failed to scrape page. Make sure Firecrawl is configured.");
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setSearchLoading(true);
    setSearchResults([]);

    try {
      const response = await firecrawlApi.search(searchQuery, {
        limit: 10,
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
        toast.success(`Found ${response.data.length} results`);
      } else {
        toast.error(response.error || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Make sure Firecrawl is configured.");
    } finally {
      setSearchLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleImportAsProspect = (data: { name?: string; url?: string }) => {
    setImportData(data);
    setShowImportDialog(true);
  };

  const confirmImport = () => {
    // Navigate to recruiting page with pre-filled data
    navigate("/recruiting", { 
      state: { 
        prefillData: {
          name: importData?.name || "",
          source: importData?.url || scrapeUrl,
        }
      }
    });
    setShowImportDialog(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Web Scraper</h1>
          <p className="text-muted-foreground">
            Scrape publicly available data from websites and search the web
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "scrape" | "search")}>
          <TabsList>
            <TabsTrigger value="scrape">
              <Globe className="h-4 w-4 mr-2" />
              Scrape URL
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Web Search
            </TabsTrigger>
          </TabsList>

          {/* Scrape Tab */}
          <TabsContent value="scrape" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scrape a Web Page</CardTitle>
                <CardDescription>
                  Enter a URL to extract text content and links from publicly accessible pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/profile"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                  />
                  <Button onClick={handleScrape} disabled={scrapeLoading}>
                    {scrapeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Scrape"
                    )}
                  </Button>
                </div>

                {scrapeResult && (
                  <div className="space-y-4">
                    {/* Metadata */}
                    {scrapeResult.metadata && (
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{scrapeResult.metadata.title || "Untitled"}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportAsProspect({ 
                                name: scrapeResult.metadata?.title,
                                url: scrapeResult.metadata?.sourceURL 
                              })}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Import as Prospect
                            </Button>
                            {scrapeResult.metadata.sourceURL && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(scrapeResult.metadata?.sourceURL, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {scrapeResult.metadata.description && (
                          <p className="text-sm text-muted-foreground">{scrapeResult.metadata.description}</p>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    {scrapeResult.markdown && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Content
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(scrapeResult.markdown || "")}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <ScrollArea className="h-64 rounded-md border p-4">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {scrapeResult.markdown}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Links */}
                    {scrapeResult.links && scrapeResult.links.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Links Found ({scrapeResult.links.length})
                        </h4>
                        <ScrollArea className="h-48 rounded-md border p-4">
                          <div className="space-y-1">
                            {scrapeResult.links.slice(0, 50).map((link, i) => (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline block truncate"
                              >
                                {link}
                              </a>
                            ))}
                            {scrapeResult.links.length > 50 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                ... and {scrapeResult.links.length - 50} more
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Web Search</CardTitle>
                <CardDescription>
                  Search the web for publicly available information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for creators, profiles, etc."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searchLoading}>
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((result, i) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {result.title || result.url}
                            </a>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {result.url}
                            </p>
                            {result.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportAsProspect({ 
                                name: result.title,
                                url: result.url 
                              })}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setScrapeUrl(result.url);
                                setActiveTab("scrape");
                              }}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import as Recruiting Prospect</DialogTitle>
            <DialogDescription>
              This will create a new prospect in your recruiting pipeline with the scraped data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {importData?.name && (
              <p><span className="text-muted-foreground">Name:</span> {importData.name}</p>
            )}
            {importData?.url && (
              <p><span className="text-muted-foreground">Source:</span> {importData.url}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>
              <UserPlus className="h-4 w-4 mr-2" />
              Import to Recruiting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
