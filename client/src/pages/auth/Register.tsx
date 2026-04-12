import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { Loader2, Star, ArrowRight, CheckCircle } from "lucide-react";
import logoImg from "@assets/generated_images/blockmint_modern_crypto_mining_logo.png";

const registerSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  referralCode: z.string().optional(),
});

export default function Register() {
  const { register } = useAuth();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", referralCode: "" },
  });

  function onSubmit(data: z.infer<typeof registerSchema>) {
    register.mutate(data);
  }

  const benefits = [
    "Inscription en moins d'une minute",
    "Gains dès le premier dépôt",
    "Promo -50% sur les achats de machines",
    "Support disponible 24h/24",
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — Form */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center p-1">
              <img src={logoImg} alt="BlockMint" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg">Block<span className="text-emerald-400">Mint</span></span>
          </Link>

          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/20 mb-4">
              <Star className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Offre promo -50% active</span>
            </div>
            <h1 className="text-2xl font-display font-bold mb-1.5">Créer un compte</h1>
            <p className="text-sm text-muted-foreground">Commencez à miner en moins de 2 minutes.</p>
          </div>

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
                        className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-muted-foreground/40"
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
                        className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">
                      Code de parrainage <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="REF123"
                        {...field}
                        className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-emerald-500/50 focus:ring-emerald-500/20 placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 font-semibold text-[15px] gap-2 mt-2"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Benefits */}
      <div className="hidden lg:flex relative overflow-hidden" style={{ background: 'hsl(220 40% 6%)' }}>
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-emerald-500/6 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-14 py-16">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Pourquoi BlockMint ?</p>
            <h2 className="text-3xl font-display font-bold mb-4 leading-tight">
              Rejoignez la communauté<br />des mineurs rentables.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Des milliers d'investisseurs font confiance à BlockMint pour générer des revenus passifs stables et transparents.
            </p>
          </div>

          <div className="space-y-3 mb-10">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-foreground/70">{b}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Promotion limitée</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Profitez de -50% sur tous les achats de machines. Offre valable pendant une durée limitée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
