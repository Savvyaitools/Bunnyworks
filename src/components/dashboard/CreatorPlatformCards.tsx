import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { UserAvatar } from "@/components/shared";
import { Link } from "react-router-dom";

interface CreatorPlatformCardData {
  id: string;
  name: string;
  alias: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
  status: string;
  onlyfans_url: string | null;
  revenue: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function CreatorPlatformCards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data: creators = [] } = useQuery({
    queryKey: ["creator-platform-cards", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creators")
        .select("id, name, alias, avatar_url, avatar_seed, status, onlyfans_url, revenue")
        .eq("agency_id", agencyId!)
        .eq("status", "Active")
        .order("revenue", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as CreatorPlatformCardData[];
    },
  });

  // Generate mock trend for demo
  const getTrend = (index: number) => {
    const trends = [+10, -17, +5, +22, -3];
    return trends[index % trends.length];
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Creator Accounts</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {creators.map((creator, index) => {
          const trend = getTrend(index);
          const isPositive = trend >= 0;
          return (
            <motion.div key={creator.id} variants={cardVariants}>
              <Link to={`/creators/${creator.id}`}>
                <div className="glass-card p-4 flex flex-col items-center text-center group hover:border-primary/40 transition-all duration-300 cursor-pointer">
                  {/* Platform indicator dot */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all">
                      <UserAvatar 
                        name={creator.name} 
                        avatarSeed={creator.avatar_seed}
                      />
                    </div>
                    {/* Online indicator */}
                    {creator.onlyfans_url && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                        <span className="text-[8px] font-bold text-primary-foreground">OF</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p className="text-sm font-medium text-foreground truncate w-full">
                    {creator.alias || creator.name}
                  </p>

                  {/* Trend badge */}
                  <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold mt-2 ${
                    isPositive 
                      ? "bg-success/20 text-success border border-success/30" 
                      : "bg-destructive/20 text-destructive border border-destructive/30"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {isPositive ? "+" : ""}{trend}%
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {/* Add platform card */}
        <motion.div variants={cardVariants}>
          <Link to="/creators">
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-all duration-300 cursor-pointer min-h-[140px]">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Add Creator</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
