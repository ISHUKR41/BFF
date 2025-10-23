import express, { type Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { registerVercelRoutes } from "./routes-vercel";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage-vercel";
import { testConnection } from "./database";

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
    limit: "10mb", // Increased for image uploads
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// CORS middleware for production
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Allow requests from your domain and localhost
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5000",
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
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

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

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse && res.statusCode >= 400) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbHealthy ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    };

    res.json(status);
  } catch (error: any) {
    log(`Health check failed: ${error.message}`);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// Initialize and start server
(async () => {
  try {
    log("Starting server initialization...");

    // Test database connection
    const dbHealthy = await testConnection();
    if (!dbHealthy) {
      throw new Error("Database connection failed");
    }
    log("Database connection verified");

    // Initialize storage
    await storage.initialize();
    log("Storage initialized successfully");

    // Register API routes
    const server = await registerVercelRoutes(app);
    log("API routes registered");

    // Global error handler
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log detailed error information
      const errorLog = {
        timestamp: new Date().toISOString(),
        status,
        message,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      };
      
      log(`Error ${status}: ${message} - ${req.method} ${req.url}`);
      console.error('Detailed error info:', JSON.stringify(errorLog, null, 2));
      
      // Send appropriate response based on error type
      if (status === 500) {
        // For server errors, provide a generic message to clients
        res.status(status).json({
          error: "An unexpected error occurred. Please try again later.",
          ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
      } else {
        // For client errors, provide specific messages
        res.status(status).json({
          error: message,
          ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
      }
    });

    // Setup Vite or static serving
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      log("Vite development server setup completed");
    } else {
      serveStatic(app);
      log("Static file serving setup completed");
    }

    // Start server
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`🚀 Server running on port ${port}`);
        log(`🏆 Tournament system ready!`);
        if (process.env.NODE_ENV === "development") {
          log(`📊 Admin panel: http://localhost:${port}/admin/login`);
          log(`🎮 BGMI tournaments: http://localhost:${port}/bgmi`);
          log(`🔥 Free Fire tournaments: http://localhost:${port}/freefire`);
        }
      }
    );
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  log("SIGINT received, shutting down gracefully");
  process.exit(0);
});