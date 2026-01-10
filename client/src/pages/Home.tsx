import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMachines } from "@/hooks/use-platform";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Calculator, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const { data: machines } = useMachines();
  const [calcAmount, setCalcAmount] = useState([1000]);
  const [selectedDuration, setSelectedDuration] = useState(30);

  // Simple calculation logic for demo based on official data
  const maintenanceFee = 0.4;
  const electricityFee = 0.5;
  const dailyRate = 2.5; // Average rate
  const netDailyRate = dailyRate - maintenanceFee - electricityFee;
  const dailyProfit = (calcAmount[0] * netDailyRate) / 100;
  const totalProfit = dailyProfit * selectedDuration;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary/50 border border-white/5 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Live Mining Operations Active</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-tight">
              Minez le Futur avec <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300 text-glow">
                BlockMint
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
              Louez ou achetez une machine de minage et commencez à générer des gains chaque jour ! 
              Solutions flexibles avec progression de retrait ou achat permanent.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-xl shadow-primary/20">
                  Commencer Maintenant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard/machines">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-white/5 border-white/10 hover:bg-white/10">
                  Voir le Catalogue
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Utilisateurs Actifs", value: "12,450+" },
              { label: "Gains Distribués", value: "$4.2M+" },
              { label: "Puissance Totale", value: "85.2 PH/s" },
              { label: "Uptime Système", value: "99.99%" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-display font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Machines Showcase */}
      <section id="machines" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Choose Your Hardware</h2>
            <p className="text-muted-foreground">Select a plan that fits your investment goals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {machines?.map((machine, idx) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-2xl p-8 relative hover:-translate-y-2 transition-transform duration-300"
              >
                {machine.name === 'Pro' && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
                    POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold font-display mb-2">{machine.name}</h3>
                <div className="flex items-baseline space-x-1 mb-6">
                  <span className="text-4xl font-bold text-primary">${machine.minDeposit}</span>
                  <span className="text-muted-foreground">min deposit</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily Rate</span>
                    <span className="font-semibold text-emerald-400">{machine.dailyRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold">{machine.durationDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hardware</span>
                    <span className="font-semibold">ASIC S{19 + idx} Pro</span>
                  </div>
                </div>

                <Link href="/register">
                  <Button className="w-full" variant={idx === 1 ? 'default' : 'secondary'}>
                    Invest Now
                  </Button>
                </Link>
              </motion.div>
            ))}
            
            {/* Fallback if no machines loaded yet */}
            {!machines && [1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="py-24 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-primary/20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4 flex items-center justify-center gap-3">
                <Calculator className="w-8 h-8 text-primary" />
                Profit Calculator
              </h2>
              <p className="text-muted-foreground">Estimate your potential returns based on current difficulty.</p>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-lg font-medium">Investment Amount</label>
                  <span className="text-2xl font-bold text-primary">${calcAmount[0]}</span>
                </div>
                <Slider 
                  value={calcAmount} 
                  onValueChange={setCalcAmount} 
                  max={10000} 
                  min={100} 
                  step={100} 
                  className="py-4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl bg-background/50 border border-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Daily Profit</div>
                  <div className="text-3xl font-bold text-emerald-400">${dailyProfit.toFixed(2)}</div>
                </div>
                <div className="p-6 rounded-2xl bg-background/50 border border-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Total Return (30 Days)</div>
                  <div className="text-3xl font-bold text-emerald-400">${totalProfit.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-white/5 bg-white/[0.02] p-8">
              <Zap className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-display font-bold mb-4">Mode Location</h3>
              <p className="text-muted-foreground mb-6">
                Payez l'abonnement mensuel et un dépôt minimum de 30 $ pour activer votre machine. 
                La barre de progression vous indique quand vous pouvez retirer avec des frais réduits (4%).
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Frais électricité & maintenance : $3/mois</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Gains générés quotidiennement</li>
              </ul>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] p-8">
              <ShieldCheck className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-display font-bold mb-4">Mode Achat</h3>
              <p className="text-muted-foreground mb-6">
                Paiement unique pour une machine permanente avec un rendement supérieur. 
                Aucun autre dépôt requis. Retraits simples à 4%.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Rendement élevé : 2.8% à 4.3%</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Machine permanente</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 BlockMint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
