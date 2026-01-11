import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  Zap,
  ShieldCheck
} from "lucide-react";
import { type Contract, type Machine, type User } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Overview() {
  const { data: user, refetch: refetchUser } = useQuery<User>({ 
    queryKey: ["/api/user"],
    refetchInterval: 5000 
  });
  const { data: contracts, refetch: refetchContracts } = useQuery<Contract[]>({ 
    queryKey: ["/api/contracts"],
    refetchInterval: 5000
  });
  const { data: machines } = useQuery<Machine[]>({ queryKey: ["/api/machines"] });

  const activeContracts = contracts?.filter(c => c.status === "active") || [];
  
  const getMachine = (id: number) => machines?.find(m => m.id === id);

  const renderContract = (contract: Contract) => {
    const machine = getMachine(contract.machineId);
    if (!machine) return null;

    const accumulated = Number(contract.accumulatedRewards || 0);
    const minDep = Number(machine.minDeposit || 30);
    const progress = machine.type === "rent" 
      ? Math.min(100, (accumulated / minDep) * 100)
      : null;

    return (
      <Card key={contract.id} className="border-white/5 bg-white/[0.02]">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {machine.type === "rent" ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold">{machine.name}</h3>
                <p className="text-xs text-muted-foreground">ID: #{contract.id}</p>
              </div>
            </div>
            <Badge variant={contract.status === "active" ? "default" : "secondary"}>
              {contract.status === "active" ? "Actif" : "Suspendu"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Rendement/jour</p>
              <p className="font-bold text-emerald-400">{machine.dailyRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gains cumulés</p>
              <p className="font-bold">${accumulated.toFixed(4)}</p>
            </div>
          </div>

          {machine.type === "rent" && progress !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Maturité du retrait (Min ${minDep})</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">
                {progress >= 100 ? "Frais de retrait : 4%" : "Frais de retrait : 19%"}
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(contract.startDate!), "dd/MM/yyyy")}
            </div>
            <span>Frais mensuels: $3.00</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Tableau de Bord</h1>
          <p className="text-muted-foreground">Suivez vos performances de minage en temps réel.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary py-1 px-3">
            Grade: {user?.affiliationGrade || "Bronze"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-white/5 bg-white/[0.02] hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">${Number(user?.balance || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Prêt pour investissement
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02] hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus 24h</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-emerald-400">+$24.15</div>
            <p className="text-xs text-muted-foreground mt-1">
              +5.2% vs hier
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02] hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliés Actifs</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{user?.activeReferrals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Récompenses: $12.50
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02] hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">État Système</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">En Ligne</div>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime: 99.99%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rent" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Mes Machines</h2>
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="rent">Louées</TabsTrigger>
            <TabsTrigger value="buy">Achetées</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeContracts.filter(c => getMachine(c.machineId)?.type === "rent").length > 0 ? (
              activeContracts.filter(c => getMachine(c.machineId)?.type === "rent").map(renderContract)
            ) : (
              <Card className="col-span-full py-12 border-dashed border-white/10 bg-transparent text-center">
                <p className="text-muted-foreground mb-4">Vous n'avez pas de machines louées.</p>
                <Link href="/dashboard/machines">
                  <Button variant="outline" size="sm">Voir le catalogue</Button>
                </Link>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="buy">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeContracts.filter(c => getMachine(c.machineId)?.type === "buy").length > 0 ? (
              activeContracts.filter(c => getMachine(c.machineId)?.type === "buy").map(renderContract)
            ) : (
              <Card className="col-span-full py-12 border-dashed border-white/10 bg-transparent text-center">
                <p className="text-muted-foreground mb-4">Vous n'avez pas de machines achetées.</p>
                <Link href="/dashboard/machines">
                  <Button variant="outline" size="sm">Voir le catalogue</Button>
                </Link>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}