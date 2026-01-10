import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Copy, Users, TrendingUp, Gift, Link as LinkIcon, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      label: "Affiliés Actifs",
      value: user?.activeReferrals || 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Gains de Parrainage",
      value: `$${Number(user?.referralEarnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Grade Actuel",
      value: user?.affiliationGrade || "Bronze",
      icon: Gift,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Programme d'Affiliation</h1>
        <p className="text-muted-foreground">Invitez vos amis et gagnez des commissions sur chaque dépôt.</p>
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
            <CardTitle>Votre Lien de Parrainage</CardTitle>
            <CardDescription>Partagez ce lien pour commencer à gagner des commissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="font-semibold text-sm">Comment ça marche ?</h4>
              <div className="grid gap-4">
                {[
                  { step: "1", text: "Partagez votre lien unique avec votre réseau." },
                  { step: "2", text: "Vos amis s'inscrivent et louent des machines." },
                  { step: "3", text: "Recevez 10% de commission sur chaque investissement." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {item.step}
                    </span>
                    <p className="text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Niveaux d'Affiliation</CardTitle>
            <CardDescription>Augmentez votre grade pour débloquer plus d'avantages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { grade: "Bronze", requirement: "0-5 Affiliés", commission: "10%", active: user?.affiliationGrade === "Bronze" },
                { grade: "Silver", requirement: "6-20 Affiliés", commission: "12%", active: user?.affiliationGrade === "Silver" },
                { grade: "Gold", requirement: "21-50 Affiliés", commission: "15%", active: user?.affiliationGrade === "Gold" },
                { grade: "Platinum", requirement: "50+ Affiliés", commission: "20%", active: user?.affiliationGrade === "Platinum" },
              ].map((tier) => (
                <div 
                  key={tier.grade} 
                  className={`p-4 rounded-xl border transition-all ${
                    tier.active 
                      ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10" 
                      : "bg-white/[0.01] border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${tier.active ? "text-primary" : ""}`}>{tier.grade}</span>
                    <Badge variant={tier.active ? "default" : "outline"}>{tier.commission}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{tier.requirement}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}