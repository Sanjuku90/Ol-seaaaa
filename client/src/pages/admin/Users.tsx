import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { 
  Users, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle, 
  PlusCircle, 
  Search,
  Loader2
} from "lucide-react";
import { type User } from "@shared/schema";
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

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [isBonusOpen, setIsBonusOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"]
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

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Consultez et gérez tous les membres de la plateforme.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher email ou tel..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
              {isLoading ? (
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
