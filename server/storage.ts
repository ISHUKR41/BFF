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
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

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

export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private tournaments: Map<string, Tournament>;
  private registrations: Map<string, Registration>;
  private activityLogs: Map<string, ActivityLog>;

  constructor() {
    this.admins = new Map();
    this.tournaments = new Map();
    this.registrations = new Map();
    this.activityLogs = new Map();
    
    // Initialize default admin
    this.initializeDefaultAdmin();
    
    // Initialize all tournaments
    this.initializeTournaments();
  }

  private async initializeDefaultAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin: Admin = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
    };
    this.admins.set(admin.id, admin);
  }

  private initializeTournaments() {
    // Default QR code URL (using uploaded payment QR image)
    const defaultQR = "/attached_assets/payment-qr-new.jpg";
    
    // Initialize BGMI tournaments
    ["solo", "duo", "squad"].forEach((type) => {
      const tournamentType = type as TournamentType;
      const config = TOURNAMENT_CONFIG.bgmi[tournamentType];
      const key = `bgmi-${type}`;
      const tournament: Tournament = {
        id: randomUUID(),
        gameType: "bgmi",
        tournamentType,
        registeredCount: 0,
        maxSlots: config.maxSlots,
        qrCodeUrl: defaultQR,
        isActive: 1,
      };
      this.tournaments.set(key, tournament);
    });

    // Initialize Free Fire tournaments
    ["solo", "duo", "squad"].forEach((type) => {
      const tournamentType = type as TournamentType;
      const config = TOURNAMENT_CONFIG.freefire[tournamentType];
      const key = `freefire-${type}`;
      const tournament: Tournament = {
        id: randomUUID(),
        gameType: "freefire",
        tournamentType,
        registeredCount: 0,
        maxSlots: config.maxSlots,
        qrCodeUrl: defaultQR,
        isActive: 1,
      };
      this.tournaments.set(key, tournament);
    });
  }

  private getTournamentKey(gameType: GameType, tournamentType: TournamentType): string {
    return `${gameType}-${tournamentType}`;
  }

  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const admin: Admin = {
      ...insertAdmin,
      id,
      password: hashedPassword,
    };
    this.admins.set(id, admin);
    return admin;
  }

  // Tournament operations
  async getTournament(gameType: GameType, tournamentType: TournamentType): Promise<Tournament | undefined> {
    const key = this.getTournamentKey(gameType, tournamentType);
    return this.tournaments.get(key);
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async incrementTournamentCount(gameType: GameType, tournamentType: TournamentType): Promise<Tournament> {
    const key = this.getTournamentKey(gameType, tournamentType);
    const tournament = this.tournaments.get(key);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    tournament.registeredCount++;
    this.tournaments.set(key, tournament);
    return tournament;
  }

  async decrementTournamentCount(gameType: GameType, tournamentType: TournamentType): Promise<Tournament> {
    const key = this.getTournamentKey(gameType, tournamentType);
    const tournament = this.tournaments.get(key);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    if (tournament.registeredCount > 0) {
      tournament.registeredCount--;
    }
    this.tournaments.set(key, tournament);
    return tournament;
  }

  async resetTournament(gameType: GameType, tournamentType: TournamentType): Promise<Tournament> {
    const key = this.getTournamentKey(gameType, tournamentType);
    const tournament = this.tournaments.get(key);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    tournament.registeredCount = 0;
    this.tournaments.set(key, tournament);
    
    // Also delete all registrations for this tournament
    await this.deleteRegistrationsByTournament(gameType, tournamentType);
    
    return tournament;
  }

  async updateQRCode(gameType: GameType, tournamentType: TournamentType, qrCodeUrl: string): Promise<Tournament> {
    const key = this.getTournamentKey(gameType, tournamentType);
    const tournament = this.tournaments.get(key);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    tournament.qrCodeUrl = qrCodeUrl;
    this.tournaments.set(key, tournament);
    return tournament;
  }

  // Registration operations
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const registration: Registration = {
      ...insertRegistration,
      id,
      submittedAt: new Date(),
      teamName: insertRegistration.teamName || null,
      player2Name: insertRegistration.player2Name || null,
      player2GameId: insertRegistration.player2GameId || null,
      player3Name: insertRegistration.player3Name || null,
      player3GameId: insertRegistration.player3GameId || null,
      player4Name: insertRegistration.player4Name || null,
      player4GameId: insertRegistration.player4GameId || null,
      paymentScreenshot: insertRegistration.paymentScreenshot || null,
      paymentVerified: 0,
      adminNotes: null,
      isFlagged: 0,
      lastModifiedAt: null,
      lastModifiedBy: null,
    };
    this.registrations.set(id, registration);
    
    // Increment tournament count
    await this.incrementTournamentCount(
      insertRegistration.gameType as GameType,
      insertRegistration.tournamentType as TournamentType
    );
    
    return registration;
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    return this.registrations.get(id);
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return Array.from(this.registrations.values());
  }

  async getRegistrationsByGame(gameType: GameType, tournamentType: TournamentType): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(
      (reg) => reg.gameType === gameType && reg.tournamentType === tournamentType
    );
  }

  async getRegistrationsByStatus(status: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(
      (reg) => reg.status === status
    );
  }

  async updateRegistrationStatus(id: string, status: "pending" | "approved" | "rejected", adminUsername?: string): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return undefined;
    }
    registration.status = status;
    registration.lastModifiedAt = new Date();
    registration.lastModifiedBy = adminUsername || null;
    this.registrations.set(id, registration);
    
    // Log activity
    if (adminUsername) {
      await this.createActivityLog({
        adminUsername,
        action: status,
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: registration.playerName, teamName: registration.teamName }),
      });
    }
    
    return registration;
  }

  async updateRegistrationDetails(id: string, updates: Partial<Registration>, adminUsername?: string): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return undefined;
    }
    
    Object.assign(registration, updates, {
      lastModifiedAt: new Date(),
      lastModifiedBy: adminUsername || null,
    });
    
    this.registrations.set(id, registration);
    
    // Log activity
    if (adminUsername) {
      await this.createActivityLog({
        adminUsername,
        action: "edit",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ updates, playerName: registration.playerName }),
      });
    }
    
    return registration;
  }

  async updateRegistrationNotes(id: string, notes: string, adminUsername?: string): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return undefined;
    }
    
    registration.adminNotes = notes;
    registration.lastModifiedAt = new Date();
    registration.lastModifiedBy = adminUsername || null;
    this.registrations.set(id, registration);
    
    // Log activity
    if (adminUsername) {
      await this.createActivityLog({
        adminUsername,
        action: "add_note",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: registration.playerName }),
      });
    }
    
    return registration;
  }

  async toggleRegistrationFlag(id: string, adminUsername?: string): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return undefined;
    }
    
    registration.isFlagged = registration.isFlagged === 1 ? 0 : 1;
    registration.lastModifiedAt = new Date();
    registration.lastModifiedBy = adminUsername || null;
    this.registrations.set(id, registration);
    
    // Log activity
    if (adminUsername) {
      await this.createActivityLog({
        adminUsername,
        action: registration.isFlagged === 1 ? "flag" : "unflag",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: registration.playerName }),
      });
    }
    
    return registration;
  }

  async togglePaymentVerification(id: string, adminUsername?: string): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return undefined;
    }
    
    registration.paymentVerified = registration.paymentVerified === 1 ? 0 : 1;
    registration.lastModifiedAt = new Date();
    registration.lastModifiedBy = adminUsername || null;
    this.registrations.set(id, registration);
    
    // Log activity
    if (adminUsername) {
      await this.createActivityLog({
        adminUsername,
        action: registration.paymentVerified === 1 ? "verify_payment" : "unverify_payment",
        targetType: "registration",
        targetId: id,
        details: JSON.stringify({ playerName: registration.playerName }),
      });
    }
    
    return registration;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return false;
    }
    
    // Decrement tournament count
    await this.decrementTournamentCount(
      registration.gameType as GameType,
      registration.tournamentType as TournamentType
    );
    
    this.registrations.delete(id);
    return true;
  }

  async deleteRegistrationsByTournament(gameType: GameType, tournamentType: TournamentType): Promise<void> {
    const toDelete: string[] = [];
    this.registrations.forEach((reg, id) => {
      if (reg.gameType === gameType && reg.tournamentType === tournamentType) {
        toDelete.push(id);
      }
    });
    toDelete.forEach((id) => this.registrations.delete(id));
  }

  async searchRegistrations(query: string): Promise<Registration[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.registrations.values()).filter((reg) => {
      return (
        reg.playerName.toLowerCase().includes(lowerQuery) ||
        reg.gameId.toLowerCase().includes(lowerQuery) ||
        reg.whatsapp.includes(lowerQuery) ||
        reg.transactionId.toLowerCase().includes(lowerQuery) ||
        (reg.teamName && reg.teamName.toLowerCase().includes(lowerQuery)) ||
        (reg.player2Name && reg.player2Name.toLowerCase().includes(lowerQuery)) ||
        (reg.player3Name && reg.player3Name.toLowerCase().includes(lowerQuery)) ||
        (reg.player4Name && reg.player4Name.toLowerCase().includes(lowerQuery)) ||
        (reg.adminNotes && reg.adminNotes.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // Activity log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
      details: insertLog.details || null,
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getAllActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (limit) {
      return logs.slice(0, limit);
    }
    return logs;
  }

  async getActivityLogsByTarget(targetType: string, targetId: string): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.targetType === targetType && log.targetId === targetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();
