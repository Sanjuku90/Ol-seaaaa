import { useAuth } from "@/hooks/use-auth";
import { useContracts, useStats, useTransactions } from "@/hooks/use-platform";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Cpu, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Mock chart data - in real app, derive from transaction history
const chartData = [
  { name: 'Mon', profit: 120 },
  { name: 'Tue', profit: 132 },
  { name: 'Wed', profit: 101 },
  { name: 'Thu', profit: 134 },
  { name: 'Fri', profit: 190 },
  { name: 'Sat', profit: 230 },
  { name: 'Sun', profit: 210 },
];

export default function Overview() {
  const { user } = useAuth();
  const { data: contracts } = useContracts();
  const { data: stats } = useStats();
  
  // Calculate total daily earnings from active contracts
  // Assuming 'contracts' returns a list with joined machine data
  const dailyEarnings = contracts?.reduce((acc, contract) => {
    if (contract.status === 'active') {
      // Logic would be more complex in backend, simplified here
      // Assume amount * dailyRate%
      const machineRate = 2.5; // Would come from contract.machine.dailyRate
      return acc + (Number(contract.amount) * (machineRate / 100));
    }
    return acc;
  }, 0) || 0;

  const activeContractsCount = contracts?.filter(c => c.status === 'active').length || 0;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Balance"
          value={`$${Number(user?.balance).toFixed(2)}`}
          icon={DollarSign}
          className="border-primary/20 bg-gradient-to-br from-card to-primary/5"
        />
        <StatCard
          title="Daily Earnings"
          value={`$${dailyEarnings.toFixed(2)}`}
          icon={TrendingUp}
          trend="+2.5% today"
        />
        <StatCard
          title="Active Machines"
          value={activeContractsCount}
          icon={Cpu}
        />
        <StatCard
          title="Total Power"
          value={`${stats?.totalPower || 0} TH/s`}
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle>Profit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle>Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts?.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Cpu className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contract.machineName}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${Number(contract.amount).toFixed(0)}</p>
                    <p className="text-xs text-emerald-400">Running</p>
                  </div>
                </div>
              ))}
              {(!contracts || contracts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No active contracts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
