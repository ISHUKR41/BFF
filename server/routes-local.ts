import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage-local";
import { insertRegistrationSchema } from "@shared/schema";
import { requireAuth, generateToken } from "./index-local";
import { db } from "./database-local";
import { tournaments } from "@shared/schema";

export async function registerImprovedRoutes(app: Express): Promise<Server> {
  // === AUTHENTICATION ROUTES ===

  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const admin = await storage.validateAdmin(username, password);

      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(admin.id, admin.username);

      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
        },
        token,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin token validation
  app.get("/api/admin/validate", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ error: "Invalid token" });
      }

      res.json({
        success: true,
        admin: {
          id: req.admin.id,
          username: req.admin.username,
        },
      });
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ error: "Token validation failed" });
    }
  });

  // === TOURNAMENT ROUTES ===

  // Get all tournaments
  app.get("/api/tournaments", async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Get tournaments error:", error);
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  // Get specific tournament
  app.get("/api/tournaments/:gameType/:tournamentType", async (req: Request, res: Response) => {
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
      console.error("Get tournament error:", error);
      res.status(500).json({ error: "Failed to fetch tournament" });
    }
  });

  // === REGISTRATION ROUTES ===

  // Create registration
  app.post("/api/registrations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      
      // Check if tournament exists and has available slots
      const tournament = await storage.getTournament(
        validatedData.gameType,
        validatedData.tournamentType
      );

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      if (tournament.currentCount >= tournament.maxSlots) {
        return res.status(400).json({ error: "Tournament is full" });
      }

      // Create registration
      const registration = await storage.createRegistration(validatedData);

      // Update tournament count
      await storage.updateTournamentCount(
        validatedData.gameType,
        validatedData.tournamentType,
        1
      );

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: "system",
        action: "registration_created",
        details: `New registration created for ${validatedData.gameType} ${validatedData.tournamentType}`,
      });

      res.status(201).json(registration);
    } catch (error) {
      console.error("Create registration error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({ error: "Invalid registration data" });
      } else {
        res.status(500).json({ error: "Failed to create registration" });
      }
    }
  });

  // Get all registrations (admin only)
  app.get("/api/registrations", requireAuth, async (req: Request, res: Response) => {
    try {
      const registrations = await storage.getAllRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Get registrations error:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Get specific registration (admin only)
  app.get("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Get registration error:", error);
      res.status(500).json({ error: "Failed to fetch registration" });
    }
  });

  // Update registration (admin only)
  app.patch("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const registration = await storage.updateRegistration(id, updates);

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "registration_updated",
        details: `Registration ${id} updated`,
      });

      res.json(registration);
    } catch (error) {
      console.error("Update registration error:", error);
      res.status(500).json({ error: "Failed to update registration" });
    }
  });

  // Delete registration (admin only)
  app.delete("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRegistration(id);

      if (!deleted) {
        return res.status(404).json({ error: "Registration not found" });
      }

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "registration_deleted",
        details: `Registration ${id} deleted`,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Delete registration error:", error);
      res.status(500).json({ error: "Failed to delete registration" });
    }
  });

  // Bulk approve registrations (admin only)
  app.post("/api/registrations/bulk/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid registration IDs" });
      }

      const updated = await storage.bulkUpdateRegistrations(ids, { status: "approved" });

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "bulk_approve",
        details: `Approved ${updated} registrations`,
      });

      res.json({ success: true, updated });
    } catch (error) {
      console.error("Bulk approve error:", error);
      res.status(500).json({ error: "Failed to approve registrations" });
    }
  });

  // Bulk reject registrations (admin only)
  app.post("/api/registrations/bulk/reject", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid registration IDs" });
      }

      const updated = await storage.bulkUpdateRegistrations(ids, { status: "rejected" });

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "bulk_reject",
        details: `Rejected ${updated} registrations`,
      });

      res.json({ success: true, updated });
    } catch (error) {
      console.error("Bulk reject error:", error);
      res.status(500).json({ error: "Failed to reject registrations" });
    }
  });

  // Bulk delete registrations (admin only)
  app.post("/api/registrations/bulk/delete", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Invalid registration IDs" });
      }

      const deleted = await storage.bulkDeleteRegistrations(ids);

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "bulk_delete",
        details: `Deleted ${deleted} registrations`,
      });

      res.json({ success: true, deleted });
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ error: "Failed to delete registrations" });
    }
  });

  // Reset tournament (admin only)
  app.post("/api/tournaments/:gameType/:tournamentType/reset", requireAuth, async (req: Request, res: Response) => {
    try {
      const { gameType, tournamentType } = req.params;
      
      const tournament = await storage.resetTournament(
        gameType as any,
        tournamentType as any
      );

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "tournament_reset",
        details: `Reset ${gameType} ${tournamentType} tournament`,
      });

      res.json(tournament);
    } catch (error) {
      console.error("Reset tournament error:", error);
      res.status(500).json({ error: "Failed to reset tournament" });
    }
  });

  // Update QR code (admin only)
  app.post("/api/tournaments/:gameType/:tournamentType/qr", requireAuth, async (req: Request, res: Response) => {
    try {
      const { gameType, tournamentType } = req.params;
      const { qrCodeUrl } = req.body;

      if (!qrCodeUrl) {
        return res.status(400).json({ error: "QR code URL is required" });
      }

      const tournament = await storage.updateQRCode(
        gameType as any,
        tournamentType as any,
        qrCodeUrl
      );

      // Log activity
      await storage.logActivity({
        id: `activity-${Date.now()}`,
        adminId: req.admin!.id,
        action: "qr_code_updated",
        details: `Updated QR code for ${gameType} ${tournamentType}`,
      });

      res.json(tournament);
    } catch (error) {
      console.error("Update QR code error:", error);
      res.status(500).json({ error: "Failed to update QR code" });
    }
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}
