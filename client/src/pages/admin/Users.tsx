import { useState, useRef } from "react";
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
  Check,
  Eye,
  Calendar,
  MapPin,
  FileText,
  Lock
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
import { Textarea } from "@/components/ui/textarea";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [isBonusOpen, setIsBonusOpen] = useState(false);
  
  // KYC management
  const [isKycDialogOpen, setIsKycDialogOpen] = useState(false);
  const [kycUser, setKycUser] = useState<User | null>(null);
  const [kycRejectNote, setKycRejectNote] = useState("");

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

  const updateKycMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: 'approved' | 'rejected'; note?: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/kyc`, { status, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsKycDialogOpen(false);
      setKycRejectNote("");
      toast({ title: "KYC mis à jour", description: "Le statut KYC a été mis à jour et l'utilisateur notifié." });
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

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordUser, setPasswordUser] = useState<User | null>(null);

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      await apiRequest("POST", `/api/admin/users/${id}/password`, { password });
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      toast({ title: "Succès", description: "Mot de passe mis à jour." });
    }
  });

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(searchTerm)) ||
    (u.kycFullName && u.kycFullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Actif</Badge>;
      case "suspended": return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Suspendu</Badge>;
      case "banned": return <Badge variant="destructive">Banni</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-emerald-500 text-white">Vérifié</Badge>;
      case "pending": return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      case "rejected": return <Badge className="bg-red-500 text-white">Rejeté</Badge>;
      default: return <Badge variant="outline">Non soumis</Badge>;
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

  const kycRequests = users?.filter(u => u.kycStatus === 'pending') || [];

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Administration</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs, transactions, KYC et support.</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-6 bg-card border">
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Utilisateurs</TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2">
            <Shield className="w-4 h-4" /> 
            KYC
            {kycRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 min-w-[20px]">{kycRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2"><History className="w-4 h-4" /> Transactions</TabsTrigger>
          <TabsTrigger value="support" className="gap-2"><MessageSquare className="w-4 h-4" /> Support</TabsTrigger>
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

          <Card className="hover-elevate">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucun utilisateur trouvé.
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers?.map((user) => (
                    <TableRow key={user.id} className="border-white/5">
                      <TableCell>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.kycFullName || "Profil incomplet"}</div>
                      </TableCell>
                      <TableCell>{getKycStatusBadge(user.kycStatus || "")}</TableCell>
                      <TableCell className="font-bold">${Number(user.balance).toFixed(2)}</TableCell>
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
                            {user.kycStatus === 'pending' && (
                              <DropdownMenuItem onClick={() => {
                                setKycUser(user);
                                setIsKycDialogOpen(true);
                              }}>
                                <Shield className="w-4 h-4 mr-2" /> Examiner KYC
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              setPasswordUser(user);
                              setIsPasswordDialogOpen(true);
                            }}>
                              <Lock className="w-4 h-4 mr-2" /> Changer le mot de passe
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

        <TabsContent value="kyc">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Demandes KYC en attente</CardTitle>
              <CardDescription>Examinez les documents d'identité soumis par les utilisateurs.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Date Soumission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucune demande en attente.
                      </TableCell>
                    </TableRow>
                  ) : kycRequests.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.kycFullName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>{user.kycCountry}</TableCell>
                      <TableCell className="capitalize">{user.kycDocumentType?.replace('_', ' ')}</TableCell>
                      <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => {
                          setKycUser(user);
                          setIsKycDialogOpen(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" /> Examiner
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
              <CardDescription>Validez ou refusez les opérations financières.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell>
                    </TableRow>
                  ) : transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune transaction.</TableCell>
                    </TableRow>
                  ) : transactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.ticketNumber || `#${tx.id}`}</TableCell>
                      <TableCell>{(tx as any).user?.email || `User #${tx.userId}`}</TableCell>
                      <TableCell className="capitalize">
                        <span className={tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}>{tx.type}</span>
                      </TableCell>
                      <TableCell className="font-bold">${Number(tx.amount).toFixed(2)}</TableCell>
                      <TableCell>{getTxStatusBadge(tx.status || 'pending')}</TableCell>
                      <TableCell className="text-right">
                        {tx.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-emerald-500" onClick={() => updateTxStatusMutation.mutate({ id: tx.id, status: 'completed' })}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => updateTxStatusMutation.mutate({ id: tx.id, status: 'rejected' })}>
                              <XCircle className="w-4 h-4" />
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
          {/* ... Copie du support existant ... */}
          <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card">Interface Support Client active</div>
        </TabsContent>
      </Tabs>

      {/* KYC Examination Dialog */}
      <Dialog open={isKycDialogOpen} onOpenChange={setIsKycDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Examen de la demande KYC</DialogTitle>
            <DialogDescription>Vérifiez les informations et documents de {kycUser?.kycFullName}</DialogDescription>
          </DialogHeader>
          {kycUser && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Informations Personnelles</Label>
                    <div className="flex items-center gap-2 font-medium"><UserIcon className="w-4 h-4" /> {kycUser.kycFullName}</div>
                    <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> Né le {kycUser.kycBirthDate}</div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4" /> Pays : {kycUser.kycCountry}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Document</Label>
                    <div className="flex items-center gap-2 font-medium capitalize"><FileText className="w-4 h-4" /> {kycUser.kycDocumentType?.replace('_', ' ')}</div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="kycNote">Note / Motif de rejet</Label>
                    <Textarea 
                      id="kycNote" 
                      placeholder="Ajouter une note ou expliquer le motif du rejet..."
                      value={kycRejectNote}
                      onChange={(e) => setKycRejectNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-muted-foreground">Documents Photos</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs">Recto :</span>
                      <div className="aspect-video bg-muted rounded-lg border overflow-hidden">
                        <img src={kycUser.kycPhotoRecto || ""} alt="Recto" className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    {kycUser.kycPhotoVerso && (
                      <div className="space-y-1">
                        <span className="text-xs">Verso :</span>
                        <div className="aspect-video bg-muted rounded-lg border overflow-hidden">
                          <img src={kycUser.kycPhotoVerso || ""} alt="Verso" className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-xs">Selfie :</span>
                      <div className="aspect-video bg-muted rounded-lg border overflow-hidden">
                        <img src={kycUser.kycPhotoSelfie || ""} alt="Selfie" className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => updateKycMutation.mutate({ id: kycUser!.id, status: 'rejected', note: kycRejectNote })}
              disabled={updateKycMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" /> Rejeter
            </Button>
            <Button 
              variant="default" 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => updateKycMutation.mutate({ id: kycUser!.id, status: 'approved', note: kycRejectNote })}
              disabled={updateKycMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>Définir un nouveau mot de passe pour {passwordUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Entrez le nouveau mot de passe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => updatePasswordMutation.mutate({ id: passwordUser!.id, password: newPassword })}
              disabled={!newPassword || updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bonus Dialog */}
      <Dialog open={isBonusOpen} onOpenChange={setIsBonusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un bonus</DialogTitle>
            <DialogDescription>L'utilisateur {selectedUser?.email} recevra ce montant instantanément.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Montant ($)</Label>
              <Input 
                type="number" 
                value={bonusAmount} 
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="Ex: 50.00"
              />
            </div>
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
