import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings as SettingsIcon, User, Lock, ShieldCheck, Clock, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Profile state
  const [phone, setPhone] = useState(user?.phone || "");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  
  // KYC states
  const [fullName, setFullName] = useState(user?.kycFullName || "");
  const [documentUrl, setDocumentUrl] = useState(user?.kycDocumentUrl || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mot de passe mis à jour", description: "Votre mot de passe a été changé avec succès." });
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateWithdrawPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/user/withdraw-password", { password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Mot de passe de retrait mis à jour", description: "Votre mot de passe de retrait a été enregistré." });
      setWithdrawPassword("");
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const kycMutation = useMutation({
    mutationFn: async (data: { fullName: string; documentUrl: string }) => {
      const res = await apiRequest("POST", "/api/kyc/submit", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Demande KYC soumise", description: "Vos documents sont en cours d'examen." });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ phone });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleWithdrawPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWithdrawPasswordMutation.mutate(withdrawPassword);
  };

  const handleKYCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    kycMutation.mutate({ fullName, documentUrl });
  };

  const renderKYCStatus = () => {
    switch (user?.kycStatus) {
      case "approved":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Identité Vérifiée</h3>
            <p className="text-muted-foreground">Votre compte est entièrement vérifié.</p>
          </div>
        );
      case "pending":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-yellow-500/10 rounded-full">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold">Vérification en cours</h3>
            <p className="text-muted-foreground">Nous examinons vos documents.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/user"] })}
            >
              Actualiser le statut
            </Button>
          </div>
        );
      case "rejected":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-destructive/5 rounded-xl border border-destructive/10">
              <div className="p-4 bg-destructive/10 rounded-full">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h3 className="text-xl font-bold">Vérification Rejetée</h3>
              <p className="text-muted-foreground">Vos documents n'ont pas pu être validés. Veuillez soumettre à nouveau des documents lisibles et valides.</p>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <h4 className="font-semibold mb-4">Nouvelle Soumission</h4>
              <form onSubmit={handleKYCSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom Complet</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docUrl">Lien Document (URL)</Label>
                  <Input id="docUrl" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..." />
                </div>
                <Button type="submit" className="w-full" disabled={kycMutation.isPending}>
                  {kycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Soumettre à nouveau
                </Button>
              </form>
            </div>
          </div>
        );
      default:
        return (
          <form onSubmit={handleKYCSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom Complet</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Dupont" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docUrl">Lien Document (URL)</Label>
              <Input id="docUrl" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button type="submit" className="w-full" disabled={kycMutation.isPending}>
              {kycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Soumettre KYC
            </Button>
          </form>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card border p-1 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg gap-2"><User className="w-4 h-4" /> Profil</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2"><Lock className="w-4 h-4" /> Sécurité</TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-lg gap-2"><ShieldCheck className="w-4 h-4" /> KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Gérez vos informations de base et vos coordonnées.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33..." />
                    </div>
                  </div>
                  <Button type="submit" disabled={updateProfileMutation.isPending}>Enregistrer</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover-elevate">
                <CardHeader>
                  <CardTitle>Mot de passe de connexion</CardTitle>
                  <CardDescription>Sécurisez l'accès à votre compte.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mot de passe actuel</Label>
                      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nouveau mot de passe</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={updatePasswordMutation.isPending}>Mettre à jour</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <CardTitle>Mot de passe de retrait</CardTitle>
                  <CardDescription>Requis pour valider toutes vos transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdrawPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nouveau mot de passe de retrait</Label>
                      <Input type="password" value={withdrawPassword} onChange={(e) => setWithdrawPassword(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={updateWithdrawPasswordMutation.isPending}>Définir</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kyc">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle>Vérification d'Identité (KYC)</CardTitle>
                <CardDescription>Obligatoire pour les retraits importants.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderKYCStatus()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
