import { pgTable, text, serial, integer, boolean, timestamp, numeric, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  adminId: integer("admin_id"),
  message: text("message").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  status: text("status").default("active").notNull(), // active, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), 
  password: text("password").notNull(),
  role: text("role").default("user").notNull(), 
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"), 
  kycStatus: text("kyc_status").default("pending"), 
  affiliationGrade: text("affiliation_grade").default("Bronze"),
  isAdmin: boolean("is_admin").default(false),
  status: text("status").default("active"),
  phone: text("phone"),
  referralEarnings: decimal("referral_earnings", { precision: 10, scale: 2 }).default("0").notNull(),
  indirectReferralEarnings: decimal("indirect_referral_earnings", { precision: 10, scale: 2 }).default("0").notNull(),
  activeReferrals: integer("active_referrals").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), 
  type: text("type", { enum: ["rent", "buy"] }).notNull().default("rent"),
  rentalPrice: decimal("rental_price", { precision: 10, scale: 2 }),
  buyPrice: decimal("buy_price", { precision: 10, scale: 2 }),
  minDeposit: integer("min_deposit").notNull(),
  durationDays: integer("duration_days").notNull().default(30),
  dailyRate: decimal("daily_rate", { precision: 5, scale: 2 }).notNull(), 
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).default("3.00"),
  description: text("description"),
});

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  machineId: integer("machine_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("active"), 
  autoReinvest: boolean("auto_reinvest").default(false),
  accumulatedRewards: decimal("accumulated_rewards", { precision: 10, scale: 2 }).default("0"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), 
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("completed").notNull(), 
  walletAddress: text("wallet_address"), 
  ticketNumber: text("ticket_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === RELATIONS ===
export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  user: one(users, {
    fields: [supportMessages.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  contracts: many(contracts),
  transactions: many(transactions),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "referrals"
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  user: one(users, {
    fields: [contracts.userId],
    references: [users.id],
  }),
  machine: one(machines, {
    fields: [contracts.machineId],
    references: [machines.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ 
  id: true, 
  createdAt: true 
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  balance: true, 
  role: true, 
  kycStatus: true, 
  createdAt: true 
});

export const insertMachineSchema = createInsertSchema(machines).omit({ id: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ 
  id: true, 
  startDate: true, 
  accumulatedRewards: true 
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Machine = typeof machines.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = InsertUser & { referralCode?: string };

export type CreateContractRequest = {
  machineId: number;
  amount: number;
  autoReinvest: boolean;
};

export type ContractResponse = Contract & { machine: Machine };

export type StatsResponse = {
  totalPower: number;
  totalDistributed: number;
  activeMiners: number;
};
