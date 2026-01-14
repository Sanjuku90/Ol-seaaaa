import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Clock, XCircle, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function KYC() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: { fullName: string; documentUrl: string }) => {
      const res = await apiRequest("POST", "/api/kyc/submit", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Demande soumise",
        description: "Vos documents sont en cours d'examen.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !documentUrl) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ fullName, documentUrl });
  };

  const renderStatus = () => {
    switch (user?.kycStatus) {
      case "approved":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Identité Vérifiée</h3>
            <p className="text-muted-foreground max-w-md">
              Votre compte est désormais entièrement vérifié. Vous avez accès à toutes les fonctionnalités, y compris les retraits illimités.
            </p>
          </div>
        );
      case "pending":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-yellow-500/10 rounded-full">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold">Vérification en cours</h3>
            <p className="text-muted-foreground max-w-md">
              Nous avons bien reçu vos documents. Notre équipe les examine actuellement. Cela prend généralement moins de 24 heures.
            </p>
          </div>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h3 className="text-2xl font-bold">Vérification Refusée</h3>
            <p className="text-muted-foreground max-w-md">
              Malheureusement, vos documents n'ont pas pu être validés. Veuillez soumettre à nouveau des documents clairs et lisibles.
            </p>
            <Button onClick={() => mutation.reset()} variant="outline">Réessayer</Button>
          </div>
        );
      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom Complet (tel que sur votre pièce d'identité)</Label>
              <Input
                id="fullName"
                placeholder="Ex: Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentUrl">Lien vers votre pièce d'identité (URL de l'image)</Label>
              <Input
                id="documentUrl"
                placeholder="https://votre-image.com/identite.jpg"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                disabled={mutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Veuillez héberger votre document sur un service tiers et fournir le lien direct.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Soumission...
                </>
              ) : (
                "Soumettre pour vérification"
              )}
            </Button>
          </form>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Vérification d'Identité</h1>
            <p className="text-muted-foreground">Complétez votre KYC pour débloquer toutes les fonctionnalités.</p>
          </div>
        </div>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle>Soumettre vos informations</CardTitle>
            <CardDescription>
              La vérification est obligatoire pour garantir la sécurité de vos fonds et la conformité de la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStatus()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
