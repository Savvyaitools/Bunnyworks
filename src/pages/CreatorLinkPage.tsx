import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface LinkPage {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
}

interface PageLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  position: number;
}

export default function CreatorLinkPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LinkPage | null>(null);
  const [links, setLinks] = useState<PageLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: pageData } = await supabase
        .from("creator_link_pages")
        .select("id, display_name, bio, avatar_url, background_color, text_color, accent_color")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!pageData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPage(pageData);

      const { data: linksData } = await supabase
        .from("creator_page_links")
        .select("id, title, url, icon, position")
        .eq("page_id", pageData.id)
        .eq("is_active", true)
        .order("position", { ascending: true });

      setLinks(linksData || []);
      setLoading(false);
    })();
  }, [slug]);

  const trackClick = async (link: PageLink) => {
    if (!page) return;
    // Fire and forget
    supabase.from("link_click_events").insert({
      link_id: link.id,
      page_id: page.id,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null,
    }).then(() => {});

    // Also increment counter via raw rpc call (type will auto-sync)
    (supabase.rpc as any)("increment_link_click", { link_id_param: link.id }).then(() => {});

    window.open(link.url, "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-white/60">This link page doesn't exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: page.background_color, color: page.text_color }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Avatar + Name */}
        <div className="text-center space-y-3">
          {page.avatar_url && (
            <img
              src={page.avatar_url}
              alt={page.display_name}
              className="w-24 h-24 rounded-full mx-auto object-cover border-2"
              style={{ borderColor: page.accent_color }}
            />
          )}
          <h1 className="text-2xl font-bold">{page.display_name}</h1>
          {page.bio && <p className="text-sm opacity-70 max-w-xs mx-auto">{page.bio}</p>}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => trackClick(link)}
              className="w-full py-3.5 px-5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between gap-3"
              style={{
                backgroundColor: `${page.accent_color}15`,
                border: `1px solid ${page.accent_color}40`,
                color: page.text_color,
              }}
            >
              <span className="truncate">{link.title}</span>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs opacity-30 pt-8">Powered by CreatorSS</p>
      </div>
    </div>
  );
}
