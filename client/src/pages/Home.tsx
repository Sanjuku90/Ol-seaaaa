import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  ChevronDown,
  CheckCircle,
  Clock,
  BarChart3,
  Lock,
  Globe,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import CountUp from "react-countup";
import logoImg from "@assets/generated_images/blockmint_modern_crypto_mining_logo.png";

export default function Home() {
  const [calcAmount, setCalcAmount] = useState([500]);
  const dailyRate = 2.5;
  const netDaily = (calcAmount[0] * dailyRate) / 100;
  const monthly = netDaily * 30;

  const stats = [
    { value: 12450, suffix: "+", label: "Investisseurs actifs" },
    { value: 4.2, prefix: "$", suffix: "M+", label: "Gains distribués" },
    { value: 99.99, suffix: "%", label: "Disponibilité système" },
    { value: 3, suffix: " ans", label: "D'expérience" },
  ];

  const features = [
    {
      icon: Zap,
      title: "Mode Location",
      desc: "Accès immédiat à une machine de minage moyennant un abonnement mensuel et un dépôt minimum. Idéal pour débuter.",
      points: ["Dépôt min. 30 $", "Gains quotidiens", "Frais maintenance 3$/mois"],
      color: "text-amber-400",
      bg: "bg-amber-400/8",
      border: "border-amber-400/15",
    },
    {
      icon: Shield,
      title: "Mode Achat",
      desc: "Paiement unique pour devenir propriétaire de votre machine. Rendement supérieur et retraits simplifiés à 4%.",
      points: ["Paiement unique", "Rendement 2.8–4.3%/jour", "Machine permanente"],
      color: "text-emerald-400",
      bg: "bg-emerald-400/8",
      border: "border-emerald-400/15",
    },
  ];

  const steps = [
    { n: "01", title: "Créez votre compte", desc: "Inscription en moins d'une minute, sans vérification complexe." },
    { n: "02", title: "Déposez des fonds", desc: "Envoyez votre dépôt en USDT TRC20, ERC20, Bitcoin ou BNB." },
    { n: "03", title: "Choisissez une machine", desc: "Location ou achat selon votre budget et vos objectifs." },
    { n: "04", title: "Percevez vos gains", desc: "Les revenus s'accumulent chaque jour et sont retirables à tout moment." },
  ];

  const faqs = [
    { q: "Quel est le dépôt minimum ?", a: "Pour les machines en location, le dépôt minimum est de 10 $. Pour les achats, le prix de départ est de 90 $ (après promo -50%)." },
    { q: "Comment sont calculés les gains ?", a: "Les gains sont calculés quotidiennement en fonction du taux journalier de chaque machine (entre 1.90% et 4.30% selon le modèle)." },
    { q: "Quels sont les frais de retrait ?", a: "Les frais de retrait sont de 4% une fois la maturité atteinte, et de 19% avant maturité." },
    { q: "Quelles cryptomonnaies sont acceptées ?", a: "Nous acceptons USDT TRC20, USDT ERC20, Bitcoin et BNB BEP20." },
    { q: "Puis-je avoir plusieurs machines ?", a: "Oui, vous pouvez activer jusqu'à 2 machines du même type, et autant de types différents que vous souhaitez." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Opérations de minage actives</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-6">
            Générez des revenus passifs{" "}
            <span className="text-gradient">chaque jour</span>
          </h1>

          <p className="max-w-xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            Louez ou achetez une machine de minage cloud et commencez à percevoir des gains dès aujourd'hui. Transparent, sécurisé, rentable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/register">
              <Button size="lg" className="h-12 px-7 bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/25 font-semibold gap-2 text-[15px]">
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 px-7 border-white/10 hover:bg-white/[0.04] text-muted-foreground hover:text-foreground gap-2 text-[15px]">
                Comment ça marche
                <ChevronDown className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/60">
            {["SSL sécurisé", "Retraits sous 48h", "Support 24/7", "Promo -50% actuelle"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500/60" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.05] bg-white/[0.015]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/[0.05]">
            {stats.map((s, i) => (
              <div key={i} className="text-center lg:px-8">
                <div className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                  <CountUp
                    end={s.value}
                    decimals={s.value % 1 !== 0 ? 2 : 0}
                    duration={2.2}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    enableScrollSpy
                    scrollSpyDelay={200}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="machines" className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Nos offres</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Deux façons d'investir</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Choisissez la formule qui correspond à votre profil d'investisseur.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`rounded-2xl p-7 border ${f.border} ${f.bg} relative overflow-hidden`}>
                <div className={`inline-flex p-2.5 rounded-xl ${f.bg} border ${f.border} mb-5`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.desc}</p>
                <ul className="space-y-2">
                  {f.points.map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${f.color} flex-shrink-0`} />
                      <span className="text-foreground/80">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/dashboard/machines">
              <Button variant="outline" className="border-white/10 hover:bg-white/[0.04] gap-2">
                Voir tout le catalogue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white/[0.015] border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Processus</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Démarrer en 4 étapes</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-3xl font-display font-black text-emerald-500/20 mb-4">{s.n}</div>
                  <h3 className="font-display font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Simulateur</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Estimez vos gains</h2>
            <p className="text-muted-foreground">Calculez vos revenus potentiels selon votre investissement.</p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 md:p-10">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-muted-foreground">Montant investi</span>
                <span className="text-2xl font-display font-bold text-emerald-400">${calcAmount[0].toLocaleString()}</span>
              </div>
              <Slider
                value={calcAmount}
                onValueChange={setCalcAmount}
                max={10000}
                min={30}
                step={10}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground/50 mt-1">
                <span>$30</span>
                <span>$10 000</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5 bg-emerald-500/5 border border-emerald-500/10 text-center">
                <BarChart3 className="w-4 h-4 text-emerald-400/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Gain journalier estimé</p>
                <p className="text-2xl font-display font-bold text-emerald-400">${netDaily.toFixed(2)}</p>
              </div>
              <div className="rounded-xl p-5 bg-emerald-500/5 border border-emerald-500/10 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-400/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Gain mensuel estimé</p>
                <p className="text-2xl font-display font-bold text-emerald-400">${monthly.toFixed(2)}</p>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground/40 mt-4">
              * Estimation basée sur un taux moyen de 2.5%/jour. Résultats non garantis.
            </p>

            <Link href="/register">
              <Button className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 font-semibold gap-2">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why BlockMint */}
      <section className="py-24 bg-white/[0.015] border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Pourquoi nous</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Conçu pour la performance</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Lock, title: "Sécurisé", desc: "Infrastructure chiffrée SSL, fonds protégés, authentification robuste." },
              { icon: Clock, title: "Retraits rapides", desc: "Demandes traitées en moins de 48h, 7j/7 sur toutes les cryptos acceptées." },
              { icon: Globe, title: "Disponible 24h/24", desc: "Vos machines minent en continu sans interruption, génération automatique des gains." },
              { icon: BarChart3, title: "Rendements compétitifs", desc: "Jusqu'à 4.30% de rendement journalier avec les machines Elite." },
              { icon: Shield, title: "Transparent", desc: "Historique complet de vos transactions, gains et retraits accessible à tout moment." },
              { icon: Star, title: "Programme d'affiliation", desc: "Gagnez des commissions en parrainant de nouveaux investisseurs sur la plateforme." },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-6 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.035] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
                  <item.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Questions fréquentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-semibold hover:text-foreground text-foreground/90 transition-colors">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/[0.04] pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-10 md:p-14 relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Star className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Promo -50% sur les achats</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Prêt à commencer ?</h2>
              <p className="text-muted-foreground mb-8">Rejoignez des milliers d'investisseurs qui génèrent des revenus quotidiens avec BlockMint.</p>
              <Link href="/register">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20 font-semibold gap-2 h-12 px-8">
                  Créer mon compte
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md overflow-hidden bg-emerald-500/10 flex items-center justify-center p-0.5">
                <img src={logoImg} alt="BlockMint" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold text-sm">Block<span className="text-emerald-400">Mint</span></span>
            </div>
            <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} BlockMint. Tous droits réservés.</p>
            <div className="flex items-center gap-5 text-xs text-muted-foreground/50">
              <a href="#" className="hover:text-muted-foreground transition-colors">Conditions</a>
              <a href="#" className="hover:text-muted-foreground transition-colors">Confidentialité</a>
              <Link href="/dashboard/support" className="hover:text-muted-foreground transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
