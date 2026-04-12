import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Loader2, TrendingUp, Shield, Zap } from "lucide-react";
import logoImg from "@assets/generated_images/blockmint_modern_crypto_mining_logo.png";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export default function Login() {
  const { login } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: z.infer<typeof loginSchema>) {
    login.mutate(data);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — Form */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-violet-500/10 ring-1 ring-violet-500/25 flex items-center justify-center p-1">
              <img src={logoImg} alt="BlockMint" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg">Block<span className="text-gradient">Mint</span></span>
          </Link>

          <h1 className="text-2xl font-display font-bold mb-1.5">Bon retour</h1>
          <p className="text-sm text-muted-foreground mb-8">Connectez-vous pour accéder à votre espace de minage.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="votre@email.com"
                        {...field}
                        className="h-11 bg-violet-500/[0.04] border-violet-500/15 focus:border-violet-500/50 placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="h-11 bg-violet-500/[0.04] border-violet-500/15 focus:border-violet-500/50 placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold text-[15px] mt-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 6px 25px -5px hsl(263 72% 50% / 0.35)' }}
                disabled={login.isPending}
              >
                {login.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Se connecter
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Branding */}
      <div className="hidden lg:flex relative overflow-hidden" style={{ background: 'hsl(258 22% 6%)' }}>
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(263 72% 67% / 0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(220 88% 62% / 0.08) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="relative z-10 flex flex-col justify-center px-14 py-16">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
              style={{ background: 'hsl(263 72% 67% / 0.1)', border: '1px solid hsl(263 72% 67% / 0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-semibold text-violet-300">Plateforme en ligne</span>
            </div>
            <h2 className="text-3xl font-display font-bold mb-4 leading-tight">
              Votre capital travaille<br />pendant que vous dormez.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Rejoignez plus de 12 000 investisseurs qui génèrent des revenus passifs quotidiens avec BlockMint.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: "Jusqu'à 14.3% de rendement journalier", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/15" },
              { icon: Shield, text: "Fonds sécurisés, retraits sous 48h", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/15" },
              { icon: Zap, text: "Gains générés 24h/24, 7j/7", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/15" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-8 h-8 rounded-lg ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="text-foreground/70">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8" style={{ borderTop: '1px solid hsl(255 18% 13%)' }}>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {["E", "M", "A", "L"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full ring-2 ring-background flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(263 72% 67% / 0.2), hsl(220 88% 62% / 0.15))' }}>
                    <span className="text-[10px] font-bold text-violet-300">{l}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/80">+12 450 investisseurs</p>
                <p className="text-[11px] text-muted-foreground">nous font confiance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
