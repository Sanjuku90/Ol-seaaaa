import { useMachines, useCreateContract } from "@/hooks/use-platform";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Machines() {
  const { data: machines, isLoading } = useMachines();
  const { mutate: buyMachine, isPending } = useCreateContract();
  const { user } = useAuth();
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleBuy = () => {
    if (!selectedMachine) return;
    buyMachine({
      machineId: selectedMachine.id,
      amount: Number(investAmount),
      autoReinvest: false,
    }, {
      onSuccess: () => setIsOpen(false)
    });
  };

  const openPurchaseDialog = (machine: any) => {
    setSelectedMachine(machine);
    setInvestAmount(machine.minDeposit.toString());
    setIsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Buy Machines</h1>
        <p className="text-muted-foreground">Start a new mining contract.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines?.map((machine) => (
            <Card key={machine.id} className="border-white/5 bg-card/50 hover:bg-card/80 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">{machine.name}</CardTitle>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {machine.dailyRate}% Daily
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold font-display text-primary">
                  ${machine.minDeposit}<span className="text-base text-muted-foreground font-sans font-normal ml-1">min</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="text-foreground">{machine.durationDays} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware</span>
                    <span className="text-foreground">ASIC Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Total Return</span>
                    <span className="text-emerald-400">
                      {((Number(machine.dailyRate) * machine.durationDays)).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => openPurchaseDialog(machine)}>
                  <Zap className="w-4 h-4 mr-2 fill-current" />
                  Purchase Contract
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase {selectedMachine?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you wish to invest. Minimum is ${selectedMachine?.minDeposit}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Investment Amount ($)</Label>
              <Input 
                type="number" 
                value={investAmount} 
                onChange={(e) => setInvestAmount(e.target.value)}
                min={selectedMachine?.minDeposit}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Available Balance: <span className="text-foreground font-medium">${Number(user?.balance).toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleBuy} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
