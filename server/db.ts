import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20, // Increase max connections for production
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Auto-migration for production environments like Render
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  (async () => {
    let client;
    try {
      client = await pool.connect();
      // Auto-migrations silenced for production
      // Wrapped in an outer try-catch to handle cases where tables don't exist yet
      try {
        await client.query(`
          DO $$ 
          BEGIN 
            -- Check if users table exists before attempting to alter it
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
              BEGIN
                ALTER TABLE users ADD COLUMN plain_password text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;
              
              BEGIN
                ALTER TABLE users ADD COLUMN plain_withdraw_password text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN referral_earnings decimal(10,2) DEFAULT '0' NOT NULL;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN indirect_referral_earnings decimal(10,2) DEFAULT '0' NOT NULL;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN active_referrals integer DEFAULT 0;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_full_name text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_country text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_birth_date text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_document_type text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_photo_recto text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_photo_verso text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_photo_selfie text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_note text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN kyc_status text;
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;

              BEGIN
                ALTER TABLE users ADD COLUMN affiliation_grade text DEFAULT 'Bronze';
              EXCEPTION WHEN duplicate_column THEN 
                NULL;
              END;
            END IF;
          END $$;
        `);
      } catch (innerErr: any) {
        console.warn("[db] Migration script error (possibly table doesn't exist yet):", innerErr.message);
      }
    } catch (err) {
      console.error("[db] Auto-migration connection failed:", err);
    } finally {
      if (client) client.release();
    }
  })();
}

export const db = drizzle(pool, { schema });
