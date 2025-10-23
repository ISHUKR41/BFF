import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage-fixed";
import { insertRegistrationSchema } from "@shared/schema";
import { requireAuth, generateToken } from "./index-fixed";
import { db } from "./database";
import { tournaments, registrations } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function registerFixedRoutes(app: Express): Promise<Server> {
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

      const admin = await storage.getAdmin(req.admin.id);

      if (!admin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      res.json({
        valid: true,
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Token validation failed" });
    }
  });

  // Admin check endpoint (for frontend auth state)
  app.get("/api/admin/check", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ authenticated: false });
      }

      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || "tournament-jwt-secret-change-in-production";
      
      try {
        const decoded = jwt.verify(token, secret) as any;
        const admin = await storage.getAdmin(decoded.adminId);
        
        if (!admin) {
          return res.json({ authenticated: false });
        }

        res.json({ 
          authenticated: true,
          admin: {
            id: admin.id,
            username: admin.username,
          }
        });
      } catch (jwtError) {
        res.json({ authenticated: false });
      }
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // === TOURNAMENT ROUTES ===

  // Get all tournaments with their current slot counts
  app.get("/api/tournaments", async (req: Request, res: Response) => {
    try {
      // For Vercel deployment, ensure accurate tournament counts
      const tournamentList = await storage.getAllTournaments();
      res.json(tournamentList);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  // Get specific tournament
  app.get("/api/tournaments/:gameType/:tournamentType", async (req: Request, res: Response) => {
    try {
      const { gameType, tournamentType } = req.params;

      if (
        !["bgmi", "freefire"].includes(gameType) ||
        !["solo", "duo", "squad"].includes(tournamentType)
      ) {
        return res
          .status(400)
          .json({ error: "Invalid game type or tournament type" });
      }

      const tournament = await storage.getTournament(
        gameType as any,
        tournamentType as any
      );

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      res.json(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ error: "Failed to fetch tournament" });
    }
  });

  // Reset tournament (admin only)
  app.post("/api/tournaments/reset", requireAuth, async (req: Request, res: Response) => {
    try {
      const { gameType, tournamentType } = req.body;

      if (!gameType || !tournamentType) {
        return res
          .status(400)
          .json({ error: "gameType and tournamentType are required" });
      }

      if (
        !["bgmi", "freefire"].includes(gameType) ||
        !["solo", "duo", "squad"].includes(tournamentType)
      ) {
        return res
          .status(400)
          .json({ error: "Invalid game type or tournament type" });
      }

      const tournament = await storage.resetTournament(
        gameType,
        tournamentType
      );

      // Log activity
      await storage.createActivityLog({
        adminUsername: req.admin!.username,
        action: "reset_tournament",
        targetType: "tournament",
        targetId: `${gameType}_${tournamentType}`,
        details: JSON.stringify({ gameType, tournamentType }),
      });

      res.json(tournament);
    } catch (error) {
      console.error("Error resetting tournament:", error);
      res.status(500).json({ error: "Failed to reset tournament" });
    }
  });

  // Update tournament QR code (admin only)
  app.patch(
    "/api/tournaments/:gameType/:tournamentType/qr",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { gameType, tournamentType } = req.params;
        const { qrCodeUrl } = req.body;

        if (!qrCodeUrl) {
          return res.status(400).json({ error: "qrCodeUrl is required" });
        }

        if (
          !["bgmi", "freefire"].includes(gameType) ||
          !["solo", "duo", "squad"].includes(tournamentType)
        ) {
          return res
            .status(400)
            .json({ error: "Invalid game type or tournament type" });
        }

        const tournament = await storage.updateQRCode(
          gameType as any,
          tournamentType as any,
          qrCodeUrl
        );

        // Log activity
        await storage.createActivityLog({
          adminUsername: req.admin!.username,
          action: "update_qr",
          targetType: "tournament",
          targetId: `${gameType}_${tournamentType}`,
          details: JSON.stringify({ gameType, tournamentType, qrCodeUrl }),
        });

        res.json(tournament);
      } catch (error) {
        console.error("Error updating QR code:", error);
        res.status(500).json({ error: "Failed to update QR code" });
      }
    }
  );

  // === REGISTRATION ROUTES ===

  // Create registration
  app.post("/api/registrations", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertRegistrationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const data = validationResult.data;

      // Additional validation for player fields based on tournament type
      if (
        data.tournamentType === "duo" &&
        (!data.player2Name || !data.player2GameId)
      ) {
        return res.status(400).json({
          error: "Player 2 details are required for duo tournaments",
        });
      }

      if (data.tournamentType === "squad") {
        if (
          !data.player2Name ||
          !data.player2GameId ||
          !data.player3Name ||
          !data.player3GameId ||
          !data.player4Name ||
          !data.player4GameId
        ) {
          return res.status(400).json({
            error: "All player details are required for squad tournaments",
          });
        }
      }

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

      res.status(201).json({
        success: true,
        registration: {
          id: registration.id,
          gameType: registration.gameType,
          tournamentType: registration.tournamentType,
          playerName: registration.playerName,
          teamName: registration.teamName,
          status: registration.status,
          submittedAt: registration.submittedAt,
        },
      });
    } catch (error) {
      console.error("Error creating registration:", error);

      if (error instanceof Error) {
        if (error.message === "Tournament is full") {
          return res.status(400).json({ error: error.message });
        }
        if (error.message === "Tournament not found") {
          return res.status(404).json({ error: error.message });
        }
      }

      res.status(500).json({ error: "Failed to create registration" });
    }
  });

  // Get all registrations (admin only - with optional filters)
  app.get("/api/registrations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { gameType, tournamentType, status } = req.query;

      let registrations = await storage.getAllRegistrations();

      // Apply filters
      if (gameType && typeof gameType === "string") {
        registrations = registrations.filter((r) => r.gameType === gameType);
      }
      if (tournamentType && typeof tournamentType === "string") {
        registrations = registrations.filter(
          (r) => r.tournamentType === tournamentType
        );
      }
      if (status && typeof status === "string") {
        registrations = registrations.filter((r) => r.status === status);
      }

      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Get single registration (admin only)
  app.get("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Error fetching registration:", error);
      res.status(500).json({ error: "Failed to fetch registration" });
    }
  });

  // Update registration status (admin only - approve/reject)
  app.patch("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({
            error: "Invalid status. Must be pending, approved, or rejected",
          });
      }

      const registration = await storage.updateRegistrationStatus(
        id,
        status,
        req.admin!.username
      );

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Error updating registration status:", error);
      res.status(500).json({ error: "Failed to update registration" });
    }
  });

  // Search registrations (admin only)
  app.get("/api/registrations/search/:query", requireAuth, async (req: Request, res: Response) => {
    try {
      const { query } = req.params;

      if (!query || query.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Search query must be at least 2 characters" });
      }

      const registrations = await storage.searchRegistrations(query.trim());
      res.json(registrations);
    } catch (error) {
      console.error("Error searching registrations:", error);
      res.status(500).json({ error: "Failed to search registrations" });
    }
  });

  // Update registration details (admin only)
  app.put("/api/registrations/:id/details", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate updates
      const allowedUpdates = [
        "playerName",
        "gameId",
        "whatsapp",
        "teamName",
        "transactionId",
        "player2Name",
        "player2GameId",
        "player3Name",
        "player3GameId",
        "player4Name",
        "player4GameId",
        "paymentScreenshot",
      ];

      const invalidUpdates = Object.keys(updates).filter(
        (key) => !allowedUpdates.includes(key)
      );
      if (invalidUpdates.length > 0) {
        return res.status(400).json({
          error: "Invalid update fields",
          invalidFields: invalidUpdates,
        });
      }

      const registration = await storage.updateRegistrationDetails(
        id,
        updates,
        req.admin!.username
      );

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Error updating registration details:", error);
      res.status(500).json({ error: "Failed to update registration details" });
    }
  });

  // Add/update notes for registration (admin only)
  app.patch("/api/registrations/:id/notes", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (typeof notes !== "string") {
        return res.status(400).json({ error: "Notes must be a string" });
      }

      const registration = await storage.updateRegistrationNotes(
        id,
        notes,
        req.admin!.username
      );

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Error updating notes:", error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  // Toggle flag on registration (admin only)
  app.patch("/api/registrations/:id/flag", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const registration = await storage.toggleRegistrationFlag(
        id,
        req.admin!.username
      );

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Error toggling flag:", error);
      res.status(500).json({ error: "Failed to toggle flag" });
    }
  });

  // Toggle payment verification (admin only)
  app.patch(
    "/api/registrations/:id/verify-payment",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const registration = await storage.togglePaymentVerification(
          id,
          req.admin!.username
        );

        if (!registration) {
          return res.status(404).json({ error: "Registration not found" });
        }

        res.json(registration);
      } catch (error) {
        console.error("Error toggling payment verification:", error);
        res
          .status(500)
          .json({ error: "Failed to toggle payment verification" });
      }
    }
  );

  // Delete registration (admin only)
  app.delete("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      const success = await storage.deleteRegistration(id);

      if (success) {
        await storage.createActivityLog({
          adminUsername: req.admin!.username,
          action: "delete",
          targetType: "registration",
          targetId: id,
          details: JSON.stringify({
            playerName: registration.playerName,
            teamName: registration.teamName,
            gameType: registration.gameType,
            tournamentType: registration.tournamentType,
          }),
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ error: "Failed to delete registration" });
    }
  });

  // === BULK OPERATIONS (Admin only) ===

  // Bulk approve registrations
  app.post("/api/registrations/bulk/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ error: "ids array is required and must not be empty" });
      }

      if (ids.length > 100) {
        return res
          .status(400)
          .json({
            error: "Cannot process more than 100 registrations at once",
          });
      }

      const results = await Promise.allSettled(
        ids.map((id) =>
          storage.updateRegistrationStatus(id, "approved", req.admin!.username)
        )
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value !== undefined
      ).length;
      const failed = results.length - successful;

      res.json({
        success: true,
        processed: successful,
        failed: failed,
        total: ids.length,
      });
    } catch (error) {
      console.error("Error bulk approving:", error);
      res.status(500).json({ error: "Failed to bulk approve" });
    }
  });

  // Bulk reject registrations
  app.post("/api/registrations/bulk/reject", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ error: "ids array is required and must not be empty" });
      }

      if (ids.length > 100) {
        return res
          .status(400)
          .json({
            error: "Cannot process more than 100 registrations at once",
          });
      }

      const results = await Promise.allSettled(
        ids.map((id) =>
          storage.updateRegistrationStatus(id, "rejected", req.admin!.username)
        )
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value !== undefined
      ).length;
      const failed = results.length - successful;

      res.json({
        success: true,
        processed: successful,
        failed: failed,
        total: ids.length,
      });
    } catch (error) {
      console.error("Error bulk rejecting:", error);
      res.status(500).json({ error: "Failed to bulk reject" });
    }
  });

  // Bulk delete registrations
  app.post("/api/registrations/bulk/delete", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ error: "ids array is required and must not be empty" });
      }

      if (ids.length > 100) {
        return res
          .status(400)
          .json({
            error: "Cannot process more than 100 registrations at once",
          });
      }

      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const registration = await storage.getRegistration(id);
          if (!registration) return false;

          const success = await storage.deleteRegistration(id);

          if (success) {
            await storage.createActivityLog({
              adminUsername: req.admin!.username,
              action: "bulk_delete",
              targetType: "registration",
              targetId: id,
              details: JSON.stringify({
                playerName: registration.playerName,
                gameType: registration.gameType,
                tournamentType: registration.tournamentType,
              }),
            });
          }

          return success;
        })
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value === true
      ).length;
      const failed = results.length - successful;

      res.json({
        success: true,
        processed: successful,
        failed: failed,
        total: ids.length,
      });
    } catch (error) {
      console.error("Error bulk deleting:", error);
      res.status(500).json({ error: "Failed to bulk delete" });
    }
  });

  // === ACTIVITY LOGS (Admin only) ===

  // Get activity logs
  app.get("/api/activity-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const maxLimit = Math.min(limit, 500); // Cap at 500

      const logs = await storage.getAllActivityLogs(maxLimit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Get activity logs for specific target
  app.get(
    "/api/activity-logs/:targetType/:targetId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { targetType, targetId } = req.params;
        const logs = await storage.getActivityLogsByTarget(
          targetType,
          targetId
        );
        res.json(logs);
      } catch (error) {
        console.error("Error fetching target activity logs:", error);
        res.status(500).json({ error: "Failed to fetch activity logs" });
      }
    }
  );

  return createServer(app);
}