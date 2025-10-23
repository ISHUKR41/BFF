import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and, or, like, desc, sql } from "drizzle-orm";

// Create SQLite database instance
const sqlite = new Database("./database.db");
const db = drizzle(sqlite);

export { db, eq, and, or, like, desc, sql };

// Health check function
export async function testConnection() {
  try {
    const result = sqlite.prepare("SELECT 1").get();
    console.log("SQLite database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
