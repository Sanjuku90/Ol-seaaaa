import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateTransaction, useTransactions } from "@/hooks/use-platform";
import { api } from "@shared/routes";

const transactionSchema = z.object({
  amount: z.coerce.number().min(10, "Le montant minimum est de 10 $"),
  crypto: z.string().min(1, "Veuillez choisir une cryptomonnaie"),
  walletAddress: z.string().optional(),
});

export default function Wallet() {
  const { user, refetch: refetchUser } = useAuth();
  const { data: transactions, refetch: refetchTransactions } = useTransactions();
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { toast } = useToast();
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof refetchTransactions === 'function') {
        refetchTransactions();
      }
      if (typeof refetchUser === 'function') {
        refetchUser();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchTransactions, refetchUser]);
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: 0, crypto: "USDT TRC20", walletAddress: "" },
  });

  const onSubmit = (data: z.infer<typeof transactionSchema>, type: 'deposit' | 'withdrawal') => {
    if (type === 'withdrawal' && (!data.walletAddress || data.walletAddress.trim() === "")) {
      toast({ title: "Erreur", description: "Veuillez saisir une adresse de réception", variant: "destructive" });
      return;
    }
    createTransaction({ 
      type, 
      amount: data.amount, 
      walletAddress: data.walletAddress?.trim() || undefined 
    } as any);
    form.reset({ amount: 0, crypto: data.crypto, walletAddress: "" });
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copié !", description: "L'adresse a été copiée dans le presse-papiers" });
  };

  const depositAddresses = [
    { label: "USDT TRC20", address: "TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS" },
    { label: "USDT ERC20", address: "0x4dc2eac23fa51001d5acc94889177ec066cc389c" },
    { label: "Bitcoin", address: "122paUVfGYrJUVVfhiYk5fJUieZgzCkPco" },
    { label: "Bnb BEP20", address: "0x4dc2eac23fa51001d5acc94889177ec066cc389c" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Portefeuille</h1>
        <p className="text-muted-foreground">Gérez vos dépôts et vos retraits.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Balance Card */}
        <Card className="border-white/5 bg-gradient-to-br from-primary/20 to-card">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">Solde Disponible</CardTitle>
            <div className="text-4xl font-bold font-display mt-2">${Number(user?.balance).toFixed(4)}</div>
          </CardHeader>
        </Card>

        {/* Actions Tabs */}
        <Card className="lg:col-span-3 border-white/5 bg-card/50">
          <CardContent className="pt-6">
            <Tabs defaultValue="deposit">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdraw</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposit">
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-200">
                    Choisissez votre cryptomonnaie, saisissez le montant, puis effectuez le transfert à l'adresse indiquée.
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => onSubmit(d, 'deposit'))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="crypto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cryptomonnaie</FormLabel>
                            <FormControl>
                              <select 
                                {...field} 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {depositAddresses.map(addr => (
                                  <option key={addr.label} value={addr.label}>{addr.label}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-background/40 p-4 rounded-lg border border-white/5 space-y-2">
                        <p className="text-xs text-muted-foreground">Adresse de dépôt pour {form.watch("crypto")}:</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-[10px] font-mono break-all text-primary">
                            {depositAddresses.find(a => a.label === form.watch("crypto"))?.address}
                          </code>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 shrink-0" 
                            onClick={() => copyAddress(depositAddresses.find(a => a.label === form.watch("crypto"))?.address || "")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant (USDT)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ArrowDownLeft className="w-4 h-4 mr-2" />}
                        Deposition Fund
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              
              <TabsContent value="withdrawal">
                <div className="space-y-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => onSubmit(d, 'withdrawal'))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant (USDT)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse de réception</FormLabel>
                            <FormControl>
                              <Input placeholder="Entrez votre adresse crypto" {...field} className="bg-background" />
                            </FormControl>
                            <FormDescription>
                              L'adresse sur laquelle vous souhaitez recevoir vos fonds.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" variant="destructive" disabled={isPending} className="w-full">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                        Demander un retrait
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="mt-8 border-white/5 bg-card/50">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="capitalize font-medium">
                    <span className={tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}>
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-secondary text-muted-foreground'}`}>
                      {tx.status === 'pending' ? 'En attente' : tx.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {!transactions?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
