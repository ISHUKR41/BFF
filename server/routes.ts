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

      // Get admin username from session
      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const registration = await storage.updateRegistrationStatus(id, status, adminUsername);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to update registration" });
    }
  });

  // Search registrations (admin only)
  app.get("/api/registrations/search/:query", requireAdmin, async (req, res) => {
    try {
      const { query } = req.params;
      const registrations = await storage.searchRegistrations(query);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to search registrations" });
    }
  });

  // Update registration details (admin only)
  app.put("/api/registrations/:id/details", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const registration = await storage.updateRegistrationDetails(id, updates, adminUsername);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to update registration details" });
    }
  });

  // Add/update notes for registration (admin only)
  app.patch("/api/registrations/:id/notes", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const registration = await storage.updateRegistrationNotes(id, notes, adminUsername);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  // Toggle flag on registration (admin only)
  app.patch("/api/registrations/:id/flag", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const registration = await storage.toggleRegistrationFlag(id, adminUsername);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle flag" });
    }
  });

  // Toggle payment verification (admin only)
  app.patch("/api/registrations/:id/verify-payment", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const registration = await storage.togglePaymentVerification(id, adminUsername);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle payment verification" });
    }
  });

  // Delete registration (admin only)
  app.delete("/api/registrations/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const registration = await storage.getRegistration(id);
      
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const success = await storage.deleteRegistration(id);

      if (success && adminUsername) {
        await storage.createActivityLog({
          adminUsername,
          action: "delete",
          targetType: "registration",
          targetId: id,
          details: JSON.stringify({ playerName: registration.playerName, teamName: registration.teamName }),
        });
      }

      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete registration" });
    }
  });

  // Bulk approve registrations (admin only)
  app.post("/api/registrations/bulk/approve", requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids array is required" });
      }

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const results = await Promise.all(
        ids.map(id => storage.updateRegistrationStatus(id, "approved", adminUsername))
      );

      const successful = results.filter(r => r !== undefined).length;
      res.json({ success: true, count: successful });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk approve" });
    }
  });

  // Bulk reject registrations (admin only)
  app.post("/api/registrations/bulk/reject", requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids array is required" });
      }

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const results = await Promise.all(
        ids.map(id => storage.updateRegistrationStatus(id, "rejected", adminUsername))
      );

      const successful = results.filter(r => r !== undefined).length;
      res.json({ success: true, count: successful });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk reject" });
    }
  });

  // Bulk delete registrations (admin only)
  app.post("/api/registrations/bulk/delete", requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids array is required" });
      }

      const adminId = req.session.adminId;
      const admin = await storage.getAdmin(adminId!);
      const adminUsername = admin?.username;

      const results = await Promise.all(
        ids.map(async (id) => {
          const registration = await storage.getRegistration(id);
          const success = await storage.deleteRegistration(id);
          
          if (success && adminUsername && registration) {
            await storage.createActivityLog({
              adminUsername,
              action: "bulk_delete",
              targetType: "registration",
              targetId: id,
              details: JSON.stringify({ playerName: registration.playerName }),
            });
          }
          
          return success;
        })
      );

      const successful = results.filter(r => r === true).length;
      res.json({ success: true, count: successful });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk delete" });
    }
  });

  // Get activity logs (admin only)
  app.get("/api/activity-logs", requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getAllActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Get activity logs for specific target (admin only)
  app.get("/api/activity-logs/:targetType/:targetId", requireAdmin, async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const logs = await storage.getActivityLogsByTarget(targetType, targetId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
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
