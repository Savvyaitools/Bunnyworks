import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
}

const PRODUCTION_DOMAIN = "bunnyworks.io";

export function TelegramLoginButton({ botName }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [widgetError, setWidgetError] = useState(false);

  const isProduction = window.location.hostname === PRODUCTION_DOMAIN || window.location.hostname === `www.${PRODUCTION_DOMAIN}`;

  useEffect(() => {
    // Expose callback globally
    (window as any).onTelegramAuth = async (user: TelegramUser) => {
      setLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/telegram-auth`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          }
        );

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed");
        }

        const { error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (error) throw error;

        if (data.is_new_user) {
          toast.success("Welcome! Join our community on Telegram.");
          // Open Telegram group in a new tab for new users
          setTimeout(() => {
            window.open("https://t.me/BunnyWorksOFM", "_blank");
          }, 800);
        } else {
          toast.success("Welcome back!");
        }
      } catch (err) {
        console.error("Telegram auth error:", err);
        toast.error(
          err instanceof Error ? err.message : "Telegram login failed"
        );
      } finally {
        setLoading(false);
      }
    };

    // Only load the widget on the production domain
    if (containerRef.current && isProduction) {
      containerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botName);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "8");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.async = true;
      script.onerror = () => setWidgetError(true);
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botName, isProduction]);

  if (loading) {
    return (
      <Button variant="outline" className="w-full h-12 text-base gap-3" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
        Verifying with Telegram...
      </Button>
    );
  }

  // Show a styled button in preview/non-production environments
  if (!isProduction || widgetError) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base gap-3"
        disabled={!isProduction}
        onClick={() => {
          if (!isProduction) {
            toast.info("Telegram login only works on the published site (bunnyworks.io)");
          }
        }}
      >
        <Send className="h-5 w-5 text-[#2AABEE]" />
        {isProduction ? "Login with Telegram" : "Telegram Login (available on published site)"}
      </Button>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
