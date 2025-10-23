import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, like, desc, sql } from "drizzle-orm";

// Configure neon for better performance
neonConfig.fetchConnectionCache = true;

// Connection pool for serverless
const connectionCache = new Map<string, ReturnType<typeof drizzle>>();

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure your database connection."
    );
  }

  const connectionString = process.env.DATABASE_URL;

  // Use cached connection if available
  if (connectionCache.has(connectionString)) {
    return connectionCache.get(connectionString)!;
  }

  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);

  // Cache the connection
  connectionCache.set(connectionString, db);

  return db;
}

// Export database instance
export const db = getDb();

// Health check function
export async function testConnection() {
  try {
    // For Vercel serverless, we need to handle connection differently
    if (process.env.VERCEL) {
      // Simple query to test connection
      const result = await db.execute(sql`SELECT 1 as test`);
      console.log("Database connection successful");
      return true;
    } else {
      await db.execute(sql`SELECT 1`);
      console.log("Database connection successful");
      return true;
    }
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
