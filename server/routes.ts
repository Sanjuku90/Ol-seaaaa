import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { machines, users } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);

  // Machines
  app.get(api.machines.list.path, async (req, res) => {
    const machinesList = await storage.getMachines();
    res.json(machinesList);
  });

  // Contracts
  app.get(api.contracts.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const contractsList = await storage.getContracts((req.user as any).id);
    res.json(contractsList);
  });

  app.post(api.contracts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.contracts.create.input.parse(req.body);
      
      const user = await storage.getUser((req.user as any).id);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      
      const machine = await storage.getMachine(input.machineId);
      if (!machine) return res.status(404).json({ message: "Machine non trouvée" });

      if (Number(user.balance) < input.amount) {
        return res.status(400).json({ message: "Solde insuffisant pour effectuer cet achat." });
      }

      if (input.amount < machine.minDeposit) {
        return res.status(400).json({ message: `Le montant minimum pour cette machine est de ${machine.minDeposit} $` });
      }
      
      // Deduct balance
      await storage.updateUserBalance((req.user as any).id, -input.amount);

      const contract = await storage.createContract(
        (req.user as any).id, 
        input.machineId, 
        input.amount, 
        input.autoReinvest
      );

      // Create transaction record
      await storage.createTransaction((req.user as any).id, "purchase", input.amount);
      
      res.status(201).json(contract);
    } catch (e) {
      res.status(400).json({ message: "Entrée invalide" });
    }
  });

  // Transactions
  app.get(api.transactions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const txs = await storage.getTransactions((req.user as any).id);
    res.json(txs);
  });

  app.post(api.transactions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.transactions.create.input.parse(req.body);
      // For withdrawals, status is pending
      const status = input.type === 'withdrawal' ? 'pending' : 'completed';
      
      if (input.type === 'withdrawal') {
        const user = await storage.getUser((req.user as any).id);
        if (!user || Number(user.balance) < input.amount) {
          return res.status(400).json({ message: "Solde insuffisant pour le retrait" });
        }
        // Deduct balance immediately for withdrawal request
        await storage.updateUserBalance((req.user as any).id, -input.amount);
      }

      const tx = await storage.createTransaction(
        (req.user as any).id, 
        input.type, 
        input.amount, 
        (req.body as any).walletAddress,
        status
      );
      res.status(201).json(tx);
    } catch (e) {
      res.status(400).json({ message: "Entrée invalide" });
    }
  });
  
  // Stats
  app.get(api.stats.get.path, async (req, res) => {
    // Mock stats
    res.json({
      totalPower: 4520, // TH/s
      totalDistributed: 1250000, // $
      activeMiners: 850
    });
  });

  // Seed data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingMachines = await storage.getMachines();
  if (existingMachines.length === 0) {
    await db.insert(machines).values([
      { name: "Starter", minDeposit: 20, durationDays: 30, dailyRate: "2.0", maxDailyRate: "2.5" },
      { name: "Standard", minDeposit: 50, durationDays: 60, dailyRate: "2.5", maxDailyRate: "3.0" },
      { name: "Pro", minDeposit: 200, durationDays: 90, dailyRate: "3.0", maxDailyRate: "3.5" },
      { name: "Elite", minDeposit: 500, durationDays: 180, dailyRate: "3.5", maxDailyRate: "4.0" },
      { name: "VIP", minDeposit: 1000, durationDays: 30, dailyRate: "4.0", maxDailyRate: "4.5" },
    ]);
  }
}
