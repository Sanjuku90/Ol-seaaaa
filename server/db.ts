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
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Auto-migration for production environments like Render
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  (async () => {
    let client;
    try {
      client = await pool.connect();
      console.log("[db] Running auto-migrations for production...");
      await client.query(`
        DO $$ 
        BEGIN 
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
        END $$;
      `);
      console.log("[db] Auto-migrations completed successfully.");
    } catch (err) {
      console.error("[db] Auto-migration failed:", err);
    } finally {
      if (client) client.release();
    }
  })();
}

export const db = drizzle(pool, { schema });
