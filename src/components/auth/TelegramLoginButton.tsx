import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

export function TelegramLoginButton({ botName }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

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
        toast.success("Welcome!");
      } catch (err) {
        console.error("Telegram auth error:", err);
        toast.error(
          err instanceof Error ? err.message : "Telegram login failed"
        );
      } finally {
        setLoading(false);
      }
    };

    // Load Telegram widget script
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botName);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "8");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.async = true;
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botName]);

  if (loading) {
    return (
      <Button variant="outline" className="w-full h-12 text-base gap-3" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
        Verifying with Telegram...
      </Button>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
