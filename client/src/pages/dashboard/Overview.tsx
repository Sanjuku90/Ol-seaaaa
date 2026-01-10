import { useAuth } from "@/hooks/use-auth";
import { useContracts, useStats, useTransactions } from "@/hooks/use-platform";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Cpu, TrendingUp, Activity, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CountUp from "react-countup";
import { api } from "@shared/routes";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Données de performance croissante
const chartData = [
  { name: 'Lun', profit: 120 },
  { name: 'Mar', profit: 155 },
  { name: 'Mer', profit: 198 },
  { name: 'Jeu', profit: 245 },
  { name: 'Ven', profit: 310 },
  { name: 'Sam', profit: 380 },
  { name: 'Dim', profit: 450 },
];

const livePayments = [
  { user: "User***78", amount: 45, time: "Il y a 2 min" },
  { user: "Crypto***92", amount: 120, time: "Il y a 5 min" },
  { user: "Block***14", amount: 25, time: "Il y a 8 min" },
];

export default function Overview() {
  const { user } = useAuth();
  const { data: contracts } = useContracts();
  const { data: stats } = useStats();
  
  const dailyEarnings = contracts?.reduce((acc, contract) => {
    if (contract.status === 'active') {
      const machineRate = 2.5; 
      return acc + (Number(contract.amount) * (machineRate / 100));
    }
    return acc;
  }, 0) || 0;

  const activeContractsCount = contracts?.filter(c => c.status === 'active').length || 0;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Ravi de vous revoir, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Solde Total"
          value={`$${Number(user?.balance).toFixed(2)}`}
          icon={DollarSign}
          className="border-primary/20 bg-gradient-to-br from-card to-primary/5"
        />
        <StatCard
          title="Gains du jour"
          value={`$${dailyEarnings.toFixed(2)}`}
          icon={TrendingUp}
          trend="+5.2% aujourd'hui"
        />
        <StatCard
          title="Grade Affiliation"
          value={user?.affiliationGrade || "Bronze"}
          icon={Activity}
          className="border-emerald-500/20"
        />
        <StatCard
          title="Filleuls Actifs"
          value={user?.activeReferrals || 0}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle>Historique de Profit</CardTitle>
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
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} itemStyle={{ color: '#10b981' }} />
                  <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-white/5 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Paiements en live
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {livePayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{p.user}</span>
                      <p className="text-xs text-muted-foreground">{p.time}</p>
                    </div>
                    <span className="text-emerald-400 font-bold">+${p.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/50">
            <CardHeader>
              <CardTitle>Contrats Actifs</CardTitle>
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
                        <p className="text-sm font-medium">{(contract as any).machineName || (contract as any).machine?.name}</p>
                        <p className="text-xs text-muted-foreground">Actif</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${Number(contract.amount).toFixed(0)}</p>
                      <p className="text-xs text-emerald-400">En cours</p>
                    </div>
                  </div>
                ))}
                {(!contracts || contracts.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun contrat actif</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
