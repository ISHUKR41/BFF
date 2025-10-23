import {
  type Registration,
  type InsertRegistration,
  type Tournament,
  type InsertTournament,
  type Admin,
  type InsertAdmin,
  type ActivityLog,
  type InsertActivityLog,
  type GameType,
  type TournamentType,
  TOURNAMENT_CONFIG,
  admins,
  tournaments,
  registrations,
  activityLogs,
} from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const sqlClient = neon(connectionString);
const db = drizzle(sqlClient);

export interface IStorage {
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Tournament operations
  getTournament(gameType: GameType, tournamentType: TournamentType): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  incrementTournamentCount(gameType: GameType, tournamentType: TournamentType): Promise<Tournament>;
  decrementTournamentCount(gameType: GameType, tournamentType: TournamentType): Promise<Tournament>;
  resetTournament(gameType: GameType, tournamentType: TournamentType): Promise<Tournament>;
  updateQRCode(gameType: GameType, tournamentType: TournamentType, qrCodeUrl: string): Promise<Tournament>;
  
  // Registration operations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistration(id: string): Promise<Registration | undefined>;
  getAllRegistrations(): Promise<Registration[]>;
  getRegistrationsByGame(gameType: GameType, tournamentType: TournamentType): Promise<Registration[]>;
  getRegistrationsByStatus(status: string): Promise<Registration[]>;
  updateRegistrationStatus(id: string, status: "pending" | "approved" | "rejected", adminUsername?: string): Promise<Registration | undefined>;
  updateRegistrationDetails(id: string, updates: Partial<Registration>, adminUsername?: string): Promise<Registration | undefined>;
  updateRegistrationNotes(id: string, notes: string, adminUsername?: string): Promise<Registration | undefined>;
  toggleRegistrationFlag(id: string, adminUsername?: string): Promise<Registration | undefined>;
  togglePaymentVerification(id: string, adminUsername?: string): Promise<Registration | undefined>;
  deleteRegistration(id: string): Promise<boolean>;
  deleteRegistrationsByTournament(gameType: GameType, tournamentType: TournamentType): Promise<void>;
  searchRegistrations(query: string): Promise<Registration[]>;
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByTarget(targetType: string, targetId: string): Promise<ActivityLog[]>;
}

export class DbStorage implements IStorage {
  private ready: Promise<void>;

  constructor() {
    this.ready = this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize default admin if not exists
    await this.initializeDefaultAdmin();
    
    // Initialize all tournaments
    await this.initializeTournaments();
  }

  async waitReady(): Promise<void> {
    await this.ready;
  }

