import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FlaskConical, Rocket, Globe, ShieldCheck, Cookie, X, Loader2, ExternalLink,
} from "lucide-react";

interface SteelSession {
  sessionId: string;
  status: string;
  sessionViewerUrl: string;
  cdpWsUrl: string;
}

export function SteelTestPanel() {
  const [session, setSession] = useState<SteelSession | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const invoke = async (action: string, params: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("steel-session", {
      body: { action, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleCreate = async (useProxy = false) => {
    setLoading("create");
    try {
      log(`Creating Steel.dev session (proxy=${useProxy})...`);
      const data = await invoke("create_session", { useProxy });
      setSession(data);
      log(`✅ Session created: ${data.sessionId} (status: ${data.status})`);
      log(`Viewer URL: ${data.sessionViewerUrl ? "available" : "not available"}`);
      toast.success("Steel session created");
    } catch (err: any) {
      log(`❌ Create failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleNavigate = async () => {
    if (!session) return;
    setLoading("navigate");
    try {
      log("Navigating to OnlyFans...");
      const data = await invoke("cdp_navigate", {
        sessionId: session.sessionId,
        url: "https://onlyfans.com",
      });
      log(`✅ Navigation: success=${data.success}${data.error ? `, error=${data.error}` : ""}`);
      toast.success("Navigation complete");
    } catch (err: any) {
      log(`❌ Navigate failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleCheckLogin = async () => {
    if (!session) return;
    setLoading("login");
    try {
      log("Checking login state via CDP...");
      const data = await invoke("check_login", { sessionId: session.sessionId });
      log(`✅ Login state: ${data.loginState} | URL: ${data.pageUrl} | Title: ${data.pageTitle}`);
      toast.info(`Login state: ${data.loginState}`);
    } catch (err: any) {
      log(`❌ Login check failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleGetCookies = async () => {
    if (!session) return;
    setLoading("cookies");
    try {
      log("Checking cookies via CDP...");
      const data = await invoke("get_cookies", { sessionId: session.sessionId });
      log(`✅ Cookies: hasCookies=${data.hasCookies}, length=${data.cookieLength}`);
      toast.info(`Cookies present: ${data.hasCookies}`);
    } catch (err: any) {
      log(`❌ Cookie check failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleRelease = async () => {
    if (!session) return;
    setLoading("release");
    try {
      log("Releasing session...");
      await invoke("release", { sessionId: session.sessionId });
      log("✅ Session released");
      setSession(null);
      toast.success("Session released");
    } catch (err: any) {
      log(`❌ Release failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleCheckStatus = async () => {
    if (!session) return;
    setLoading("status");
    try {
      const data = await invoke("check_status", { sessionId: session.sessionId });
      log(`✅ Status: ${data.status} | isAlive: ${data.isAlive}`);
      toast.info(`Session status: ${data.status}`);
    } catch (err: any) {
      log(`❌ Status check failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Steel.dev Test Panel</CardTitle>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
              Debug
            </Badge>
          </div>
          {session && (
            <Badge variant="secondary" className="text-xs">
              {session.sessionId.slice(0, 8)}...
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Side-by-side API test — no production data is affected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!session ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCreate(false)}
                disabled={!!loading}
                className="gap-1.5"
              >
                {loading === "create" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                Launch (No Proxy)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreate(true)}
                disabled={!!loading}
                className="gap-1.5"
              >
                {loading === "create" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                Launch (With Proxy)
              </Button>
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleCheckStatus} disabled={!!loading} className="gap-1.5">
                {loading === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                Status
              </Button>
              <Button size="sm" variant="outline" onClick={handleNavigate} disabled={!!loading} className="gap-1.5">
                {loading === "navigate" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                Navigate to OF
              </Button>
              <Button size="sm" variant="outline" onClick={handleCheckLogin} disabled={!!loading} className="gap-1.5">
                {loading === "login" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Check Login
              </Button>
              <Button size="sm" variant="outline" onClick={handleGetCookies} disabled={!!loading} className="gap-1.5">
                {loading === "cookies" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cookie className="h-3.5 w-3.5" />}
                Cookies
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRelease} disabled={!!loading} className="gap-1.5">
                {loading === "release" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Release
              </Button>
            </>
          )}
        </div>

        {/* Viewer URL */}
        {session?.sessionViewerUrl && (
          <div className="space-y-2">
            <a
              href={session.sessionViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Open Session Viewer
            </a>
            <div className="rounded-lg border overflow-hidden bg-background" style={{ height: 400 }}>
              <iframe
                src={session.sessionViewerUrl}
                className="w-full h-full border-0"
                allow="clipboard-read; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Test Log</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setLogs([])}>
                Clear
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md p-2 max-h-40 overflow-y-auto font-mono text-xs space-y-0.5">
              {logs.map((l, i) => (
                <div key={i} className={l.includes("❌") ? "text-destructive" : l.includes("✅") ? "text-green-500" : "text-muted-foreground"}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
