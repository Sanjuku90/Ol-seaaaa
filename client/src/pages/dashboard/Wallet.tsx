import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateTransaction, useTransactions } from "@/hooks/use-platform";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const transactionSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum amount is $10"),
});

export default function Wallet() {
  const { user } = useAuth();
  const { data: transactions } = useTransactions();
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: 0 },
  });

  const onSubmit = (data: z.infer<typeof transactionSchema>, type: 'deposit' | 'withdrawal') => {
    createTransaction({ type, amount: data.amount });
    form.reset();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText("0x1234...5678");
    toast({ title: "Copied!", description: "Wallet address copied to clipboard" });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your deposits and withdrawals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <Card className="lg:col-span-1 border-white/5 bg-gradient-to-br from-primary/20 to-card">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">Available Balance</CardTitle>
            <div className="text-4xl font-bold font-display mt-2">${Number(user?.balance).toFixed(2)}</div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-background/40 p-3 rounded-lg flex items-center justify-between border border-white/5">
                <span className="text-xs text-muted-foreground">USDT Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">0x1234...5678</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Tabs */}
        <Card className="lg:col-span-2 border-white/5 bg-card/50">
          <CardContent className="pt-6">
            <Tabs defaultValue="deposit">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdraw</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposit">
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-200">
                    Deposits are automatic. Use the form below to simulate a deposit for this demo.
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => onSubmit(d, 'deposit'))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (USDT)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ArrowDownLeft className="w-4 h-4 mr-2" />}
                        Deposit Funds
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
                            <FormLabel>Amount (USDT)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" variant="destructive" disabled={isPending} className="w-full">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                        Request Withdrawal
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                      {tx.status}
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
