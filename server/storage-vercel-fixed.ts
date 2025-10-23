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
import { db } from "./database";
import { eq, and, or, like, desc, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  validateAdmin(username: string, password: string): Promise<Admin | null>;

  // Tournament operations
  getTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  updateTournamentCount(
    gameType: GameType,
    tournamentType: TournamentType,
    increment: number
  ): Promise<Tournament>;
  resetTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Tournament>;
  updateQRCode(
    gameType: GameType,
    tournamentType: TournamentType,
    qrCodeUrl: string
  ): Promise<Tournament>;

  // Registration operations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistration(id: string): Promise<Registration | undefined>;
  getAllRegistrations(): Promise<Registration[]>;
  getRegistrationsByGame(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Registration[]>;
  getRegistrationsByStatus(status: string): Promise<Registration[]>;
  updateRegistrationStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    adminUsername?: string
  ): Promise<Registration | undefined>;
  updateRegistrationDetails(
    id: string,
    updates: Partial<Registration>,
    adminUsername?: string
  ): Promise<Registration | undefined>;
  updateRegistrationNotes(
    id: string,
    notes: string,
    adminUsername?: string
  ): Promise<Registration | undefined>;
  toggleRegistrationFlag(
    id: string,
    adminUsername?: string
  ): Promise<Registration | undefined>;
  togglePaymentVerification(
    id: string,
    adminUsername?: string
  ): Promise<Registration | undefined>;
  deleteRegistration(id: string): Promise<boolean>;
  deleteRegistrationsByTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<void>;
  searchRegistrations(query: string): Promise<Registration[]>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByTarget(
    targetType: string,
    targetId: string
  ): Promise<ActivityLog[]>;

  // Initialization
  initialize(): Promise<void>;
}

export class VercelStorageFixed implements IStorage {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize default admin if not exists
      await this.initializeDefaultAdmin();

      // Initialize all tournaments
      await this.initializeTournaments();

