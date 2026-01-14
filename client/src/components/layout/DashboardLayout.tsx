import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Cpu, 
  Wallet, 
  Users, 
  MessageSquare,
  Settings, 
  ShieldCheck,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null; // Or loading spinner, but auth hook handles redirects

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Machines', href: '/dashboard/machines', icon: Cpu },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'KYC', href: '/dashboard/kyc', icon: ShieldCheck },
    { name: 'Affiliate', href: '/dashboard/affiliate', icon: Users },
    { name: 'Support', href: '/dashboard/support', icon: MessageSquare },
  ];

  if (user.isAdmin) {
    navigation.push({ name: 'Admin Space', href: '/admin/users', icon: Settings });
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Block<span className="text-primary">Mint</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2 py-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center p-4 bg-secondary/50 rounded-xl mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground truncate">Balance: ${Number(user.balance).toFixed(2)}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive/50"
          onClick={() => logout.mutate()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 fixed inset-y-0 z-50">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card border-border">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-20 lg:pt-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
