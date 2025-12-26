import { DollarSign, TrendingUp, Users, CheckSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { MetricCard, RevenueChart, ActivityFeed } from "@/components/dashboard";

const metrics = [
  {
    title: "Total Revenue",
    value: "$248,420",
    change: "12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Agency Earnings",
    value: "$74,526",
    change: "8.2%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Active Creators",
    value: "24",
    change: "4%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Tasks Completed",
    value: "156",
    change: "2.3%",
    changeType: "negative" as const,
    icon: CheckSquare,
  },
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Agency Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your agency performance
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.title}
              {...metric}
              delay={index * 100}
            />
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
