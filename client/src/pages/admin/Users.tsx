import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle, 
  PlusCircle, 
  Search,
  Loader2,
  XCircle,
  History,
  MessageSquare,
  Send,
  User as UserIcon,
  LogOut as LeaveIcon,
  Check
} from "lucide-react";
import { type User, type Transaction, type SupportMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [isBonusOpen, setIsBonusOpen] = useState(false);
  
  // Support state
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 5000,
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 5000,
  });

  const { data: allMessages, isLoading: messagesLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/admin/support"],
    refetchInterval: 3000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Statut de l'utilisateur mis à jour." });
    }
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number; isAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Privilèges mis à jour." });
    }
  });

  const addBonusMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      await apiRequest("POST", `/api/admin/users/${id}/balance`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsBonusOpen(false);
      setBonusAmount("");
      toast({ title: "Succès", description: "Bonus ajouté avec succès." });
    }
  });

  const updateTxStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'completed' | 'rejected' }) => {
      await apiRequest("PATCH", `/api/admin/transactions/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Succès", description: "Transaction mise à jour." });
    }
  });

  const sendSupportMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
      const res = await apiRequest("POST", "/api/admin/support", { userId, message });
      return res.json();
    },
    onSuccess: () => {
      setSupportMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support"] });
    },
  });

  const closeSupportMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", "/api/admin/support/close", { userId });
    },
    onSuccess: () => {
      setSelectedSupportUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support"] });
      toast({ title: "Conversation terminée", description: "La discussion a été marquée comme fermée." });
    }
  });

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Actif</Badge>;
      case "suspended": return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Suspendu</Badge>;
      case "banned": return <Badge variant="destructive">Banni</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTxStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">En attente</Badge>;
      case "completed": return <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Validé</Badge>;
      case "rejected": return <Badge variant="destructive">Refusé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const chatMessages = allMessages?.filter(m => Number(m.userId) === Number(selectedSupportUserId)) || [];
  const usersWithMessages = Array.from(new Set(allMessages?.map(m => Number(m.userId))));

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Administration</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs, transactions et support.</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-6">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="support">
            <MessageSquare className="w-4 h-4 mr-2" />
            Support Client
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="mb-4 relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher email ou tel..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucun utilisateur trouvé.
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers?.map((user) => (
                    <TableRow key={user.id} className="border-white/5">
                      <TableCell>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-muted-foreground">ID: #{user.id}</div>
                      </TableCell>
                      <TableCell>{user.phone || "Non renseigné"}</TableCell>
                      <TableCell>{getStatusBadge(user.status || "active")}</TableCell>
                      <TableCell className="font-bold">${Number(user.balance).toFixed(2)}</TableCell>
                      <TableCell>{user.affiliationGrade}</TableCell>
                      <TableCell>
                        {user.isAdmin ? <Shield className="w-4 h-4 text-primary" /> : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setIsBonusOpen(true);
                            }}>
                              <PlusCircle className="w-4 h-4 mr-2" /> Ajouter un bonus
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: user.id, status: "active" })}>
                              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Activer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: user.id, status: "suspended" })}>
                              <Ban className="w-4 h-4 mr-2 text-yellow-500" /> Suspendre
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: user.id, status: "banned" })}>
                              <Ban className="w-4 h-4 mr-2 text-red-500" /> Bannir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateAdminMutation.mutate({ id: user.id, isAdmin: !user.isAdmin })}>
                              <Shield className="w-4 h-4 mr-2" /> 
                              {user.isAdmin ? "Retirer admin" : "Rendre admin"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader>
              <CardTitle>Transactions en attente</CardTitle>
              <CardDescription>Validez ou refusez les dépôts et retraits.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead>Ticket</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucune transaction trouvée.
                      </TableCell>
                    </TableRow>
                  ) : transactions?.map((tx) => (
                    <TableRow key={tx.id} className="border-white/5">
                      <TableCell className="font-mono text-xs">{tx.ticketNumber || `#${tx.id}`}</TableCell>
                      <TableCell>{users?.find(u => u.id === tx.userId)?.email || `User #${tx.userId}`}</TableCell>
                      <TableCell className="capitalize">
                        <span className={tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold">${Number(tx.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono">{tx.walletAddress || "-"}</TableCell>
                      <TableCell>{getTxStatusBadge(tx.status || 'pending')}</TableCell>
                      <TableCell className="text-right">
                        {tx.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-emerald-500 hover:text-emerald-400"
                              onClick={() => updateTxStatusMutation.mutate({ id: tx.id, status: 'completed' })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Valider
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-400"
                              onClick={() => updateTxStatusMutation.mutate({ id: tx.id, status: 'rejected' })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
            <Card className="lg:col-span-1 border-white/5 bg-card/50 overflow-hidden flex flex-col">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-sm">Conversations</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {usersWithMessages.map(uid => {
                    const u = users?.find(user => Number(user.id) === Number(uid));
                    const userMessages = allMessages?.filter(m => Number(m.userId) === Number(uid));
                    const lastMsg = userMessages?.[userMessages.length - 1];
                    const isClosed = lastMsg?.status === "closed";
                    if (isClosed && selectedSupportUserId !== uid) return null;
                    return (
                      <button
                        key={uid}
                        onClick={() => setSelectedSupportUserId(uid)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 relative",
                          selectedSupportUserId === uid ? "bg-primary/20 border border-primary/20" : "hover:bg-white/5"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u?.email || `User #${uid}`}</p>
                          <p className="text-xs text-muted-foreground truncate">{lastMsg?.message}</p>
                        </div>
                        {isClosed && (
                          <Badge variant="outline" className="absolute top-2 right-2 text-[8px] h-4 px-1 opacity-50">Fermé</Badge>
                        )}
                      </button>
                    );
                  })}
                  {!messagesLoading && usersWithMessages.length === 0 && (
                    <p className="text-center py-8 text-xs text-muted-foreground">Aucun message</p>
                  )}
                </div>
              </ScrollArea>
            </Card>

            <div className="lg:col-span-3 flex flex-col gap-4">
              <Card className="flex-1 flex flex-col overflow-hidden border-white/5 bg-card/50">
                <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {selectedSupportUserId ? `Chat avec ${users?.find(u => Number(u.id) === Number(selectedSupportUserId))?.email}` : "Sélectionnez une conversation"}
                  </CardTitle>
                  {selectedSupportUserId && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedSupportUserId(null)}
                      >
                        <LeaveIcon className="w-3 h-3" /> Quitter
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs gap-1 text-emerald-500 hover:text-emerald-400"
                        onClick={() => closeSupportMutation.mutate(selectedSupportUserId)}
                        disabled={closeSupportMutation.isPending}
                      >
                        <Check className="w-3 h-3" /> Terminer
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : !selectedSupportUserId ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Sélectionnez un utilisateur pour voir les messages.
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucun message dans cette conversation.
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                msg.isAdmin
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-secondary text-foreground rounded-tl-none"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-[10px] opacity-70 mt-1 text-right">
                                {format(new Date(msg.createdAt), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  {selectedSupportUserId && (
                    <div className="p-4 border-t border-white/5">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!supportMessage.trim() || sendSupportMutation.isPending) return;
                          sendSupportMutation.mutate({ userId: selectedSupportUserId, message: supportMessage });
                        }} 
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="Répondre au client..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          disabled={sendSupportMutation.isPending}
                          className="bg-background/50 border-white/10"
                        />
                        <Button type="submit" size="icon" disabled={!supportMessage.trim() || sendSupportMutation.isPending}>
                          {sendSupportMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isBonusOpen} onOpenChange={setIsBonusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un bonus</DialogTitle>
            <DialogDescription>
              Ajouter manuellement des fonds au solde de {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="amount">Montant ($)</Label>
            <Input 
              id="amount" 
              type="number" 
              value={bonusAmount} 
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="Ex: 50"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBonusOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => addBonusMutation.mutate({ id: selectedUser!.id, amount: Number(bonusAmount) })}
              disabled={addBonusMutation.isPending || !bonusAmount}
            >
              {addBonusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
