import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Copy, 
  CheckCircle2, 
  TrendingUp, 
  Gift,
  Share2
} from "lucide-react";
import { type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Affiliate() {
  const { toast } = useToast();
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: referrals, isLoading } = useQuery<User[]>({ 
    queryKey: ["/api/referrals"] 
  });
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Copié !",
        description: "Votre lien de parrainage a été copié dans le presse-papier.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le lien.",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Programme d'Affiliation</h1>
        <p className="text-muted-foreground">Invitez vos amis et gagnez des commissions sur leur minage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parrainés</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{referrals?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.activeReferrals || 0} actifs ce mois-ci
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-emerald-400">$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Prochain paiement: Automatique
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Actuel</CardTitle>
            <Gift className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">10%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur chaque dépôt de vos filleuls
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Share2 className="w-24 h-24" />
        </div>
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">Votre lien de parrainage</h3>
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={referralLink} 
              className="bg-background/50 border-white/10"
            />
            <Button onClick={copyToClipboard} className="shrink-0">
              {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Code de parrainage : <span className="text-foreground font-mono font-bold">{user?.referralCode}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader>
          <CardTitle>Mes Filleuls</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead>Utilisateur</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Commission générée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : referrals?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Vous n'avez pas encore de parrainages.
                  </TableCell>
                </TableRow>
              ) : referrals?.map((ref) => (
                <TableRow key={ref.id} className="border-white/5">
                  <TableCell className="font-medium">{ref.email.split('@')[0]}***@{ref.email.split('@')[1]}</TableCell>
                  <TableCell>{new Date(ref.createdAt!).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Actif
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">$0.00</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
