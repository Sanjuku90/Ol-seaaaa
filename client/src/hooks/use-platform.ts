import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateContractRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// === MACHINES ===
export function useMachines() {
  return useQuery({
    queryKey: [api.machines.list.path],
    queryFn: async () => {
      const res = await fetch(api.machines.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch machines");
      return api.machines.list.responses[200].parse(await res.json());
    },
  });
}

// === CONTRACTS ===
export function useContracts() {
  return useQuery({
    queryKey: [api.contracts.list.path],
    queryFn: async () => {
      const res = await fetch(api.contracts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return api.contracts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateContractRequest) => {
      const res = await fetch(api.contracts.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message);
        }
        throw new Error("Failed to purchase machine");
      }
      return api.contracts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contracts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] }); // Purchase creates transaction
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] }); // Balance updates
      toast({ title: "Success!", description: "Machine purchased and contract active." });
    },
    onError: (err) => {
      toast({ 
        title: "Purchase failed", 
        description: err instanceof Error ? err.message : "Could not complete purchase",
        variant: "destructive" 
      });
    },
  });
}

// === TRANSACTIONS ===
export function useTransactions() {
  return useQuery({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { type: 'deposit' | 'withdrawal', amount: number }) => {
      const res = await fetch(api.transactions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Transaction failed");
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ 
        title: "Transaction Successful", 
        description: `${data.type === 'deposit' ? 'Deposited' : 'Withdrawn'} $${data.amount}` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Transaction failed. Please try again.", variant: "destructive" });
    },
  });
}

// === STATS ===
export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path);
      if (!res.ok) throw new Error("Failed to load stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}