      this.isInitialized = true;
      console.log("Storage initialized successfully");
    } catch (error) {
      console.error("Error initializing storage:", error);
      // Even if initialization fails, we still mark as initialized to prevent infinite loops
      this.isInitialized = true;
      throw error;
    }
  }

  private async initializeDefaultAdmin() {
    try {
      const existingAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.username, "admin"))
        .limit(1);

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 12); // Increased salt rounds for security
        await db.insert(admins).values({
          username: "admin",
          password: hashedPassword,
        });
        console.log("Default admin created successfully");
      }
    } catch (error) {
      console.error("Error initializing default admin:", error);
      throw error;
    }
  }

  private async initializeTournaments() {
    try {
      const defaultQR = "/attached_assets/payment-qr-new.jpg";

      // Initialize BGMI tournaments
      for (const type of ["solo", "duo", "squad"] as const) {
        const config = TOURNAMENT_CONFIG.bgmi[type];
        const existing = await db
          .select()
          .from(tournaments)
          .where(
            and(
              eq(tournaments.gameType, "bgmi"),
              eq(tournaments.tournamentType, type)
            )
          )
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
        const existing = await db
          .select()
          .from(tournaments)
          .where(
            and(
              eq(tournaments.gameType, "freefire"),
              eq(tournaments.tournamentType, type)
            )
          )
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

      console.log("Tournaments initialized successfully");
    } catch (error) {
      console.error("Error initializing tournaments:", error);
      throw error;
    }
  }

  private async getActualRegistrationCount(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.gameType, gameType),
          eq(registrations.tournamentType, tournamentType),
          or(
            eq(registrations.status, "pending"),
            eq(registrations.status, "approved")
          )
        )
      );

    return result[0]?.count ?? 0;
  }

  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    try {
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting admin:", error);
      return undefined;
    }
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    try {
      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting admin by username:", error);
      return undefined;
    }
  }

  async validateAdmin(
    username: string,
    password: string
  ): Promise<Admin | null> {
    try {
      const admin = await this.getAdminByUsername(username);
      if (!admin) return null;

      const isValid = await bcrypt.compare(password, admin.password);
      return isValid ? admin : null;
    } catch (error) {
      console.error("Error validating admin:", error);
      return null;
    }
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    try {
      const hashedPassword = await bcrypt.hash(insertAdmin.password, 12);
      const result = await db
        .insert(admins)
        .values({
          username: insertAdmin.username,
          password: hashedPassword,
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating admin:", error);
      throw error;
    }
  }

  // Tournament operations
  async getTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Tournament | undefined> {
    try {
      const result = await db
        .select()
        .from(tournaments)
        .where(
          and(
            eq(tournaments.gameType, gameType),
            eq(tournaments.tournamentType, tournamentType)
          )
        )
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting tournament:", error);
      return undefined;
    }
  }

  async getAllTournaments(): Promise<Tournament[]> {
    try {
      // For Vercel deployment, we need to ensure accurate counts
      // Get all tournaments first
      const allTournaments = await db.select().from(tournaments);
      
      // Update counts for each tournament to ensure accuracy
      const updatedTournaments = await Promise.all(
        allTournaments.map(async (tournament: Tournament) => {
          const actualCount = await this.getActualRegistrationCount(
            tournament.gameType as GameType,
            tournament.tournamentType as TournamentType
          );
          
          // Only update if count is different
          if (tournament.registeredCount !== actualCount) {
            const result = await db
              .update(tournaments)
              .set({ registeredCount: actualCount })
              .where(eq(tournaments.id, tournament.id))
              .returning();
            return result[0];
          }
          
          return tournament;
        })
      );
      
      return updatedTournaments;
    } catch (error) {
      console.error("Error getting all tournaments:", error);
      return [];
    }
  }

  async updateTournamentCount(
    gameType: GameType,
    tournamentType: TournamentType,
    increment: number
  ): Promise<Tournament> {
    try {
      // Use database-level atomic increment to ensure consistency in serverless environments
      const result = await db
        .update(tournaments)
        .set({ 
          registeredCount: sql`${tournaments.registeredCount} + ${increment}` 
        })
        .where(
          and(
            eq(tournaments.gameType, gameType),
            eq(tournaments.tournamentType, tournamentType)
          )
        )
        .returning();

      if (!result[0]) {
        throw new Error("Tournament not found");
      }
      
      // Ensure count never goes below 0
      if (result[0].registeredCount < 0) {
        await db
          .update(tournaments)
          .set({ registeredCount: 0 })
          .where(
            and(
              eq(tournaments.gameType, gameType),
              eq(tournaments.tournamentType, tournamentType)
            )
          );
          
        const correctedResult = await db
          .select()
          .from(tournaments)
          .where(
            and(
              eq(tournaments.gameType, gameType),
              eq(tournaments.tournamentType, tournamentType)
            )
          )
          .limit(1);
          
        return correctedResult[0];
      }
      
      return result[0];
    } catch (error) {
      console.error("Error updating tournament count:", error);
      throw error;
    }
  }

  async resetTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Tournament> {
    try {
      // Delete all registrations for this tournament
      await this.deleteRegistrationsByTournament(gameType, tournamentType);

      // Reset count to 0 using atomic update
      const result = await db
        .update(tournaments)
        .set({ registeredCount: 0 })
        .where(
          and(
            eq(tournaments.gameType, gameType),
            eq(tournaments.tournamentType, tournamentType)
          )
        )
        .returning();

      if (!result[0]) {
        throw new Error("Tournament not found");
      }
      return result[0];
    } catch (error) {
      console.error("Error resetting tournament:", error);
      throw error;
    }
  }

  async updateQRCode(
    gameType: GameType,
    tournamentType: TournamentType,
    qrCodeUrl: string
  ): Promise<Tournament> {
    try {
      const result = await db
        .update(tournaments)
        .set({ qrCodeUrl })
        .where(
          and(
            eq(tournaments.gameType, gameType),
            eq(tournaments.tournamentType, tournamentType)
          )
        )
        .returning();

      if (!result[0]) {
        throw new Error("Tournament not found");
      }
      return result[0];
    } catch (error) {
      console.error("Error updating QR code:", error);
      throw error;
    }
  }

  // Registration operations
  async createRegistration(
    insertRegistration: InsertRegistration
  ): Promise<Registration> {
    try {
      // Check tournament availability using a transaction-like approach
      const tournament = await this.getTournament(
        insertRegistration.gameType as GameType,
        insertRegistration.tournamentType as TournamentType
      );

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Check if tournament is full
      if (tournament.registeredCount >= tournament.maxSlots) {
        throw new Error("Tournament is full");
      }

      // Create registration
      const result = await db
        .insert(registrations)
        .values({
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
        })
        .returning();

      // Atomically update tournament count
      await this.updateTournamentCount(
        insertRegistration.gameType as GameType,
        insertRegistration.tournamentType as TournamentType,
        1
      );

      return result[0];
    } catch (error) {
      console.error("Error creating registration:", error);
      throw error;
    }
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    try {
      const result = await db
        .select()
        .from(registrations)
        .where(eq(registrations.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting registration:", error);
      return undefined;
    }
  }

  async getAllRegistrations(): Promise<Registration[]> {
    try {
      return await db
        .select()
        .from(registrations)
        .orderBy(desc(registrations.submittedAt));
    } catch (error) {
      console.error("Error getting all registrations:", error);
      return [];
    }
  }

  async getRegistrationsByGame(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Registration[]> {
    try {
      return await db
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.gameType, gameType),
            eq(registrations.tournamentType, tournamentType)
          )
        )
        .orderBy(desc(registrations.submittedAt));
    } catch (error) {
      console.error("Error getting registrations by game:", error);
      return [];
    }
  }

  async getRegistrationsByStatus(status: string): Promise<Registration[]> {
    try {
      return await db
        .select()
        .from(registrations)
        .where(eq(registrations.status, status))
        .orderBy(desc(registrations.submittedAt));
    } catch (error) {
      console.error("Error getting registrations by status:", error);
      return [];
    }
  }

  async updateRegistrationStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    adminUsername?: string
  ): Promise<Registration | undefined> {
    try {
      const result = await db
        .update(registrations)
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
          details: JSON.stringify({
            playerName: result[0].playerName,
            teamName: result[0].teamName,
            gameType: result[0].gameType,
            tournamentType: result[0].tournamentType,
          }),
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error updating registration status:", error);
      return undefined;
    }
  }

  async updateRegistrationDetails(
    id: string,
    updates: Partial<Registration>,
    adminUsername?: string
  ): Promise<Registration | undefined> {
    try {
      const result = await db
        .update(registrations)
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
          details: JSON.stringify({
            updates,
            playerName: result[0].playerName,
          }),
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error updating registration details:", error);
      return undefined;
    }
  }

  async updateRegistrationNotes(
    id: string,
    notes: string,
    adminUsername?: string
  ): Promise<Registration | undefined> {
    try {
      const result = await db
        .update(registrations)
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
          details: JSON.stringify({ notes, playerName: result[0].playerName }),
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error updating registration notes:", error);
      return undefined;
    }
  }

  async toggleRegistrationFlag(
    id: string,
    adminUsername?: string
  ): Promise<Registration | undefined> {
    try {
      const current = await this.getRegistration(id);
      if (!current) return undefined;

      const newFlagStatus = current.isFlagged === 1 ? 0 : 1;

      const result = await db
        .update(registrations)
        .set({
          isFlagged: newFlagStatus,
          lastModifiedAt: new Date(),
          lastModifiedBy: adminUsername || null,
        })
        .where(eq(registrations.id, id))
        .returning();

      // Log activity
      if (adminUsername && result[0]) {
        await this.createActivityLog({
          adminUsername,
          action: newFlagStatus === 1 ? "flag" : "unflag",
          targetType: "registration",
          targetId: id,
          details: JSON.stringify({ playerName: result[0].playerName }),
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error toggling registration flag:", error);
      return undefined;
    }
  }

  async togglePaymentVerification(
    id: string,
    adminUsername?: string
  ): Promise<Registration | undefined> {
    try {
      const current = await this.getRegistration(id);
      if (!current) return undefined;

      const newVerificationStatus = current.paymentVerified === 1 ? 0 : 1;

      const result = await db
        .update(registrations)
        .set({
          paymentVerified: newVerificationStatus,
          lastModifiedAt: new Date(),
          lastModifiedBy: adminUsername || null,
        })
        .where(eq(registrations.id, id))
        .returning();

      // Log activity
      if (adminUsername && result[0]) {
        await this.createActivityLog({
          adminUsername,
          action:
            newVerificationStatus === 1 ? "verify_payment" : "unverify_payment",
          targetType: "registration",
          targetId: id,
          details: JSON.stringify({
            playerName: result[0].playerName,
            transactionId: result[0].transactionId,
          }),
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error toggling payment verification:", error);
      return undefined;
    }
  }

  async deleteRegistration(id: string): Promise<boolean> {
    try {
      const registration = await this.getRegistration(id);
      if (!registration) return false;

      const result = await db
        .delete(registrations)
        .where(eq(registrations.id, id))
        .returning();

      if (result.length > 0) {
        // Update tournament count
        await this.updateTournamentCount(
          registration.gameType as GameType,
          registration.tournamentType as TournamentType,
          -1
        );
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting registration:", error);
      return false;
    }
  }

  async deleteRegistrationsByTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<void> {
    try {
      // Get count of registrations to be deleted
      const registrationsToDelete = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(
          and(
            eq(registrations.gameType, gameType),
            eq(registrations.tournamentType, tournamentType)
          )
        );
      
      const count = registrationsToDelete.length;
      
      // Delete registrations
      await db
        .delete(registrations)
        .where(
          and(
            eq(registrations.gameType, gameType),
            eq(registrations.tournamentType, tournamentType)
          )
        );
      
      // Update tournament count atomically
      if (count > 0) {
        await this.updateTournamentCount(
          gameType,
          tournamentType,
          -count
        );
      }
    } catch (error) {
      console.error("Error deleting registrations by tournament:", error);
      throw error;
    }
  }

  async searchRegistrations(query: string): Promise<Registration[]> {
    try {
      const searchPattern = `%${query}%`;
      return await db
        .select()
        .from(registrations)
        .where(
          or(
            like(registrations.playerName, searchPattern),
            like(registrations.teamName, searchPattern),
            like(registrations.gameId, searchPattern),
            like(registrations.whatsapp, searchPattern),
            like(registrations.transactionId, searchPattern)
          )
        )
        .orderBy(desc(registrations.submittedAt));
    } catch (error) {
      console.error("Error searching registrations:", error);
      return [];
    }
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      const result = await db.insert(activityLogs).values(log).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating activity log:", error);
      throw error;
    }
  }

  async getAllActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    try {
      return await db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Error getting activity logs:", error);
      return [];
    }
  }

  async getActivityLogsByTarget(
    targetType: string,
    targetId: string
  ): Promise<ActivityLog[]> {
    try {
      return await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.targetType, targetType),
            eq(activityLogs.targetId, targetId)
          )
        )
        .orderBy(desc(activityLogs.timestamp));
    } catch (error) {
      console.error("Error getting activity logs by target:", error);
      return [];
    }
  }
}

// Create storage instance
export const storageFixed = new VercelStorageFixed();