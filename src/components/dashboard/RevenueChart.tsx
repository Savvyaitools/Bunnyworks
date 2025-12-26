import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const data = [
  { month: "Jan", agency: 32000, creator: 48000 },
  { month: "Feb", agency: 35000, creator: 52000 },
  { month: "Mar", agency: 38000, creator: 55000 },
  { month: "Apr", agency: 42000, creator: 58000 },
  { month: "May", agency: 48000, creator: 62000 },
  { month: "Jun", agency: 52000, creator: 68000 },
  { month: "Jul", agency: 58000, creator: 72000 },
  { month: "Aug", agency: 62000, creator: 78000 },
  { month: "Sep", agency: 68000, creator: 85000 },
  { month: "Oct", agency: 72000, creator: 92000 },
  { month: "Nov", agency: 74526, creator: 98000 },
  { month: "Dec", agency: 78000, creator: 105000 },
];

export function RevenueChart() {
  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Agency vs Creator earnings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Agency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Creator</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAgency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(330, 85%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(330, 85%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCreator" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(180, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(240, 8%, 12%)', 
                border: '1px solid hsl(240, 6%, 18%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
              labelStyle={{ color: 'hsl(0, 0%, 95%)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Area
              type="monotone"
              dataKey="creator"
              stroke="hsl(180, 70%, 50%)"
              strokeWidth={2}
              fill="url(#colorCreator)"
            />
            <Area
              type="monotone"
              dataKey="agency"
              stroke="hsl(330, 85%, 60%)"
              strokeWidth={2}
              fill="url(#colorAgency)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
