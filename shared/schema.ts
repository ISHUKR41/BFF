import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Tournaments table for tracking slots
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameType: text("game_type").notNull(), // "bgmi" | "freefire"
  tournamentType: text("tournament_type").notNull(), // "solo" | "duo" | "squad"
  registeredCount: integer("registered_count").notNull().default(0),
  maxSlots: integer("max_slots").notNull(),
  qrCodeUrl: text("qr_code_url"),
  isActive: integer("is_active").notNull().default(1), // 1 = true, 0 = false
});

export const insertTournamentSchema = createInsertSchema(tournaments).pick({
  gameType: true,
  tournamentType: true,
  maxSlots: true,
  qrCodeUrl: true,
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

// Registrations table
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameType: text("game_type").notNull(), // "bgmi" | "freefire"
  tournamentType: text("tournament_type").notNull(), // "solo" | "duo" | "squad"
  teamName: text("team_name"),
  
  // Team leader / Solo player
  playerName: text("player_name").notNull(),
  gameId: text("game_id").notNull(),
  whatsapp: text("whatsapp").notNull(),
  
  // Additional players for duo/squad
  player2Name: text("player2_name"),
  player2GameId: text("player2_game_id"),
  
  player3Name: text("player3_name"),
  player3GameId: text("player3_game_id"),
  
  player4Name: text("player4_name"),
  player4GameId: text("player4_game_id"),
  
  // Payment info
  paymentScreenshot: text("payment_screenshot"),
  transactionId: text("transaction_id").notNull(),
  paymentVerified: integer("payment_verified").default(0), // 0 = not verified, 1 = verified
  
  // Admin fields
  adminNotes: text("admin_notes"),
  isFlagged: integer("is_flagged").default(0), // 0 = not flagged, 1 = flagged
  
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  submittedAt: timestamp("submitted_at").notNull().default(sql`now()`),
  lastModifiedAt: timestamp("last_modified_at"),
  lastModifiedBy: text("last_modified_by"),
});

// Activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUsername: text("admin_username").notNull(),
  action: text("action").notNull(), // "approve", "reject", "delete", "edit", "flag", etc.
  targetType: text("target_type").notNull(), // "registration", "tournament", "qr_code"
  targetId: text("target_id").notNull(),
  details: text("details"), // JSON string with action details
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  submittedAt: true,
}).extend({
  gameType: z.enum(["bgmi", "freefire"]),
  tournamentType: z.enum(["solo", "duo", "squad"]),
  teamName: z.string().optional(),
  playerName: z.string().min(1, "Player name is required"),
  gameId: z.string().min(1, "Game ID is required"),
  whatsapp: z.string().min(10, "Valid WhatsApp number required"),
  player2Name: z.string().optional(),
  player2GameId: z.string().optional(),
  player3Name: z.string().optional(),
  player3GameId: z.string().optional(),
  player4Name: z.string().optional(),
  player4GameId: z.string().optional(),
  paymentScreenshot: z.string().optional(),
  transactionId: z.string().min(1, "Transaction ID is required"),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

// Activity log schema
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Tournament configuration constants
export const TOURNAMENT_CONFIG = {
  bgmi: {
    solo: { maxSlots: 100, entryFee: 20, winner: 350, runnerUp: 250, perKill: 9, maxPlayers: 1 },
    duo: { maxSlots: 50, entryFee: 40, winner: 350, runnerUp: 250, perKill: 9, maxPlayers: 2 },
    squad: { maxSlots: 25, entryFee: 80, winner: 350, runnerUp: 250, perKill: 9, maxPlayers: 4 },
  },
  freefire: {
    solo: { maxSlots: 48, entryFee: 20, winner: 350, runnerUp: 150, perKill: 5, maxPlayers: 1 },
    duo: { maxSlots: 24, entryFee: 40, winner: 350, runnerUp: 150, perKill: 5, maxPlayers: 2 },
    squad: { maxSlots: 12, entryFee: 80, winner: 350, runnerUp: 150, perKill: 5, maxPlayers: 4 },
  },
} as const;

export type GameType = "bgmi" | "freefire";
export type TournamentType = "solo" | "duo" | "squad";
