import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import logoImg from "@assets/generated_images/blockmint_modern_crypto_mining_logo.png";

export function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Machines", href: "/#machines" },
    { name: "Calculateur", href: "/#calculator" },
    { name: "FAQ", href: "/#faq" },
  ];

  return (
    <nav className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-300",
      scrolled
        ? "bg-[hsl(222_47%_4%/0.95)] backdrop-blur-xl border-b border-white/[0.06] shadow-xl shadow-black/20"
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-500/10 flex items-center justify-center p-1 ring-1 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all">
              <img src={logoImg} alt="BlockMint" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-[17px] tracking-tight">
              Block<span className="text-emerald-400">Mint</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="nav-link">
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logout.mutate()}
                  className="border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground"
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
                    Connexion
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 font-semibold gap-1">
                    Commencer
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[hsl(222_47%_4%/0.98)] backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button className="w-full justify-start gap-2" variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/10"
                  onClick={() => { logout.mutate(); setIsOpen(false); }}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Connexion</Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white">Commencer</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
