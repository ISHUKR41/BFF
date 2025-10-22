import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema } from "@shared/schema";
import bcrypt from "bcryptjs";

// Auth middleware to protect admin routes
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tournaments with their slot counts
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  // Get specific tournament
  app.get("/api/tournaments/:gameType/:tournamentType", async (req, res) => {
    try {
      const { gameType, tournamentType } = req.params;
      const tournament = await storage.getTournament(
        gameType as any,
        tournamentType as any
      );
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournament" });
    }
  });

  // Reset tournament (admin only)
  app.post("/api/tournaments/reset", requireAdmin, async (req, res) => {
    try {
      const { gameType, tournamentType } = req.body;
      
      if (!gameType || !tournamentType) {
        return res.status(400).json({ error: "gameType and tournamentType are required" });
      }

      const tournament = await storage.resetTournament(
        gameType,
        tournamentType
      );
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset tournament" });
    }
  });

  // Update tournament QR code (admin only)
  app.patch("/api/tournaments/:gameType/:tournamentType/qr", requireAdmin, async (req, res) => {
    try {
      const { gameType, tournamentType } = req.params;
      const { qrCodeUrl } = req.body;

      if (!qrCodeUrl) {
        return res.status(400).json({ error: "qrCodeUrl is required" });
      }

      const tournament = await storage.updateQRCode(
        gameType as any,
        tournamentType as any,
        qrCodeUrl
      );
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ error: "Failed to update QR code" });
    }
  });

  // Create registration
  app.post("/api/registrations", async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertRegistrationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const data = validationResult.data;

      // Check if tournament has available slots
      const tournament = await storage.getTournament(
        data.gameType as any,
        data.tournamentType as any
      );

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      if (tournament.registeredCount >= tournament.maxSlots) {
        return res.status(400).json({ error: "Tournament is full" });
      }

      // Create registration
      const registration = await storage.createRegistration(data);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error creating registration:", error);
      res.status(500).json({ error: "Failed to create registration" });
    }
  });

  // Get all registrations (admin only - with optional filters)
  app.get("/api/registrations", requireAdmin, async (req, res) => {
    try {
      const { gameType, tournamentType, status } = req.query;

      let registrations = await storage.getAllRegistrations();

      // Apply filters
      if (gameType) {
        registrations = registrations.filter((r) => r.gameType === gameType);
      }
      if (tournamentType) {
        registrations = registrations.filter((r) => r.tournamentType === tournamentType);
      }
      if (status) {
        registrations = registrations.filter((r) => r.status === status);
      }

      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Get single registration (admin only)
  app.get("/api/registrations/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registration" });
    }
  });

  // Update registration status (admin only - approve/reject)
  app.patch("/api/registrations/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const registration = await storage.updateRegistrationStatus(id, status);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to update registration" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const admin = await storage.getAdminByUsername(username);

      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session
      req.session.adminId = admin.id;
      
      res.json({ 
        success: true, 
        admin: { id: admin.id, username: admin.username } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Check admin session status
  app.get("/api/admin/check", (req, res) => {
    if (req.session.adminId) {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
