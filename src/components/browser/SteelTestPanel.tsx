import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FlaskConical, Rocket, Globe, ShieldCheck, Cookie, X, Loader2, ExternalLink,
  Activity, Terminal, ChevronDown, ChevronUp,
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
  const [logsExpanded, setLogsExpanded] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current && logsExpanded) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, logsExpanded]);

  const log = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const invoke = async (action: string, params: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("steel-session", {
      body: { action, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleCreate = async (withPaidFeatures = false) => {
    setLoading("create");
    try {
      log(`Creating session (proxy=${withPaidFeatures}, captcha=${withPaidFeatures})…`);
      const data = await invoke("create_session", {
        useProxy: withPaidFeatures,
        solveCaptcha: withPaidFeatures,
      });
      setSession(data);
      log(`✅ Session ${data.sessionId.slice(0, 8)} created (status: ${data.status})`);
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
      log("Navigating to OnlyFans…");
      const data = await invoke("cdp_navigate", {
        sessionId: session.sessionId,
        url: "https://onlyfans.com",
      });
      log(`✅ Navigation complete (success=${data.success})`);
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
      log("Checking login state…");
      const data = await invoke("check_login", { sessionId: session.sessionId });
      log(`✅ Login: ${data.loginState} | ${data.pageTitle}`);
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
      log("Reading cookies…");
      const data = await invoke("get_cookies", { sessionId: session.sessionId });
      log(`✅ Cookies: ${data.cookieLength} found`);
      toast.info(`Cookies: ${data.cookieLength}`);
    } catch (err: any) {
      log(`❌ Cookie check failed: ${err.message}`);
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
      log(`✅ Status: ${data.status} | alive: ${data.isAlive}`);
      toast.info(`Status: ${data.status}`);
    } catch (err: any) {
      log(`❌ Status check failed: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleRelease = async () => {
    if (!session) return;
    setLoading("release");
    try {
      log("Releasing session…");
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

  const ActionButton = ({
    onClick,
    loadingKey,
    icon: Icon,
    label,
    variant = "outline",
  }: {
    onClick: () => void;
    loadingKey: string;
    icon: any;
    label: string;
    variant?: "outline" | "destructive" | "default";
  }) => (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={!!loading}
      className="gap-1.5 h-8 text-xs"
    >
      {loading === loadingKey ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );

  return (
    <Card className="border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Steel.dev Test Panel</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">
            Debug
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {session && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {session.sessionId.slice(0, 8)}
                </span>
              </div>
              {session.sessionViewerUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5 text-primary"
                  asChild
                >
                  <a href={session.sessionViewerUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    Live Viewer
                  </a>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!session ? (
            <>
              <Button
                size="sm"
                onClick={() => handleCreate(false)}
                disabled={!!loading}
                className="gap-1.5 h-8"
              >
                {loading === "create" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5" />
                )}
                Launch Session
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreate(true)}
                disabled={!!loading}
                className="gap-1.5 h-8"
              >
                {loading === "create" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5" />
                )}
                Launch + Proxy & Captcha
              </Button>
            </>
          ) : (
            <>
              <ActionButton onClick={handleCheckStatus} loadingKey="status" icon={Activity} label="Status" />
              <ActionButton onClick={handleNavigate} loadingKey="navigate" icon={Globe} label="Navigate to OF" />
              <ActionButton onClick={handleCheckLogin} loadingKey="login" icon={ShieldCheck} label="Check Login" />
              <ActionButton onClick={handleGetCookies} loadingKey="cookies" icon={Cookie} label="Cookies" />
              <ActionButton onClick={handleRelease} loadingKey="release" icon={X} label="Release" variant="destructive" />
            </>
          )}
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
            <button
              onClick={() => setLogsExpanded(!logsExpanded)}
              className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Log ({logs.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogs([]);
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground px-1"
                >
                  Clear
                </button>
                {logsExpanded ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </button>
            {logsExpanded && (
              <div className="px-3 pb-2 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-px">
                {logs.map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.includes("❌")
                        ? "text-destructive"
                        : l.includes("✅")
                        ? "text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {l}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!session && logs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Launch a Steel.dev session to test CDP navigation, login detection, and cookies. Opens in a new tab for full interaction.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
