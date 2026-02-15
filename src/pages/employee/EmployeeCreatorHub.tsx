import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Globe, Users, Mail, Phone, FileText, FolderOpen, Megaphone, ClipboardList, Layers } from "lucide-react";
import { CreatorContentVault } from "@/components/creators/CreatorContentVault";
import { CreatorContentPlans } from "@/components/creators/CreatorContentPlans";
import { CreatorCustomRequests } from "@/components/creators/CreatorCustomRequests";
import { CreatorMarketing } from "@/components/creators/CreatorMarketing";
import { cn } from "@/lib/utils";

interface AssignedCreator {
  id: string;
  name: string;
  alias: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
  platform: string | null;
  followers: string | null;
  status: string;
  online_status: boolean | null;
  email: string;
  phone: string | null;
  persona: string | null;
  onlyfans_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  snapchat_url: string | null;
}

export default function EmployeeCreatorHub() {
  const { user } = useAuth();
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);
  const [creators, setCreators] = useState<AssignedCreator[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssignedCreators = useCallback(async () => {
    if (!user) return;

    // Get employee record
    const { data: employee } = await supabase
      .from("employees")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!employee) {
      setLoading(false);
      return;
    }

    setEmployeeRole(employee.role);

    // Get assigned creators via employee_of_permissions (primary source)
    const { data: permissions } = await supabase
      .from("employee_of_permissions")
      .select("creator_id")
      .eq("employee_id", employee.id);

    // Also check creator_assignments as fallback
    const { data: assignments } = await supabase
      .from("creator_assignments")
      .select("creator_id")
      .eq("employee_id", employee.id);

    const permCreatorIds = (permissions || []).map((p) => p.creator_id);
    const assignCreatorIds = (assignments || []).map((a) => a.creator_id);
    const creatorIds = [...new Set([...permCreatorIds, ...assignCreatorIds])];

    if (creatorIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: creatorsData } = await supabase
      .from("creators")
      .select("id, name, alias, avatar_url, avatar_seed, platform, followers, status, online_status, email, phone, persona, onlyfans_url, instagram_url, twitter_url, tiktok_url, snapchat_url")
      .in("id", creatorIds);

    if (creatorsData) {
      setCreators(creatorsData);
      if (creatorsData.length > 0) {
        setSelectedCreatorId(creatorsData[0].id);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAssignedCreators();
  }, [fetchAssignedCreators]);

  const selectedCreator = creators.find((c) => c.id === selectedCreatorId);

  const isChatter = employeeRole === "Chatter";
  const isVA = employeeRole === "VA" || employeeRole === "Virtual Assistant";

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  if (creators.length === 0) {
    return (
      <EmployeeLayout>
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Creators Assigned</h2>
          <p className="text-muted-foreground">You don't have any creators assigned to you yet.</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Creator Hub</h1>
          <p className="text-sm text-muted-foreground">View your assigned creators' information</p>
        </div>

        {/* Creator selector */}
        {creators.length > 1 && (
          <Select value={selectedCreatorId || ""} onValueChange={setSelectedCreatorId}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a creator" />
            </SelectTrigger>
            <SelectContent>
              {creators.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    {c.name} {c.alias ? `(@${c.alias})` : ""}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedCreator && (
          <div className="space-y-6">
            {/* Tabs based on role */}
            <Tabs defaultValue="model-info" className="w-full">
              <TabsList className="w-full flex overflow-x-auto">
                <TabsTrigger value="model-info" className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Model Info</span>
                </TabsTrigger>

                {/* Content Vault: both Chatter and VA */}
                <TabsTrigger value="content-vault" className="flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Content Vault</span>
                </TabsTrigger>

                {/* Chatter-only: Custom Requests */}
                {isChatter && (
                  <TabsTrigger value="custom-requests" className="flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Custom Requests</span>
                  </TabsTrigger>
                )}

                {/* VA-only: Content Plans */}
                {isVA && (
                  <TabsTrigger value="content-plans" className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">Content Plans</span>
                  </TabsTrigger>
                )}

                {/* VA-only: Marketing */}
                {isVA && (
                  <TabsTrigger value="marketing" className="flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Marketing</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="model-info">
                <CreatorModelInfo creator={selectedCreator} />
              </TabsContent>

              <TabsContent value="content-vault">
                <CreatorContentVault creatorId={selectedCreator.id} />
              </TabsContent>

              {isChatter && (
                <TabsContent value="custom-requests">
                  <CreatorCustomRequests creatorId={selectedCreator.id} />
                </TabsContent>
              )}

              {isVA && (
                <TabsContent value="content-plans">
                  <CreatorContentPlans creatorId={selectedCreator.id} />
                </TabsContent>
              )}

              {isVA && (
                <TabsContent value="marketing">
                  <CreatorMarketing creatorId={selectedCreator.id} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

/** Read-only model info card */
function CreatorModelInfo({ creator }: { creator: AssignedCreator }) {
  const avatarSrc = creator.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`;

  const socialLinks = [
    { label: "OnlyFans", url: creator.onlyfans_url, icon: Globe },
    { label: "Instagram", url: creator.instagram_url, icon: Globe },
    { label: "Twitter/X", url: creator.twitter_url, icon: Globe },
    { label: "TikTok", url: creator.tiktok_url, icon: Globe },
    { label: "Snapchat", url: creator.snapchat_url, icon: Globe },
  ].filter((l) => l.url);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 ring-4 ring-primary/20">
          <AvatarImage src={avatarSrc} className="object-cover" />
          <AvatarFallback className="bg-primary/20 text-primary text-2xl">
            {creator.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{creator.name}</h2>
          {creator.alias && <p className="text-muted-foreground">@{creator.alias}</p>}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={creator.status === "Active" ? "default" : "secondary"}>
              {creator.status}
            </Badge>
            <span className={cn("text-sm", creator.online_status ? "text-success" : "text-muted-foreground")}>
              {creator.online_status ? "● Online" : "○ Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="font-semibold text-foreground">{creator.platform || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="font-semibold text-foreground">{creator.followers || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact info */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{creator.email}</span>
          </div>
          {creator.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{creator.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Persona */}
      {creator.persona && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Creator Persona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{creator.persona}</p>
          </CardContent>
        </Card>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
