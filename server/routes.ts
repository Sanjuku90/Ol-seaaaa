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
    const contracts = await storage.getContracts(req.user!.id);
    res.json(contracts);
  });

  app.post(api.contracts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.contracts.create.input.parse(req.body);
      
      // Basic validation logic (check balance would go here)
      const contract = await storage.createContract(
        req.user!.id, 
        input.machineId, 
        input.amount, 
        input.autoReinvest
      );
      
      res.status(201).json(contract);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Transactions
  app.get(api.transactions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const txs = await storage.getTransactions(req.user!.id);
    res.json(txs);
  });

  app.post(api.transactions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction(req.user!.id, input.type, input.amount);
      res.status(201).json(tx);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
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