  private async initializeDefaultAdmin() {
    try {
      const existingAdmin = await db.select().from(admins).where(eq(admins.username, "admin")).limit(1);
      
      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.insert(admins).values({
          username: "admin",
          password: hashedPassword,
        });
      }
    } catch (error) {
      console.error("Error initializing default admin:", error);
    }
  }

  private async initializeTournaments() {
    try {
      // Default QR code URL
      const defaultQR = "/attached_assets/payment-qr-new.jpg";
      
      // Initialize BGMI tournaments
      for (const type of ["solo", "duo", "squad"] as const) {
        const config = TOURNAMENT_CONFIG.bgmi[type];
        const existing = await db.select().from(tournaments)
          .where(and(eq(tournaments.gameType, "bgmi"), eq(tournaments.tournamentType, type)))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(tournaments).values({
            gameType: "bgmi",
            tournamentType: type,
            registeredCount: 0,
            maxSlots: config.maxSlots,
            qrCodeUrl: defaultQR,
            isActive: 1,
          });
        }
      }

      // Initialize Free Fire tournaments
      for (const type of ["solo", "duo", "squad"] as const) {
        const config = TOURNAMENT_CONFIG.freefire[type];
        const existing = await db.select().from(tournaments)
          .where(and(eq(tournaments.gameType, "freefire"), eq(tournaments.tournamentType, type)))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(tournaments).values({
            gameType: "freefire",
            tournamentType: type,
            registeredCount: 0,
            maxSlots: config.maxSlots,
            qrCodeUrl: defaultQR,
            isActive: 1,
          });
        }
      }
    } catch (error) {
      console.error("Error initializing tournaments:", error);
    }
  }

  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    return result[0];
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
    return result[0];
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const result = await db.insert(admins).values({
      username: insertAdmin.username,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  // Tournament operations
  async getTournament(gameType: GameType, tournamentType: TournamentType): Promise<Tournament | undefined> {
    const result = await db.select().from(tournaments)
      .where(and(eq(tournaments.gameType, gameType), eq(tournaments.tournamentType, tournamentType)))
      .limit(1);
    return result[0];
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments);
  }

  async incrementTournamentCount(gameType: GameType, tournamentType: TournamentType): Promise<Tournament> {
    const result = await db.update(tournaments)
      .set({ registeredCount: sql`${tournaments.registeredCount} + 1` })
      .where(and(eq(tournaments.gameType, gameType), eq(tournaments.tournamentType, tournamentType)))
      .returning();
    
    if (!result[0]) {
      throw new Error("Tournament not found");
    }
    return result[0];
  }

  async decrementTournamentCount(gameType: GameType, tournamentType: TournamentType): Promise<Tournament> {
    const tournament = await this.getTournament(gameType, tournamentType);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    const newCount = Math.max(0, tournament.registeredCount - 1);
    const result = await db.update(tournaments)
      .set({ registeredCount: newCount })
      .where(and(eq(tournaments.gameType, gameType), eq(tournaments.tournamentType, tournamentType)))
      .returning();
    
    return result[0];
  }

  async resetTournament(gameType: GameType, tournamentType: TournamentType): Promise<Tournament> {
    // Delete all registrations for this tournament
    await this.deleteRegistrationsByTournament(gameType, tournamentType);
    
    // Reset count to 0
    const result = await db.update(tournaments)
      .set({ registeredCount: 0 })
      .where(and(eq(tournaments.gameType, gameType), eq(tournaments.tournamentType, tournamentType)))
      .returning();
    
    if (!result[0]) {
      throw new Error("Tournament not found");
    }
    return result[0];
  }

  async updateQRCode(gameType: GameType, tournamentType: TournamentType, qrCodeUrl: string): Promise<Tournament> {
    const result = await db.update(tournaments)
      .set({ qrCodeUrl })
      .where(and(eq(tournaments.gameType, gameType), eq(tournaments.tournamentType, tournamentType)))
      .returning();
    
    if (!result[0]) {
      throw new Error("Tournament not found");
    }
    return result[0];
  }

  // Registration operations
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    // Get tournament and check slots atomically
    const tournament = await this.getTournament(
      insertRegistration.gameType as GameType,
      insertRegistration.tournamentType as TournamentType
    );
    
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    if (tournament.registeredCount >= tournament.maxSlots) {
      throw new Error("Tournament is full");
    }
    
    // Create registration
    const result = await db.insert(registrations).values({
      gameType: insertRegistration.gameType,
      tournamentType: insertRegistration.tournamentType,
      teamName: insertRegistration.teamName || null,
      playerName: insertRegistration.playerName,
      gameId: insertRegistration.gameId,
      whatsapp: insertRegistration.whatsapp,
      player2Name: insertRegistration.player2Name || null,
      player2GameId: insertRegistration.player2GameId || null,
      player3Name: insertRegistration.player3Name || null,
      player3GameId: insertRegistration.player3GameId || null,
      player4Name: insertRegistration.player4Name || null,
      player4GameId: insertRegistration.player4GameId || null,
      paymentScreenshot: insertRegistration.paymentScreenshot || null,
      transactionId: insertRegistration.transactionId,
      status: "pending",
      paymentVerified: 0,
      isFlagged: 0,
    }).returning();
    
    // Increment tournament count after successful insertion
    await this.incrementTournamentCount(
      insertRegistration.gameType as GameType,
      insertRegistration.tournamentType as TournamentType
    );
    
    return result[0];
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const result = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
    return result[0];
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return await db.select().from(registrations).orderBy(desc(registrations.submittedAt));
  }

  async getRegistrationsByGame(gameType: GameType, tournamentType: TournamentType): Promise<Registration[]> {
    return await db.select().from(registrations)
      .where(and(eq(registrations.gameType, gameType), eq(registrations.tournamentType, tournamentType)))
      .orderBy(desc(registrations.submittedAt));
  }

  async getRegistrationsByStatus(status: string): Promise<Registration[]> {
    return await db.select().from(registrations)
      .where(eq(registrations.status, status))
      .orderBy(desc(registrations.submittedAt));
  }

  async updateRegistrationStatus(id: string, status: "pending" | "approved" | "rejected", adminUsername?: string): Promise<Registration | undefined> {
    const result = await db.update(registrations)
      .set({ 
        status, 
        lastModifiedAt: new Date(),
        lastModifiedBy: adminUsername || null,
      })
      .where(eq(registrations.id, id))
      .returning();
    
    // Log activity
    if (adminUsername && result[0]) {
      await this.createActivityLog({
        adminUsername,
        action: status,
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: result[0].playerName, teamName: result[0].teamName }),
      });
    }
    
    return result[0];
  }

  async updateRegistrationDetails(id: string, updates: Partial<Registration>, adminUsername?: string): Promise<Registration | undefined> {
    const result = await db.update(registrations)
      .set({ 
        ...updates,
        lastModifiedAt: new Date(),
        lastModifiedBy: adminUsername || null,
      })
      .where(eq(registrations.id, id))
      .returning();
    
    // Log activity
    if (adminUsername && result[0]) {
      await this.createActivityLog({
        adminUsername,
        action: "edit",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ updates, playerName: result[0].playerName }),
      });
    }
    
    return result[0];
  }

  async updateRegistrationNotes(id: string, notes: string, adminUsername?: string): Promise<Registration | undefined> {
    const result = await db.update(registrations)
      .set({ 
        adminNotes: notes,
        lastModifiedAt: new Date(),
        lastModifiedBy: adminUsername || null,
      })
      .where(eq(registrations.id, id))
      .returning();
    
    // Log activity
    if (adminUsername && result[0]) {
      await this.createActivityLog({
        adminUsername,
        action: "add_note",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: result[0].playerName }),
      });
    }
    
    return result[0];
  }

  async toggleRegistrationFlag(id: string, adminUsername?: string): Promise<Registration | undefined> {
    const current = await this.getRegistration(id);
    if (!current) {
      return undefined;
    }
    
    const newFlagValue = current.isFlagged === 1 ? 0 : 1;
    const result = await db.update(registrations)
      .set({ 
        isFlagged: newFlagValue,
        lastModifiedAt: new Date(),
        lastModifiedBy: adminUsername || null,
      })
      .where(eq(registrations.id, id))
      .returning();
    
    // Log activity
    if (adminUsername && result[0]) {
      await this.createActivityLog({
        adminUsername,
        action: newFlagValue === 1 ? "flag" : "unflag",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: result[0].playerName }),
      });
    }
    
    return result[0];
  }

  async togglePaymentVerification(id: string, adminUsername?: string): Promise<Registration | undefined> {
    const current = await this.getRegistration(id);
    if (!current) {
      return undefined;
    }
    
    const newVerifiedValue = current.paymentVerified === 1 ? 0 : 1;
    const result = await db.update(registrations)
      .set({ 
        paymentVerified: newVerifiedValue,
        lastModifiedAt: new Date(),
        lastModifiedBy: adminUsername || null,
      })
      .where(eq(registrations.id, id))
      .returning();
    
    // Log activity
    if (adminUsername && result[0]) {
      await this.createActivityLog({
        adminUsername,
        action: newVerifiedValue === 1 ? "verify_payment" : "unverify_payment",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: result[0].playerName }),
      });
    }
    
    return result[0];
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const registration = await this.getRegistration(id);
    if (!registration) {
      return false;
    }
    
    // Decrement tournament count
    await this.decrementTournamentCount(
      registration.gameType as GameType,
      registration.tournamentType as TournamentType
    );
    
    await db.delete(registrations).where(eq(registrations.id, id));
    return true;
  }

  async deleteRegistrationsByTournament(gameType: GameType, tournamentType: TournamentType): Promise<void> {
    await db.delete(registrations)
      .where(and(eq(registrations.gameType, gameType), eq(registrations.tournamentType, tournamentType)));
  }

  async searchRegistrations(query: string): Promise<Registration[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(registrations)
      .where(
        or(
          like(sql`LOWER(${registrations.playerName})`, lowerQuery),
          like(sql`LOWER(${registrations.gameId})`, lowerQuery),
          like(registrations.whatsapp, lowerQuery),
          like(sql`LOWER(${registrations.transactionId})`, lowerQuery),
          like(sql`LOWER(${registrations.teamName})`, lowerQuery),
          like(sql`LOWER(${registrations.player2Name})`, lowerQuery),
          like(sql`LOWER(${registrations.player3Name})`, lowerQuery),
          like(sql`LOWER(${registrations.player4Name})`, lowerQuery),
          like(sql`LOWER(${registrations.adminNotes})`, lowerQuery)
        )
      )
      .orderBy(desc(registrations.submittedAt));
  }

  // Activity log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values({
      adminUsername: insertLog.adminUsername,
      action: insertLog.action,
      targetType: insertLog.targetType,
      targetId: insertLog.targetId,
      details: insertLog.details || null,
    }).returning();
    return result[0];
  }

  async getAllActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const query = db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getActivityLogsByTarget(targetType: string, targetId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .where(and(eq(activityLogs.targetType, targetType), eq(activityLogs.targetId, targetId)))
      .orderBy(desc(activityLogs.timestamp));
  }
}

export const storage = new DbStorage();
