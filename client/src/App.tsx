import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Overview from "@/pages/dashboard/Overview";
import Wallet from "@/pages/dashboard/Wallet";
import Machines from "@/pages/dashboard/Machines";
import AdminUsers from "@/pages/admin/Users";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
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

      {/* Admin Routes */}
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} adminOnly={true} />}
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
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
