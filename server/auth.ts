import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, loginAttempts } from "@shared/schema";
import { db } from "./db";
import { sendEmail } from "./utils/email";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
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
    proxy: true,
    cookie: {
      secure: false, // On désactive le secure temporairement pour éliminer les problèmes de proxy
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000
    },
    store: storage.sessionStore,
  };

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ passReqToCallback: true }, async (req, username, password, done) => {
      try {
        const user = await storage.getUserByEmail(username.toLowerCase().trim());
        const isValid = user ? await comparePasswords(password, user.password) : false;
        
        if (!user || !isValid) {
          return done(null, false, { message: "Email ou mot de passe incorrect" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
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
        plainPassword: req.body.password,
        balance: "0",
        isAdmin: false,
        kycStatus: null,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Send Welcome Email
        sendEmail(
          user.email,
          "Bienvenue chez BlockMint - Votre Aventure de Minage Commence !",
          `Bonjour, Bienvenue sur BlockMint, votre plateforme de cloud mining sécurisée. Commencez à investir dès maintenant pour générer des revenus passifs.`,
          "Bienvenue chez BlockMint",
          `<p>Bonjour et bienvenue dans la communauté <strong>BlockMint</strong> !</p>
           
           <p>Nous sommes ravis de vous accompagner dans votre aventure de minage de cryptomonnaies. BlockMint est conçu pour rendre l'investissement accessible, transparent et rentable pour tous.</p>
           
           <div class="info-card">
             <h3 style="margin-top: 0; color: #10b981;">Pourquoi commencer aujourd'hui ?</h3>
             <ul style="padding-left: 20px; margin-bottom: 0;">
               <li><strong>Revenus Passifs :</strong> Vos machines minent 24h/24, 7j/7.</li>
               <li><strong>Flexibilité :</strong> Choisissez entre la location (Rent) ou l'achat (Buy) selon votre budget.</li>
               <li><strong>Simplicité :</strong> Pas besoin de matériel technique, nous gérons tout pour vous.</li>
             </ul>
           </div>

           <p><strong>Comment débuter ?</strong></p>
           <ol>
             <li>Effectuez un dépôt sur votre <span class="highlight">Portefeuille</span>.</li>
             <li>Choisissez votre machine dans le <span class="highlight">Catalogue</span>.</li>
             <li>Activez votre contrat et regardez vos profits s'accumuler en temps réel !</li>
           </ol>

           <div style="text-align: center; margin-top: 30px;">
             <a href="https://blockmint.onrender.com/dashboard/machines" class="button">Découvrir les Machines</a>
           </div>
           
           <p style="margin-top: 30px; font-size: 14px; border-top: 1px solid #eee; pt-15px;">Besoin d'aide ? Notre support est à votre disposition 24/7 via votre tableau de bord.</p>`
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
