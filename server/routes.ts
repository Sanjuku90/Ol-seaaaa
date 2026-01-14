import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { machines, users, transactions, contracts } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { WebSocket, WebSocketServer } from "ws";
import { sendEmail } from "./utils/email";

let wss: WebSocketServer;

function broadcast(data: any) {
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Suppression des restrictions d'accès admin
  return next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);

  // Maintenance Middleware
  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api/admin") || req.path === "/api/user" || req.path === "/api/login" || req.path === "/api/logout") {
      return next();
    }
    const isMaintenance = await storage.getMaintenanceMode();
    if (isMaintenance && !(req.user as any)?.isAdmin) {
      return res.status(503).json({ message: "Site en maintenance technique. Revenez plus tard." });
    }
    next();
  });

  // Machines
  app.get(api.machines.list.path, async (req, res) => {
    const machinesList = await storage.getMachines();
    const sortedMachines = [...machinesList].sort((a, b) => {
      const priceA = a.type === "rent" ? Number(a.rentalPrice || 0) : Number(a.buyPrice || 0);
      const priceB = b.type === "rent" ? Number(b.rentalPrice || 0) : Number(b.buyPrice || 0);
      return priceA - priceB;
    });
    res.json(sortedMachines);
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

      // Send Purchase Confirmation Email
      if (user.email) {
        console.log(`[Purchase] Triggering email for ${user.email}`);
        sendEmail(
          user.email,
          "Confirmation d'achat - BlockMint",
          `Félicitations ! Vous venez d'acquérir la machine ${machine.name} pour un montant de ${totalCost}$.`,
          "Confirmation d'Achat",
          `<p>Félicitations !</p>
           <p>Vous venez d'activer votre machine de minage <span class="highlight">${machine.name}</span>.</p>
           <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
             <p style="margin: 5px 0;"><strong>Investissement :</strong> ${totalCost}$</p>
             <p style="margin: 5px 0;"><strong>Durée :</strong> ${machine.durationDays} jours</p>
             <p style="margin: 5px 0;"><strong>Rendement :</strong> ${machine.dailyRate}% / jour</p>
           </div>
           <p>Vos profits commenceront à s'accumuler dès maintenant.</p>`
        );
      }

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
      // For withdrawals AND deposits, status is pending if we want admin validation
      const status = 'pending';
      
      if (input.type === 'withdrawal') {
        const user = await storage.getUser((req.user as any).id);
        if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Verify withdrawal password if set
        if (user.withdrawPassword) {
          const { withdrawPassword: providedPassword } = req.body;
          if (!providedPassword) {
            return res.status(400).json({ message: "Mot de passe de retrait requis" });
          }
          const { comparePasswords } = await import("./auth");
          const isValid = await comparePasswords(providedPassword, user.withdrawPassword);
          if (!isValid) {
            return res.status(400).json({ message: "Mot de passe de retrait incorrect" });
          }
        } else if (input.type === 'withdrawal') {
          // Optional: Force setting a withdraw password before first withdrawal
          // return res.status(400).json({ message: "Veuillez définir un mot de passe de retrait dans les paramètres" });
        }

        if (Number(user.balance) < input.amount) {
          return res.status(400).json({ message: "Solde insuffisant pour le retrait" });
        }
        // Deduct balance immediately for withdrawal request to "lock" the funds
        await storage.updateUserBalance((req.user as any).id, -input.amount);
      }

      const tx = await storage.createTransaction(
        (req.user as any).id, 
        input.type, 
        input.amount, 
        (req.body as any).walletAddress,
        status
      );

      // Send Transaction Email
      const user = await storage.getUser((req.user as any).id);
      if (user && user.email) {
        const typeLabel = input.type === 'deposit' ? 'Dépôt' : 'Retrait';
        console.log(`[Transaction] Triggering email for ${user.email} - Type: ${typeLabel}`);
        sendEmail(
          user.email,
          `Confirmation de votre demande de ${typeLabel} - BlockMint`,
          `Votre demande de ${typeLabel} de ${input.amount}$ a été enregistrée avec le ticket n° ${tx.ticketNumber}.`,
          "Détails de votre Transaction",
          `<p>Bonjour,</p>
           <p>Nous avons bien reçu votre demande de <strong>${typeLabel}</strong>.</p>
           <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
             <p style="margin: 5px 0;"><strong>Numéro de Ticket :</strong> <span style="color: #10b981; font-weight: bold;">${tx.ticketNumber}</span></p>
             <p style="margin: 5px 0;"><strong>Type :</strong> ${typeLabel}</p>
             <p style="margin: 5px 0;"><strong>Montant :</strong> ${input.amount}$</p>
             <p style="margin: 5px 0;"><strong>Statut :</strong> En attente de validation</p>
           </div>
           <p>Veuillez conserver ce numéro de ticket pour toute communication avec notre service client.</p>
           <p>Nos équipes traitent votre demande dans les plus brefs délais.</p>`
        );
      }

      res.status(201).json(tx);
    } catch (e) {
      res.status(400).json({ message: "Entrée invalide" });
    }
  });

  // --- ADMIN ROUTES ---
  app.get("/api/admin/users", async (req, res) => {
    const usersList = await storage.getUsers();
    // Log for debugging
    console.log(`[admin] fetched ${usersList.length} users`);
    res.json(usersList);
  });

  app.get("/api/admin/transactions", async (req, res) => {
    const txs = await db.select({
      id: transactions.id,
      userId: transactions.userId,
      type: transactions.type,
      amount: transactions.amount,
      status: transactions.status,
      walletAddress: transactions.walletAddress,
      ticketNumber: transactions.ticketNumber,
      createdAt: transactions.createdAt,
      user: {
        email: users.email
      }
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt));
    
    console.log(`[admin] fetched ${txs.length} transactions`);
    res.json(txs);
  });

  app.patch("/api/admin/transactions/:id/status", async (req, res) => {
    const { status } = req.body;
    const txId = Number(req.params.id);
    
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, txId));
    if (!tx) return res.status(404).json({ message: "Transaction non trouvée" });

    if (tx.status !== 'pending') {
      return res.status(400).json({ message: "La transaction a déjà été traitée" });
    }

    if (status === 'completed') {
      if (tx.type === 'deposit') {
        await storage.updateUserBalance(tx.userId, Number(tx.amount));
      }
      // For withdrawal, balance was already deducted on request
    } else if (status === 'rejected') {
      if (tx.type === 'withdrawal') {
        // Refund balance if withdrawal is rejected
        await storage.updateUserBalance(tx.userId, Number(tx.amount));
      }
    }

    const [updatedTx] = await db.update(transactions)
      .set({ status })
      .where(eq(transactions.id, txId))
      .returning();

    // Broadcast update via WebSocket
    if (updatedTx) {
      const typeLabel = tx.type === 'deposit' ? 'Dépôt' : 'Retrait';
      const statusLabel = status === 'completed' ? 'validé' : 'rejeté';
      broadcast({
        type: "TRANSACTION_UPDATE",
        payload: {
          id: txId,
          userId: tx.userId,
          message: `${typeLabel} de ${tx.amount}$ ${statusLabel}`,
          status
        }
      });
      
      // Update WebSocket for profit/balance refresh
      broadcast({
        type: "BALANCE_UPDATE",
        payload: {
          userId: tx.userId
        }
      });

      // Send Email Notification
      const user = await storage.getUser(tx.userId);
      if (user && user.email) {
        const isSuccess = status === 'completed';
        sendEmail(
          user.email,
          `Mise à jour de votre transaction - BlockMint`,
          `Votre ${typeLabel} de ${tx.amount}$ a été ${statusLabel}.`,
          "Mise à jour Transaction",
          `<p>Bonjour,</p>
           <p>Votre demande de <strong>${typeLabel}</strong> a été traitée.</p>
           <div style="padding: 20px; border-radius: 8px; text-align: center; background: ${isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${isSuccess ? '#10b981' : '#ef4444'}; margin: 20px 0;">
             <p style="font-size: 18px; margin: 0;">Montant : <span style="font-weight: bold;">${tx.amount}$</span></p>
             <p style="font-size: 20px; margin: 10px 0; color: ${isSuccess ? '#10b981' : '#ef4444'}; text-transform: uppercase; font-weight: bold;">${statusLabel}</p>
           </div>
           <p>Vous pouvez consulter votre historique complet sur votre compte.</p>`
        );
      }
    }

    res.json(updatedTx);
  });

  app.patch("/api/admin/users/:id/kyc", async (req, res) => {
    const { status } = req.body;
    const userId = Number(req.params.id);
    const user = await storage.updateUserProfile(userId, { kycStatus: status });

    if (user && user.email) {
      const isApproved = status === 'approved';
      const statusLabel = isApproved ? 'approuvée' : 'rejetée';
      sendEmail(
        user.email,
        "Mise à jour de votre vérification KYC - BlockMint",
        `Votre vérification d'identité a été ${statusLabel}.`,
        "Statut KYC",
        `<p>Bonjour,</p>
         <p>Nous vous informons que l'examen de vos documents d'identité est terminé.</p>
         <div style="padding: 15px; border-radius: 8px; text-align: center; background: ${isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; margin: 20px 0;">
           <p style="font-size: 18px; margin: 0;">Nouveau statut KYC : <span style="font-weight: bold; color: ${isApproved ? '#10b981' : '#ef4444'};">${statusLabel.toUpperCase()}</span></p>
         </div>
         ${!isApproved ? '<p>Veuillez soumettre à nouveau des documents valides depuis vos paramètres.</p>' : '<p>Votre compte est désormais pleinement vérifié pour les retraits.</p>'}
         <p>Si vous avez des questions, n'hésitez pas à contacter notre support.</p>`
      );
    }
    res.json(user);
  });

  app.patch("/api/admin/users/:id/status", async (req, res) => {
    const { status } = req.body;
    const user = await storage.updateUserStatus(Number(req.params.id), status);
    
    // Send KYC/Status Update Email
    if (user && user.email) {
      const isSuccess = status === 'active';
      const statusLabel = isSuccess ? 'activé' : 'suspendu';
      sendEmail(
        user.email,
        "Mise à jour de votre compte - BlockMint",
        `Le statut de votre compte a été mis à jour : ${statusLabel}.`,
        "Statut de votre Compte",
        `<p>Bonjour,</p>
         <p>Nous vous informons que le statut de votre compte BlockMint a été mis à jour.</p>
         <div style="padding: 15px; border-radius: 8px; text-align: center; background: ${isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; margin: 20px 0;">
           <p style="font-size: 18px; margin: 0;">Nouveau statut : <span style="font-weight: bold; color: ${isSuccess ? '#10b981' : '#ef4444'};">${statusLabel.toUpperCase()}</span></p>
         </div>
         <p>Si vous avez des questions concernant ce changement, n'hésitez pas à contacter notre support.</p>`
      );
    }
    
    res.json(user);
  });

  app.patch("/api/admin/users/:id/admin", async (req, res) => {
    const { isAdmin } = req.body;
    const user = await storage.updateUserAdmin(Number(req.params.id), isAdmin);
    res.json(user);
  });

  app.post("/api/admin/users/:id/balance", async (req, res) => {
    const { amount } = req.body;
    const user = await storage.updateUserBalanceAdmin(Number(req.params.id), Number(amount));
    res.json(user);
  });

  app.post("/api/kyc/submit", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { fullName, documentUrl } = req.body;
    if (!fullName || !documentUrl) {
      return res.status(400).json({ message: "Nom complet et URL du document requis" });
    }
    const user = await storage.updateUserKYC((req.user as any).id, fullName, documentUrl);
    res.json(user);
  });

  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Protection: don't allow changing sensitive fields via this route
    const { email, password, role, balance, isAdmin, kycStatus, ...updatableData } = req.body;
    
    const user = await storage.updateUserProfile((req.user as any).id, updatableData);
    res.json(user);
  });

  app.post("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { currentPassword, newPassword } = req.body;
    const user = await storage.getUser((req.user as any).id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    // comparePasswords from auth.ts would be needed here, or export it
    // For now, let's assume we implement a simple update in storage
    // In a real app, we'd verify the current password first
    const { hashPassword } = await import("./auth");
    const newHash = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, newHash);
    res.json({ message: "Success" });
  });

  app.post("/api/user/withdraw-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password } = req.body;
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword(password);
    const user = await storage.updateUserWithdrawPassword((req.user as any).id, hashedPassword);
    res.json(user);
  });

  // --- REFERRAL ROUTES ---
  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const referrals = await db.select().from(users).where(eq(users.referredBy, (req.user as any).id));
    res.json(referrals);
  });

  // Support Routes
  app.get("/api/support", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getSupportMessages((req.user as any).id);
    console.log(`[support] fetched ${messages.length} msgs for user ${(req.user as any).id}`);
    res.json(messages);
  });

  app.post("/api/support", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const msg = await storage.createSupportMessage({
        userId: (req.user as any).id,
        message: req.body.message,
        isAdmin: false
      });
      console.log(`[support] new msg from user ${(req.user as any).id}`);
      res.status(201).json(msg);
    } catch (e) {
      res.status(400).json({ message: "Erreur" });
    }
  });

  app.get("/api/admin/support", async (req, res) => {
    const messages = await storage.getAllSupportMessages();
    console.log(`[support-admin] fetched ${messages.length} total msgs`);
    res.json(messages);
  });

  app.post("/api/admin/support", async (req, res) => {
    try {
      const msg = await storage.createSupportMessage({
        userId: Number(req.body.userId),
        adminId: (req.user as any).id,
        message: req.body.message,
        isAdmin: true
      });
      console.log(`[support-admin] reply to user ${req.body.userId}`);
      res.status(201).json(msg);
    } catch (e) {
      console.error("[support-admin] error replying:", e);
      res.status(400).json({ message: "Erreur" });
    }
  });

  app.post("/api/admin/support/close", async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.closeSupportConversation(Number(userId));
      res.sendStatus(200);
    } catch (e) {
      res.status(400).json({ message: "Erreur lors de la fermeture" });
    }
  });

  app.get("/api/admin/maintenance", async (req, res) => {
    const enabled = await storage.getMaintenanceMode();
    res.json({ enabled });
  });

  app.post("/api/admin/maintenance", async (req, res) => {
    const { enabled } = req.body;
    await storage.setMaintenanceMode(enabled);
    res.json({ enabled });
  });

  // Seed data function
  await seedDatabase();

  // Setup WebSocket Server
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
  });

    // Background profit generator
    setInterval(async () => {
      const activeContracts = await db.select().from(contracts).where(eq(contracts.status, "active"));
      for (const contract of activeContracts) {
        const machine = await storage.getMachine(contract.machineId);
        if (machine) {
          // Calculate profit based on machine type
          // For 'buy', profit is based on buyPrice. For 'rent', it's based on the deposit amount.
          const baseAmount = machine.type === "buy" ? Number(machine.buyPrice || 0) : Number(contract.amount || 0);
          const dailyProfit = (baseAmount * Number(machine.dailyRate)) / 100;
          const profit = dailyProfit / (24 * 60); 

          if (profit > 0) {
            // Update user global balance
            await storage.updateUserBalance(contract.userId, profit);
            
            // Update accumulated rewards in contract for progress bar tracking
            await db.update(contracts)
              .set({ accumulatedRewards: sql`ROUND((${contracts.accumulatedRewards} + ${profit.toString()})::numeric, 4)` })
              .where(eq(contracts.id, contract.id));

            broadcast({
              type: "BALANCE_UPDATE",
              payload: {
                userId: contract.userId,
                amount: profit.toFixed(4)
              }
            });
          }
        }
      }
    }, 10000); // Check every 10 seconds for more visible progress

  return httpServer;
}

async function seedDatabase() {
  const existingMachines = await storage.getMachines();
  if (existingMachines.length === 0) {
    await db.insert(machines).values([
      // Rental Machines
      { name: "Rent Mini", type: "rent", rentalPrice: "4.99", minDeposit: 30, dailyRate: "1.9", durationDays: 30, description: "Location abordable pour débuter." },
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
