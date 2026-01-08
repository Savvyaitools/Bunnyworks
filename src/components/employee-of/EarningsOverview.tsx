import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlyFansAPI } from "@/hooks/useOnlyFansAPI";
import { DollarSign, Gift, CreditCard, MessageSquare, FileText, Users } from "lucide-react";

interface EarningStatistics {
  total: number;
  tips: number;
  subscriptions: number;
  messages: number;
  posts: number;
  referrals: number;
}

interface EarningsOverviewProps {
  accountId: string;
}

export function EarningsOverview({ accountId }: EarningsOverviewProps) {
  const { getEarnings, loading } = useOnlyFansAPI();
  const [earnings, setEarnings] = useState<EarningStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      setIsLoading(true);
      const result = await getEarnings(accountId);
      if (result) {
        setEarnings(result);
      }
      setIsLoading(false);
    };

    fetchEarnings();
  }, [accountId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!earnings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Unable to load earnings data
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Earnings",
      value: formatCurrency(earnings.total),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Subscriptions",
      value: formatCurrency(earnings.subscriptions),
      icon: CreditCard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Tips",
      value: formatCurrency(earnings.tips),
      icon: Gift,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Messages",
      value: formatCurrency(earnings.messages),
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Posts",
      value: formatCurrency(earnings.posts),
      icon: FileText,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Referrals",
      value: formatCurrency(earnings.referrals),
      icon: Users,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
