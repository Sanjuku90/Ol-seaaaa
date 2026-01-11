import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { sendEmail } from "./utils/email";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r3pl1t_s3cr3t_k3y",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Note: 'username' here is actually the email from the form
      const user = await storage.getUserByEmail(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      if (!req.body.email || !req.body.password) {
        return res.status(400).send("Email and password are required");
      }
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        balance: "0",
        isAdmin: false,
        kycStatus: "pending",
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Send Welcome Email
        sendEmail(
          user.email,
          "Bienvenue chez BlockMint !",
          `Bonjour, Bienvenue sur BlockMint, votre plateforme de cloud mining. Votre compte est maintenant actif.`,
          "Bienvenue chez BlockMint",
          `<p>Bonjour,</p>
           <p>Nous sommes ravis de vous compter parmi nos nouveaux investisseurs.</p>
           <p>Votre compte est maintenant <span class="highlight">actif</span> et prêt à l'emploi. Commencez dès maintenant à miner vos premières cryptomonnaies !</p>
           <div style="text-align: center;">
             <a href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co" class="button">Accéder à mon Dashboard</a>
           </div>`
        );
        
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
