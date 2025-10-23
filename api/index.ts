import express, { type Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage-vercel";

const app = express();

// JWT payload interface
interface JWTPayload {
  adminId: string;
  username: string;
  iat: number;
  exp: number;
}

// Extend Request type to include admin info
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        username: string;
      };
    }
  }
}

// Middleware setup
app.use(
  express.json({
    limit: "10mb",
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || "https://your-app.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000",
  ];

  if (allowedOrigins.includes(origin as string) || !origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

// JWT Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "No valid authorization token provided" });
    }

    const token = authHeader.substring(7);
    const secret =
      process.env.JWT_SECRET || "tournament-jwt-secret-change-in-production";

    const decoded = jwt.verify(token, secret) as JWTPayload;

    req.admin = {
      id: decoded.adminId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
}

// Generate JWT token
export function generateToken(adminId: string, username: string): string {
  const secret =
    process.env.JWT_SECRET || "tournament-jwt-secret-change-in-production";
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign({ adminId, username }, secret, { expiresIn });
}

// Health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "in-memory",
      environment: process.env.NODE_ENV || "production",
    };

    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

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
    const tournament = await storage.getTournament(gameType, tournamentType);

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json(tournament);
  } catch (error) {
    console.error("Get tournament error:", error);
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

// Create registration
app.post("/api/registrations", async (req: Request, res: Response) => {
  try {
    const registration = req.body;
    
    // Check if tournament exists and has available slots
    const tournament = await storage.getTournament(
      registration.gameType,
      registration.tournamentType
    );

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (tournament.current_count >= tournament.max_slots) {
      return res.status(400).json({ error: "Tournament is full" });
    }

    // Create registration
    const newRegistration = await storage.createRegistration(registration);

    // Update tournament count
    await storage.updateTournamentCount(
      registration.gameType,
      registration.tournamentType,
      1
    );

    res.status(201).json(newRegistration);
  } catch (error) {
    console.error("Create registration error:", error);
    res.status(500).json({ error: "Failed to create registration" });
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

// Update registration (admin only)
app.patch("/api/registrations/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const registration = await storage.updateRegistration(id, updates);
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

    res.json({ success: true });
  } catch (error) {
    console.error("Delete registration error:", error);
    res.status(500).json({ error: "Failed to delete registration" });
  }
});

// Bulk operations (admin only)
app.post("/api/registrations/bulk/approve", requireAuth, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const updated = await storage.bulkUpdateRegistrations(ids, { status: "approved" });
    res.json({ success: true, updated });
  } catch (error) {
    console.error("Bulk approve error:", error);
    res.status(500).json({ error: "Failed to approve registrations" });
  }
});

app.post("/api/registrations/bulk/reject", requireAuth, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const updated = await storage.bulkUpdateRegistrations(ids, { status: "rejected" });
    res.json({ success: true, updated });
  } catch (error) {
    console.error("Bulk reject error:", error);
    res.status(500).json({ error: "Failed to reject registrations" });
  }
});

app.post("/api/registrations/bulk/delete", requireAuth, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const deleted = await storage.bulkDeleteRegistrations(ids);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ error: "Failed to delete registrations" });
  }
});

// Tournament management (admin only)
app.post("/api/tournaments/:gameType/:tournamentType/reset", requireAuth, async (req: Request, res: Response) => {
  try {
    const { gameType, tournamentType } = req.params;
    const tournament = await storage.resetTournament(gameType, tournamentType);
    res.json(tournament);
  } catch (error) {
    console.error("Reset tournament error:", error);
    res.status(500).json({ error: "Failed to reset tournament" });
  }
});

app.post("/api/tournaments/:gameType/:tournamentType/qr", requireAuth, async (req: Request, res: Response) => {
  try {
    const { gameType, tournamentType } = req.params;
    const { qrCodeUrl } = req.body;

    if (!qrCodeUrl) {
      return res.status(400).json({ error: "QR code URL is required" });
    }

    const tournament = await storage.updateQRCode(gameType, tournamentType, qrCodeUrl);
    res.json(tournament);
  } catch (error) {
    console.error("Update QR code error:", error);
    res.status(500).json({ error: "Failed to update QR code" });
  }
});

// Initialize storage
(async () => {
  try {
    await storage.initialize();
    console.log("Storage initialized successfully");
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }
})();

// Export the Express app for Vercel
export default app;
