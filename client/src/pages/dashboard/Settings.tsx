import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings as SettingsIcon, User, Lock, ShieldCheck, Clock, XCircle, ChevronRight, ChevronLeft, Upload, CheckCircle2, Camera, Image as ImageIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import countryList from 'react-select-country-list';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadType, setCurrentUploadType] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"user" | "environment" | undefined>(undefined);

  const countryOptions = useMemo(() => countryList().getData(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "kyc") {
      setActiveTab("kyc");
    }
  }, [location]);
  
  // Profile state
  const [phone, setPhone] = useState(user?.phone || "");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentWithdrawPassword, setCurrentWithdrawPassword] = useState("");
  const [newWithdrawPassword, setNewWithdrawPassword] = useState("");
  
  // KYC states
  const [step, setStep] = useState(1);
  const [kycData, setKycData] = useState({
    fullName: user?.kycFullName || "",
    country: user?.kycCountry || "",
    birthDate: user?.kycBirthDate || "",
    documentType: user?.kycDocumentType || "",
    photoRecto: user?.kycPhotoRecto || "",
    photoVerso: user?.kycPhotoVerso || "",
    photoSelfie: user?.kycPhotoSelfie || "",
  });

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

  const kycMutation = useMutation({
    mutationFn: async (data: typeof kycData) => {
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
    updateWithdrawPasswordMutation.mutate({ 
      currentPassword: currentWithdrawPassword || undefined, 
      newPassword: newWithdrawPassword 
    });
  };

  const handleKYCSubmit = () => {
    kycMutation.mutate(kycData);
  };

  const renderKYCStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Informations Personnelles</h4>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom Complet</Label>
              <Input 
                id="fullName" 
                value={kycData.fullName} 
                onChange={(e) => setKycData({...kycData, fullName: e.target.value})} 
                placeholder="Jean Dupont" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Select 
                value={kycData.country} 
                onValueChange={(value) => setKycData({...kycData, country: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input 
                id="birthDate" 
                type="date"
                value={kycData.birthDate} 
                onChange={(e) => setKycData({...kycData, birthDate: e.target.value})} 
              />
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Suivant <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Type de Document</h4>
            <div className="space-y-2">
              <Label>Type de pièce d'identité</Label>
              <Select 
                value={kycData.documentType} 
                onValueChange={(value) => setKycData({...kycData, documentType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_card">Carte d'Identité</SelectItem>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="driver_license">Permis de Conduire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Retour
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!kycData.documentType}>
                Suivant <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Photos du Document</h4>
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture={captureMode}
                onChange={handleFileChange} 
              />
              <div className="space-y-2">
                <Label>Recto du document</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full gap-2" onClick={() => triggerUpload("photoRecto", "environment")}>
                    <Camera className="w-4 h-4" /> Caméra
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => triggerUpload("photoRecto")}>
                    <ImageIcon className="w-4 h-4" /> Galerie
                  </Button>
                </div>
                {kycData.photoRecto && (
                  <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border">
                    <img src={kycData.photoRecto} alt="Recto" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Verso du document</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full gap-2" onClick={() => triggerUpload("photoVerso", "environment")}>
                    <Camera className="w-4 h-4" /> Caméra
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => triggerUpload("photoVerso")}>
                    <ImageIcon className="w-4 h-4" /> Galerie
                  </Button>
                </div>
                {kycData.photoVerso && (
                  <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border">
                    <img src={kycData.photoVerso} alt="Verso" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Selfie avec le document</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full gap-2" onClick={() => triggerUpload("photoSelfie", "user")}>
                    <Camera className="w-4 h-4" /> Caméra
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => triggerUpload("photoSelfie")}>
                    <ImageIcon className="w-4 h-4" /> Galerie
                  </Button>
                </div>
                {kycData.photoSelfie && (
                  <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border">
                    <img src={kycData.photoSelfie} alt="Selfie" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Retour
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleKYCSubmit}
                disabled={kycMutation.isPending || !kycData.photoRecto || !kycData.photoSelfie}
              >
                {kycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Soumettre
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
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
            <p className="text-muted-foreground">Nous examinons vos documents. Cela peut prendre jusqu'à 24h.</p>
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
              <p className="text-muted-foreground">Vos documents n'ont pas pu être validés. {user.kycNote && <span className="block mt-2 font-semibold">Motif : {user.kycNote}</span>}</p>
            </div>
            <div className="pt-6 border-t border-white/5">
              <h4 className="font-semibold mb-4 text-center">Recommencer la vérification</h4>
              <div className="max-w-md mx-auto">
                {renderKYCStep()}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="max-w-md mx-auto py-4">
            <div className="mb-8 flex justify-between relative">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground">Étape {s}</span>
                </div>
              ))}
              <div className="absolute top-4 left-0 w-full h-[2px] bg-muted -z-0">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step - 1) * 50}%` }} />
              </div>
            </div>
            {renderKYCStep()}
          </div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

          <TabsContent value="kyc">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle>Vérification d'Identité (KYC)</CardTitle>
                <CardDescription>Obligatoire pour les retraits importants (≥ 200$).</CardDescription>
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
