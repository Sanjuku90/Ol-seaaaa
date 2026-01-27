import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  ShieldCheck,
  Loader2,
  Plus
} from "lucide-react";
import { type Contract, type Machine, type User } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import CountUp from 'react-countup';
import { motion } from 'framer-motion';

export default function Overview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [increaseAmount, setIncreaseAmount] = useState("");
  const [selectedContractForIncrease, setSelectedContractForIncrease] = useState<Contract | null>(null);

  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/user"],
    refetchInterval: 5000 
  });
  const { data: contracts } = useQuery<Contract[]>({ 
    queryKey: ["/api/contracts"],
    refetchInterval: 5000
  });

  const increaseMutation = useMutation({
    mutationFn: async ({ contractId, amount }: { contractId: number, amount: number }) => {
      const res = await apiRequest("POST", `/api/contracts/${contractId}/increase`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setSelectedContractForIncrease(null);
      setIncreaseAmount("");
      toast({
        title: "Succès",
        description: "Votre investissement a été augmenté."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const res = await apiRequest("POST", `/api/contracts/${contractId}/resume`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Succès",
        description: "Votre contrat a été réactivé."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const { data: machines } = useQuery<Machine[]>({ queryKey: ["/api/machines"] });

  const [realtimeAccumulated, setRealtimeAccumulated] = useState<Record<number, number>>({});

  useEffect(() => {
    if (contracts) {
      const initial: Record<number, number> = {};
      contracts.forEach(c => {
        initial[c.id] = Number(c.accumulatedRewards || 0);
      });
      setRealtimeAccumulated(initial);
    }
  }, [contracts]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected successfully for real-time updates");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "PROFIT_GENERATED") {
          if (data.payload.contractId) {
            setRealtimeAccumulated(prev => ({
              ...prev,
              [data.payload.contractId]: Number(data.payload.accumulated)
            }));
          }
        } else if (data.type === "BALANCE_UPDATE" || data.type === "TRANSACTION_UPDATE") {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Fallback refetch interval just in case
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    }, 10000);

    return () => {
      socket.close();
      clearInterval(interval);
    };
  }, [queryClient]);

  const activeContracts = contracts?.filter(c => c.status === "active" || c.status === "suspended") || [];
  
  const totalBalance = Number(user?.balance || 0);
  const totalAccumulated = Object.values(realtimeAccumulated).reduce((acc, val) => acc + val, 0) || contracts?.reduce((acc, c) => acc + Number(c.accumulatedRewards || 0), 0) || 0;
  
  const getMachine = (id: number) => machines?.find(m => m.id === id);

  const renderContract = (contract: Contract) => {
    const machine = getMachine(contract.machineId);
    if (!machine) return null;

    const accumulated = realtimeAccumulated[contract.id] ?? Number(contract.accumulatedRewards || 0);
    const minDep = machine.type === "rent" ? Number(machine.minDeposit || 30) : 1; // Dummy min for Buy machines progress
    const progress = machine.type === "rent" 
      ? Math.min(100, (accumulated / minDep) * 100)
      : null; // Buy machines don't have a "maturity" progress usually, or we can show ROI progress

    return (
      <Card key={contract.id} className={`border-white/5 bg-white/[0.02] ${contract.status === "suspended" ? "opacity-75" : ""}`}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${contract.status === "suspended" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
                {machine.type === "rent" ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold">{machine.name}</h3>
                <p className="text-xs text-muted-foreground">ID: #{contract.id}</p>
              </div>
            </div>
            <Badge variant={contract.status === "active" ? "default" : "secondary"} className={contract.status === "suspended" ? "bg-amber-500 text-white" : ""}>
              {contract.status === "active" ? "Actif" : contract.status === "suspended" ? "Suspendu" : "Expiré"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Investissement</p>
              <div className="flex items-center gap-2">
                <p className="font-bold">${Number(contract.amount).toFixed(2)}</p>
                {contract.status === "active" && machine.type === "rent" && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full hover:bg-primary/20 text-primary"
                    onClick={() => setSelectedContractForIncrease(contract)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Rendement/jour</p>
              <p className="font-bold text-emerald-400">{machine.dailyRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Gains cumulés</p>
              <p className="font-bold text-emerald-400">
                $<CountUp end={accumulated} decimals={8} duration={1} preserveValue={true} />
              </p>
            </div>
          </div>

          {contract.status === "suspended" ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-amber-500 font-medium">Action requise : Solde insuffisant pour les frais.</p>
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs" 
                size="sm"
                onClick={() => resumeMutation.mutate(contract.id)}
                disabled={resumeMutation.isPending}
              >
                {resumeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Recharger & Relancer"}
              </Button>
            </div>
          ) : (
            machine.type === "rent" && progress !== null && (
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
            )
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-white/5 bg-white/[0.02] hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">
                $<CountUp end={totalBalance} decimals={8} duration={1} preserveValue={true} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Prêt pour investissement
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-white/5 bg-white/[0.02] hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-emerald-400">
                $<CountUp end={totalAccumulated} decimals={8} duration={1} preserveValue={true} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gains totaux générés
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-white/5 bg-white/[0.02] hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affiliés Actifs</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">
                <CountUp end={user?.activeReferrals || 0} duration={2} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Récompenses: $12.50
              </p>
            </CardContent>
          </Card>
        </motion.div>
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

      <Dialog open={!!selectedContractForIncrease} onOpenChange={(open) => !open && setSelectedContractForIncrease(null)}>
        <DialogContent className="border-white/10 bg-[#0a0a0b] text-white">
          <DialogHeader>
            <DialogTitle>Augmenter l'investissement</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ajoutez des fonds à votre machine active pour augmenter vos gains journaliers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant à ajouter ($)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 50"
                value={increaseAmount}
                onChange={(e) => setIncreaseAmount(e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <p className="text-[10px] text-muted-foreground">
                Votre solde actuel: ${Number(user?.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedContractForIncrease(null)}
              className="border-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedContractForIncrease && increaseAmount) {
                  increaseMutation.mutate({
                    contractId: selectedContractForIncrease.id,
                    amount: Number(increaseAmount)
                  });
                }
              }}
              disabled={increaseMutation.isPending || !increaseAmount}
              className="bg-primary text-primary-foreground"
            >
              {increaseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}