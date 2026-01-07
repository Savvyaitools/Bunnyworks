import { useEffect, useRef, useState, useCallback } from "react";
import Hyperbeam from "@hyperbeam/web";
import { Loader2, Maximize2, Minimize2, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HyperbeamInstance = Awaited<ReturnType<typeof Hyperbeam>>;

interface EmbeddedBrowserProps {
  embedUrl: string;
  onReady?: (hb: HyperbeamInstance) => void;
  onDisconnect?: () => void;
  className?: string;
  showControls?: boolean;
}

export function EmbeddedBrowser({
  embedUrl,
  onReady,
  onDisconnect,
  className,
  showControls = true,
}: EmbeddedBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hyperbeamRef = useRef<HyperbeamInstance | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initHyperbeam = useCallback(async () => {
    if (!containerRef.current || !embedUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // Cleanup previous instance if exists
      if (hyperbeamRef.current) {
        hyperbeamRef.current.destroy();
        hyperbeamRef.current = null;
      }

      // Clear container
      containerRef.current.innerHTML = "";

      const hb = await Hyperbeam(containerRef.current, embedUrl, {
        timeout: 30000,
        frameCb: () => {
          setIsLoading(false);
        },
      });

      hyperbeamRef.current = hb;
      onReady?.(hb);
    } catch (err: any) {
      console.error("Hyperbeam initialization error:", err);
      setError(err.message || "Failed to connect to browser session");
      setIsLoading(false);
    }
  }, [embedUrl, onReady]);

  useEffect(() => {
    initHyperbeam();

    return () => {
      if (hyperbeamRef.current) {
        hyperbeamRef.current.destroy();
        hyperbeamRef.current = null;
        onDisconnect?.();
      }
    };
  }, [initHyperbeam, onDisconnect]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (!hyperbeamRef.current) return;
    
    const newMutedState = !isMuted;
    hyperbeamRef.current.volume = newMutedState ? 0 : 1;
    setIsMuted(newMutedState);
  }, [isMuted]);

  const handleRefresh = useCallback(() => {
    initHyperbeam();
  }, [initHyperbeam]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8",
        className
      )}>
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col", className)}>
      {/* Controls Bar */}
      {showControls && (
        <div className="flex items-center justify-between gap-2 rounded-t-lg border border-b-0 border-border bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isLoading ? "bg-amber-500 animate-pulse" : "bg-green-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {isLoading ? "Connecting..." : "Connected"}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleMuteToggle}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Browser Container */}
      <div className="relative flex-1 overflow-hidden rounded-b-lg border border-border bg-black">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading browser session...</p>
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{ minHeight: "400px" }}
        />
      </div>
    </div>
  );
}
