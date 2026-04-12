import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Cpu,
  Wallet,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logoImg from "@assets/generated_images/blockmint_modern_crypto_mining_logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mes Machines', href: '/dashboard/machines', icon: Cpu },
    { name: 'Portefeuille', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Affiliation', href: '/dashboard/affiliate', icon: Users },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
    { name: 'Support', href: '/dashboard/support', icon: MessageSquare },
  ];

  if (user.isAdmin) {
    navigation.push({ name: 'Administration', href: '/admin/users', icon: Shield });
  }

  const initials = user.email.substring(0, 2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'hsl(220 40% 6%)', borderRight: '1px solid hsl(218 25% 11%)' }}>
      <div className="px-5 py-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-500/10 flex items-center justify-center p-1 ring-1 ring-emerald-500/20">
            <img src={logoImg} alt="BlockMint" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-[17px] tracking-tight">
            Block<span className="text-emerald-400">Mint</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Navigation</p>
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}>
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-emerald-400" : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400/50" />}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/[0.05] space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.03] ring-1 ring-white/[0.05]">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-emerald-400">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-[11px] text-emerald-400 font-medium">${Number(user.balance).toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block w-64 fixed inset-y-0 z-50">
        <SidebarContent />
      </div>

      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-card border-border shadow-lg">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 lg:pl-64 w-full">
        <div className="max-w-6xl mx-auto p-4 md:p-7 pt-16 lg:pt-7 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
