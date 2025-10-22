import {
  type Registration,
  type InsertRegistration,
  type Tournament,
  type InsertTournament,
  type Admin,
  type InsertAdmin,
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
  updateRegistrationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<Registration | undefined>;
  deleteRegistrationsByTournament(gameType: GameType, tournamentType: TournamentType): Promise<void>;
}

export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private tournaments: Map<string, Tournament>;
  private registrations: Map<string, Registration>;

  constructor() {
    this.admins = new Map();
    this.tournaments = new Map();
    this.registrations = new Map();
    
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
    // Default QR code URL (using attached assets)
    const defaultQR = "/attached_assets/payment-qr.jpg";
    
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

  async updateRegistrationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return undefined;
    }
    registration.status = status;
    this.registrations.set(id, registration);
    return registration;
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
}

export const storage = new MemStorage();
