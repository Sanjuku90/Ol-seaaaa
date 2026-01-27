import { db } from "./db";
import {
  users, machines, contracts, transactions, supportMessages, settings,
  type User, type InsertUser, type Machine, type Contract, type Transaction,
  type SupportMessage, type InsertSupportMessage
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { referralCode?: string }): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<void>;
  
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  
  getContracts(userId: number): Promise<(Contract & { machine: Machine })[]>;
  createContract(userId: number, machineId: number, amount: number, autoReinvest: boolean): Promise<Contract>;
  
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(userId: number, type: string, amount: number, walletAddress?: string, status?: string): Promise<Transaction>;
  
  // Admin Methods
  getUsers(): Promise<User[]>;
  updateUserStatus(id: number, status: string): Promise<User>;
  updateUserAdmin(id: number, isAdmin: boolean): Promise<User>;
  updateUserBalanceAdmin(id: number, amount: number): Promise<User>;
  updateUserKYC(id: number, data: {
    fullName: string;
    country: string;
    birthDate: string;
    documentType: string;
    photoRecto: string;
    photoVerso: string;
    photoSelfie: string;
  }): Promise<User>;
  updateUserPassword(id: number, passwordHash: string): Promise<User>;
  updateUserWithdrawPassword(id: number, passwordHash: string): Promise<User>;
  updateUserProfile(id: number, data: Partial<User>): Promise<User>;

  getSupportMessages(userId: number): Promise<SupportMessage[]>;
  getAllSupportMessages(): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  closeSupportConversation(userId: number): Promise<void>;
  
  getMaintenanceMode(): Promise<boolean>;
  setMaintenanceMode(enabled: boolean): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser & { referralCode?: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<void> {
    const amountStr = amount.toString();
    await db.update(users)
      .set({ balance: sql`ROUND((${users.balance}::numeric + ${amountStr}::numeric), 4)` })
      .where(eq(users.id, id));
  }

  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine;
  }

  async getContracts(userId: number): Promise<(Contract & { machine: Machine })[]> {
    return await db.select({
      id: contracts.id,
      userId: contracts.userId,
      machineId: contracts.machineId,
      amount: contracts.amount,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      status: contracts.status,
      autoReinvest: contracts.autoReinvest,
      accumulatedRewards: contracts.accumulatedRewards,
      machine: machines
    })
    .from(contracts)
    .innerJoin(machines, eq(contracts.machineId, machines.id))
    .where(eq(contracts.userId, userId));
  }

  async createContract(userId: number, machineId: number, amount: number, autoReinvest: boolean): Promise<Contract> {
    const machine = await this.getMachine(machineId);
    if (!machine) throw new Error("Machine not found");

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + machine.durationDays);

    const [contract] = await db.insert(contracts).values({
      userId,
      machineId,
      amount: amount.toString(),
      endDate,
      autoReinvest,
      status: "active",
      accumulatedRewards: "0"
    }).returning();
    
    return contract;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(userId: number, type: string, amount: number, walletAddress?: string, status: string = "completed"): Promise<Transaction> {
    const ticketNumber = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const [transaction] = await db.insert(transactions).values({
      userId,
      type,
      amount: amount.toString(),
      status,
      walletAddress,
      ticketNumber
    }).returning();
    return transaction;
  }

  // Admin Methods implementation
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: number, status: string): Promise<User> {
    const [user] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserAdmin(id: number, isAdmin: boolean): Promise<User> {
    const [user] = await db.update(users).set({ isAdmin }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserBalanceAdmin(id: number, amount: number): Promise<User> {
    const amountStr = amount.toString();
    const [user] = await db.update(users)
      .set({ balance: sql`(${users.balance}::numeric + ${amountStr}::numeric)` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserKYC(id: number, data: {
    fullName: string;
    country: string;
    birthDate: string;
    documentType: string;
    photoRecto: string;
    photoVerso: string;
    photoSelfie: string;
  }): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        kycFullName: data.fullName,
        kycCountry: data.country,
        kycBirthDate: data.birthDate,
        kycDocumentType: data.documentType,
        kycPhotoRecto: data.photoRecto,
        kycPhotoVerso: data.photoVerso,
        kycPhotoSelfie: data.photoSelfie,
        kycStatus: "pending" 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<User> {
    const [user] = await db.update(users).set({ password: passwordHash }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserWithdrawPassword(id: number, passwordHash: string): Promise<User> {
    const [user] = await db.update(users).set({ withdrawPassword: passwordHash }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserProfile(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getSupportMessages(userId: number): Promise<SupportMessage[]> {
    return await db.select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, userId))
      .orderBy(supportMessages.createdAt);
  }

  async getAllSupportMessages(): Promise<SupportMessage[]> {
    return await db.select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt));
  }

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [msg] = await db.insert(supportMessages).values(message).returning();
    return msg;
  }

  async closeSupportConversation(userId: number): Promise<void> {
    await db.update(supportMessages)
      .set({ status: "closed" })
      .where(eq(supportMessages.userId, userId));
  }

  async getMaintenanceMode(): Promise<boolean> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, 'maintenance_mode'));
    return setting?.value === 'true';
  }

  async setMaintenanceMode(enabled: boolean): Promise<void> {
    await db.insert(settings)
      .values({ key: 'maintenance_mode', value: enabled.toString() })
      .onConflictDoUpdate({ target: settings.key, set: { value: enabled.toString() } });
  }
}

export const storage = new DatabaseStorage();
