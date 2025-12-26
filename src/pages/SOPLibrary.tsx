import { useState } from "react";
import { Search, Plus, FileText, Download, Eye, Trash2, FolderOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SOP {
  id: string;
  title: string;
  category: string;
  roles: string[];
  lastUpdated: string;
  acknowledged: number;
  total: number;
}

const sops: SOP[] = [
  {
    id: "1",
    title: "Content Creation Guidelines",
    category: "Content",
    roles: ["Manager", "VA", "Chatter"],
    lastUpdated: "Dec 20, 2024",
    acknowledged: 8,
    total: 10,
  },
  {
    id: "2",
    title: "Fan Messaging Best Practices",
    category: "Chatting",
    roles: ["Chatter"],
    lastUpdated: "Dec 18, 2024",
    acknowledged: 4,
    total: 4,
  },
  {
    id: "3",
    title: "Creator Onboarding Checklist",
    category: "Onboarding",
    roles: ["Manager", "Admin"],
    lastUpdated: "Dec 15, 2024",
    acknowledged: 3,
    total: 3,
  },
  {
    id: "4",
    title: "Brand Voice & Tone Guide",
    category: "Content",
    roles: ["Manager", "VA", "Chatter"],
    lastUpdated: "Dec 10, 2024",
    acknowledged: 7,
    total: 10,
  },
  {
    id: "5",
    title: "Platform Compliance Rules",
    category: "Compliance",
    roles: ["Manager", "VA", "Chatter", "Admin"],
    lastUpdated: "Dec 5, 2024",
    acknowledged: 12,
    total: 12,
  },
  {
    id: "6",
    title: "Revenue Split Calculations",
    category: "Finance",
    roles: ["Admin"],
    lastUpdated: "Nov 28, 2024",
    acknowledged: 2,
    total: 2,
  },
  {
    id: "7",
    title: "Social Media Scheduling Guide",
    category: "Content",
    roles: ["VA"],
    lastUpdated: "Nov 20, 2024",
    acknowledged: 3,
    total: 4,
  },
];

const categoryColors: Record<string, string> = {
  Content: "bg-primary/20 text-primary border-primary/30",
  Chatting: "bg-accent/20 text-accent border-accent/30",
  Onboarding: "bg-success/20 text-success border-success/30",
  Compliance: "bg-destructive/20 text-destructive border-destructive/30",
  Finance: "bg-warning/20 text-warning border-warning/30",
};

export default function SOPLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "All">("All");

  const categories = ["All", ...Array.from(new Set(sops.map((sop) => sop.category)))];

  const filteredSOPs = sops.filter((sop) => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">SOP Library</h1>
            <p className="text-muted-foreground mt-1">Standard operating procedures and documentation</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary input-glow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* SOP Table */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Document</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Access</TableHead>
                <TableHead className="text-muted-foreground">Acknowledged</TableHead>
                <TableHead className="text-muted-foreground">Last Updated</TableHead>
                <TableHead className="text-muted-foreground w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSOPs.map((sop, index) => (
                <TableRow 
                  key={sop.id} 
                  className="table-row-hover border-border animate-fade-in"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{sop.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border", categoryColors[sop.category])}>
                      {sop.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sop.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs border-border text-muted-foreground">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-20">
                        <div 
                          className="h-full bg-gradient-primary rounded-full"
                          style={{ width: `${(sop.acknowledged / sop.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {sop.acknowledged}/{sop.total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sop.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredSOPs.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
