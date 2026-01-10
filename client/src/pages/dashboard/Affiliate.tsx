import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Copy, Users, TrendingUp, Gift, Link as LinkIcon, Share2, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function Affiliate() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode || ""}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Lien copié !",
      description: "Votre lien de parrainage est prêt à être partagé.",
    });
  };

  const stats = [
    {
      label: "Affiliés Directs",
      value: user?.activeReferrals || 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Gains Directs (Lvl 1)",
      value: `$${Number(user?.referralEarnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Gains Indirects (Lvl 2)",
      value: `$${Number((user as any)?.indirectReferralEarnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Programme d'Affiliation Avancé</h1>
        <p className="text-muted-foreground">Maximisez vos revenus grâce à notre système de parrainage à deux niveaux.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Votre Lien & QR Code</CardTitle>
            <CardDescription>Partagez votre lien ou faites scanner votre QR code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center p-4 bg-white rounded-xl w-fit mx-auto">
              <QRCodeSVG value={referralLink} size={150} />
            </div>

            <div className="flex items-center gap-2 p-4 bg-background/50 border border-white/5 rounded-xl">
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <code className="text-sm font-mono truncate flex-1">{referralLink}</code>
              <Button size="icon" variant="ghost" onClick={copyLink} className="shrink-0 hover-elevate">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="flex-1 gap-2" onClick={copyLink}>
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
              <Badge variant="outline" className="py-2 px-4 border-primary/20 bg-primary/5 text-primary">
                Code: {user?.referralCode}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Structure des Gains par Niveau</CardTitle>
            <CardDescription>Gagnez sur vos filleuls et sur les filleuls de vos amis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-emerald-400">Niveau 1 (Direct)</span>
                  <Badge className="bg-emerald-500">10%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Commission sur chaque dépôt effectué par vos filleuls directs.</p>
              </div>

              <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-orange-400">Niveau 2 (Indirect)</span>
                  <Badge className="bg-orange-500">5%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Commission sur les dépôts des filleuls de vos propres filleuls.</p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="font-semibold text-sm mb-3">Tableau Récapitulatif</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs p-2 bg-white/[0.02] rounded">
                    <span className="text-muted-foreground">Filleuls Directs</span>
                    <span className="font-bold">{user?.activeReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 bg-white/[0.02] rounded">
                    <span className="text-muted-foreground">Filleuls Indirects</span>
                    <span className="font-bold">À venir...</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}