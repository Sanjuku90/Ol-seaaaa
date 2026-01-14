import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Overview from "@/pages/dashboard/Overview";
import Wallet from "@/pages/dashboard/Wallet";
import Machines from "@/pages/dashboard/Machines";
import Affiliate from "@/pages/dashboard/Affiliate";
import Support from "@/pages/dashboard/Support";
import Settings from "@/pages/dashboard/Settings";
import AdminUsers from "@/pages/admin/Users";
import AdminSupport from "@/pages/admin/Support";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminOnly) {
    return <Component />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Overview} />}
      </Route>
      <Route path="/dashboard/wallet">
        {() => <ProtectedRoute component={Wallet} />}
      </Route>
      <Route path="/dashboard/machines">
        {() => <ProtectedRoute component={Machines} />}
      </Route>
      <Route path="/dashboard/affiliate">
        {() => <ProtectedRoute component={Affiliate} />}
      </Route>
      <Route path="/dashboard/support">
        {() => <ProtectedRoute component={Support} />}
      </Route>
      <Route path="/dashboard/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminUsers} adminOnly={true} />}
      </Route>
      <Route path="/admin/">
        {() => <ProtectedRoute component={AdminUsers} adminOnly={true} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} adminOnly={true} />}
      </Route>
      <Route path="/admin/support">
        {() => <Redirect to="/admin/users" />}
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.payload && data.payload.userId === user.id) {
          // Only show notification for transaction updates, not for periodic profit generation
          if (data.type === "TRANSACTION_UPDATE") {
            toast({
              title: "Transaction Mise à Jour",
              description: data.payload.message,
              variant: data.payload.status === "completed" ? "default" : "destructive",
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    return () => socket.close();
  }, [user, toast]);

  return <Router />;
}

export default App;
