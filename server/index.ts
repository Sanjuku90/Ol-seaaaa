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
          // Simple check for machines table
          const res = await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'machines'");
          if (res.rowCount === 0) {
            console.log("[db] Tables missing, attempting auto-migration...");
            // Run drizzle-kit push programmatically or via shell if possible
            // For now, we will at least create the machines table if it's the one blocking
            await client.query(`
              CREATE TABLE IF NOT EXISTS machines (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                rental_price DECIMAL(10,2),
                buy_price DECIMAL(10,2),
                min_deposit DECIMAL(10,2) DEFAULT 0 NOT NULL,
                duration_days INTEGER NOT NULL,
                daily_rate DECIMAL(10,2) NOT NULL,
                monthly_fee DECIMAL(10,2) DEFAULT 0 NOT NULL,
                description TEXT
              );
            `);
            console.log("[db] Machines table created successfully.");
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
