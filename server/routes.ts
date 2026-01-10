import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { machines, users } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Accès refusé. Droits administrateur requis." });
}

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

      const existingContracts = await storage.getContracts((req.user as any).id);
      const machineContracts = existingContracts.filter(c => c.machineId === input.machineId && c.status === "active");
      if (machineContracts.length >= 2) {
        return res.status(400).json({ message: "Vous avez déjà atteint la limite de 2 machines de ce type." });
      }

      const totalCost = machine.type === "rent" ? Number(machine.rentalPrice) + input.amount : Number(machine.buyPrice);

      if (Number(user.balance) < totalCost) {
        return res.status(400).json({ message: "Solde insuffisant pour effectuer cet achat." });
      }

      if (machine.type === "rent" && input.amount < machine.minDeposit) {
        return res.status(400).json({ message: `Le montant minimum pour cette machine est de ${machine.minDeposit} $` });
      }
      
      // Deduct balance
      await storage.updateUserBalance((req.user as any).id, -totalCost);

      const contract = await storage.createContract(
        (req.user as any).id, 
        input.machineId, 
        input.amount, 
        input.autoReinvest
      );

      // Create transaction record
      await storage.createTransaction((req.user as any).id, "purchase", totalCost);
      
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

  // --- ADMIN ROUTES ---
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const usersList = await storage.getUsers();
    res.json(usersList);
  });

  app.patch("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    const { status } = req.body;
    const user = await storage.updateUserStatus(Number(req.params.id), status);
    res.json(user);
  });

  app.patch("/api/admin/users/:id/admin", isAdmin, async (req, res) => {
    const { isAdmin } = req.body;
    const user = await storage.updateUserAdmin(Number(req.params.id), isAdmin);
    res.json(user);
  });

  app.post("/api/admin/users/:id/balance", isAdmin, async (req, res) => {
    const { amount } = req.body;
    const user = await storage.updateUserBalanceAdmin(Number(req.params.id), Number(amount));
    res.json(user);
  });

  // Seed data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingMachines = await storage.getMachines();
  if (existingMachines.length === 0) {
    await db.insert(machines).values([
      // Rental Machines
      { name: "Rent Mini", type: "rent", rentalPrice: "4.99", minDeposit: 30, dailyRate: "2.3", durationDays: 30, description: "Location abordable pour débuter." },
      { name: "Rent Starter", type: "rent", rentalPrice: "14.99", minDeposit: 30, dailyRate: "2.3", durationDays: 30, description: "Idéal pour booster vos premiers gains." },
      { name: "Rent Standard", type: "rent", rentalPrice: "24.99", minDeposit: 30, dailyRate: "2.8", durationDays: 30, description: "Bon équilibre entre coût et rendement." },
      { name: "Rent Pro", type: "rent", rentalPrice: "29.99", minDeposit: 30, dailyRate: "3.3", durationDays: 30, description: "Pour les mineurs avertis." },
      { name: "Rent Elite", type: "rent", rentalPrice: "49.99", minDeposit: 30, dailyRate: "3.8", durationDays: 30, description: "Performance maximale en location." },
      // Purchase Machines
      { name: "Starter Buy", type: "buy", buyPrice: "180", minDeposit: 0, dailyRate: "2.8", durationDays: 365, description: "Achat unique, minage permanent." },
      { name: "Standard Buy", type: "buy", buyPrice: "450", minDeposit: 0, dailyRate: "3.3", durationDays: 365, description: "Rendement supérieur pour investisseurs." },
      { name: "Pro Buy", type: "buy", buyPrice: "1100", minDeposit: 0, dailyRate: "3.8", durationDays: 365, description: "Gains optimisés sur le long terme." },
      { name: "Elite Buy", type: "buy", buyPrice: "2800", minDeposit: 0, dailyRate: "4.3", durationDays: 365, description: "Le top de la performance BlockMint." },
    ]);
  }
}
