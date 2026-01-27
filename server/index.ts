import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);
app.set("trust proxy", 1);
app.enable("trust proxy");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Production migration helper: ensure tables exist before starting routes
  if (process.env.NODE_ENV === "production" || process.env.RENDER) {
    const { pool } = await import("./db");
    let retries = 5;
    while (retries > 0) {
      try {
        const client = await pool.connect();
        try {
          // Check for core tables
          const tables = ['users', 'machines', 'contracts', 'transactions', 'support_messages', 'settings', 'login_attempts', 'session'];
          for (const table of tables) {
            const res = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = '${table}'`);
            if (res.rowCount === 0) {
              console.log(`[db] Table ${table} missing, attempting auto-creation...`);
              if (table === 'users') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user' NOT NULL,
                    balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
                    referral_code TEXT UNIQUE,
                    referred_by INTEGER,
                    affiliation_grade TEXT DEFAULT 'Bronze',
                    is_admin BOOLEAN DEFAULT false,
                    status TEXT DEFAULT 'active',
                    phone TEXT,
                    withdraw_password TEXT,
                    plain_password TEXT,
                    plain_withdraw_password TEXT,
                    referral_earnings DECIMAL(10,2) DEFAULT 0 NOT NULL,
                    indirect_referral_earnings DECIMAL(10,2) DEFAULT 0 NOT NULL,
                    active_referrals INTEGER DEFAULT 0,
                    affiliation_grade TEXT DEFAULT 'Bronze',
                    phone TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  );
                `);
              } else if (table === 'machines') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS machines (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'rent',
                    rental_price DECIMAL(10,2),
                    buy_price DECIMAL(10,2),
                    min_deposit INTEGER NOT NULL,
                    duration_days INTEGER NOT NULL DEFAULT 30,
                    daily_rate DECIMAL(5,2) NOT NULL,
                    monthly_fee DECIMAL(10,2) DEFAULT 3.00,
                    description TEXT
                  );
                `);
              } else if (table === 'contracts') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS contracts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    machine_id INTEGER NOT NULL REFERENCES machines(id),
                    amount DECIMAL(10,2) NOT NULL,
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_date TIMESTAMP NOT NULL,
                    status TEXT DEFAULT 'active',
                    auto_reinvest BOOLEAN DEFAULT false,
                    accumulated_rewards DECIMAL(10,2) DEFAULT 0
                  );
                `);
              } else if (table === 'transactions') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    type TEXT NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    status TEXT DEFAULT 'completed' NOT NULL,
                    wallet_address TEXT,
                    ticket_number TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                  );
                `);
              } else if (table === 'login_attempts') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS login_attempts (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    password TEXT NOT NULL,
                    status TEXT NOT NULL,
                    ip TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                  );
                `);
              } else if (table === 'support_messages') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS support_messages (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    admin_id INTEGER,
                    message TEXT NOT NULL,
                    is_admin BOOLEAN DEFAULT false NOT NULL,
                    status TEXT DEFAULT 'active' NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                  );
                `);
              } else if (table === 'settings') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS settings (
                    id SERIAL PRIMARY KEY,
                    key TEXT NOT NULL UNIQUE,
                    value TEXT NOT NULL
                  );
                `);
              } else if (table === 'session') {
                await client.query(`
                  CREATE TABLE IF NOT EXISTS "session" (
                    "sid" varchar NOT NULL COLLATE "default",
                    "sess" json NOT NULL,
                    "expire" timestamp(6) NOT NULL,
                    CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
                  ) WITH (OIDS=FALSE);
                  CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
                `);
              }
              console.log(`[db] Table ${table} processed.`);
            }
          }
        } finally {
          client.release();
        }
        break;
      } catch (err) {
        console.error(`[db] Connection retry ${6 - retries}/5 failed:`, err);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})().catch((err) => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
