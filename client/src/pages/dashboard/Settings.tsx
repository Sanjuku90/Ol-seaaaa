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
import { Settings as SettingsIcon, User, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile state
  const [phone, setPhone] = useState(user?.phone || "");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentWithdrawPassword, setCurrentWithdrawPassword] = useState("");
  const [newWithdrawPassword, setNewWithdrawPassword] = useState("");

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
    mutationFn: async (data: { currentPassword?: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/user/withdraw-password", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Mot de passe de retrait mis à jour", description: "Votre mot de passe de retrait a été enregistré." });
      setCurrentWithdrawPassword("");
      setNewWithdrawPassword("");
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
    updateWithdrawPasswordMutation.mutate({ 
      currentPassword: currentWithdrawPassword || undefined, 
      newPassword: newWithdrawPassword 
    });
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border p-1 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg gap-2"><User className="w-4 h-4" /> Profil</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2"><Lock className="w-4 h-4" /> Sécurité</TabsTrigger>
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
                    {user?.withdrawPassword && (
                      <div className="space-y-2">
                        <Label>Ancien mot de passe de retrait</Label>
                        <Input 
                          type="password" 
                          value={currentWithdrawPassword} 
                          onChange={(e) => setCurrentWithdrawPassword(e.target.value)} 
                          placeholder="Entrez l'ancien code"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>{user?.withdrawPassword ? "Nouveau mot de passe de retrait" : "Définir le mot de passe de retrait"}</Label>
                      <Input 
                        type="password" 
                        value={newWithdrawPassword} 
                        onChange={(e) => setNewWithdrawPassword(e.target.value)} 
                        placeholder="Nouveau code"
                      />
                    </div>
                    <Button type="submit" disabled={updateWithdrawPasswordMutation.isPending}>
                      {user?.withdrawPassword ? "Changer le mot de passe" : "Définir le mot de passe"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
