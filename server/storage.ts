import { db } from "./db";
import {
  users, machines, contracts, transactions,
  type User, type InsertUser, type Machine, type Contract, type Transaction
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
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [user] = await db.insert(users).values({ ...insertUser, referralCode }).returning();
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<void> {
    await db.update(users)
      .set({ balance: sql`${users.balance} + ${amount.toString()}` })
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
    const [transaction] = await db.insert(transactions).values({
      userId,
      type,
      amount: amount.toString(),
      status,
      walletAddress
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
    const [user] = await db.update(users)
      .set({ balance: sql`${users.balance} + ${amount.toString()}` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
