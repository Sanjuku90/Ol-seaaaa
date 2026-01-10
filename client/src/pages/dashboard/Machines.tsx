import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Loader2, ShieldCheck } from "lucide-react";
import { type Machine } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Machines() {
  const { toast } = useToast();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [amount, setAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [calcAmount, setCalcAmount] = useState("100");

  const calculateProfit = (machine: Machine, amount: number) => {
    const daily = (amount * Number(machine.dailyRate)) / 100;
    const weekly = daily * 7;
    const monthly = daily * 30;
    return { daily, weekly, monthly };
  };

  const { data: machines, isLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"]
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: { machineId: number; amount: number; autoReinvest: boolean }) => {
      const res = await apiRequest("POST", "/api/contracts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsOpen(false);
      setAmount("");
      toast({
        title: "Succès",
        description: "Votre contrat de minage a été activé."
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

  const openPurchaseDialog = (machine: Machine) => {
    setSelectedMachine(machine);
    setAmount(machine.type === "rent" ? machine.minDeposit.toString() : "0");
    setIsOpen(true);
  };

  const handlePurchase = () => {
    if (!selectedMachine) return;
    purchaseMutation.mutate({
      machineId: selectedMachine.id,
      amount: Number(amount),
      autoReinvest: false
    });
  };

  const renderMachineCard = (machine: Machine) => {
    const profits = calculateProfit(machine, Number(calcAmount) || 0);
    return (
      <Card key={machine.id} className="overflow-hidden border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-xl font-display">{machine.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{machine.description}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {machine.type === "rent" ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold font-display text-primary">
            {machine.type === "rent" ? (
              <>${machine.rentalPrice}<span className="text-sm text-muted-foreground font-sans font-normal ml-1">/ mois</span></>
            ) : (
              <>${machine.buyPrice}<span className="text-sm text-muted-foreground font-sans font-normal ml-1">unique</span></>
            )}
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Rendement</span>
              <span className="text-emerald-400 font-bold">{machine.dailyRate}% / jour</span>
            </div>
            {machine.type === "rent" && (
              <div className="flex justify-between">
                <span>Dépôt Min.</span>
                <span className="text-foreground">${machine.minDeposit}</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Estimation des gains</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background/50 p-2 rounded text-center">
                  <p className="text-[10px]">Jour</p>
                  <p className="font-bold text-emerald-400">${profits.daily.toFixed(2)}</p>
                </div>
                <div className="bg-background/50 p-2 rounded text-center">
                  <p className="text-[10px]">Semaine</p>
                  <p className="font-bold text-emerald-400">${profits.weekly.toFixed(2)}</p>
                </div>
                <div className="bg-background/50 p-2 rounded text-center">
                  <p className="text-[10px]">Mois</p>
                  <p className="font-bold text-emerald-400">${profits.monthly.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => openPurchaseDialog(machine)} disabled={purchaseMutation.isPending}>
            {machine.type === "rent" ? "Louer Maintenant" : "Acheter Maintenant"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Catalogue des Machines</h1>
          <p className="text-muted-foreground">Location flexible ou Achat permanent pour maximiser vos gains.</p>
        </div>
        <Card className="p-4 border-primary/20 bg-primary/5 min-w-[250px]">
          <Label className="text-xs uppercase tracking-wider text-primary mb-2 block">Simulateur de dépôt</Label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">$</span>
            <Input 
              type="number" 
              value={calcAmount} 
              onChange={(e) => setCalcAmount(e.target.value)}
              className="h-8 bg-background/50 border-white/10"
              placeholder="Montant"
            />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="rent" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="rent" className="px-8">Location (Rent)</TabsTrigger>
          <TabsTrigger value="buy" className="px-8">Achat (Buy)</TabsTrigger>
        </TabsList>

        <TabsContent value="rent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="h-[300px] animate-pulse bg-white/5 border-white/10" />
              ))
            ) : (
              machines?.filter(m => m.type === "rent").map(renderMachineCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="buy">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="h-[300px] animate-pulse bg-white/5 border-white/10" />
              ))
            ) : (
              machines?.filter(m => m.type === "buy").map(renderMachineCard)
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMachine?.type === "rent" ? "Louer" : "Acheter"} {selectedMachine?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedMachine?.type === "rent" 
                ? `Prix location: $${selectedMachine?.rentalPrice} + Dépôt min: $${selectedMachine?.minDeposit}`
                : `Prix d'achat: $${selectedMachine?.buyPrice}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMachine?.type === "rent" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Montant du Dépôt ($)</Label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  min={selectedMachine?.minDeposit}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum requis: ${selectedMachine?.minDeposit}
                </p>
              </div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Frais mensuels</span>
              <span>$3.00</span>
            </div>
            <div className="flex justify-between font-bold border-t border-primary/20 pt-2">
              <span>Total à payer</span>
              <span>
                ${selectedMachine?.type === "rent" 
                  ? (Number(selectedMachine?.rentalPrice) + Number(amount)).toFixed(2)
                  : Number(selectedMachine?.buyPrice).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button onClick={handlePurchase} disabled={purchaseMutation.isPending}>
              {purchaseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}