import bcrypt from "bcryptjs";

// In-memory storage for Vercel (since we can't use SQLite)
let tournaments: any[] = [];
let registrations: any[] = [];
let admins: any[] = [];
let activityLogs: any[] = [];

// Initialize data
const tournamentConfigs = [
  // BGMI Tournaments
  { id: 'bgmi-solo', gameType: 'bgmi', tournamentType: 'solo', currentCount: 0, maxSlots: 100, entryFee: 20, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9, qrCodeUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 'bgmi-duo', gameType: 'bgmi', tournamentType: 'duo', currentCount: 0, maxSlots: 50, entryFee: 40, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9, qrCodeUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 'bgmi-squad', gameType: 'bgmi', tournamentType: 'squad', currentCount: 0, maxSlots: 25, entryFee: 80, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9, qrCodeUrl: '', createdAt: new Date(), updatedAt: new Date() },
  // Free Fire Tournaments
  { id: 'freefire-solo', gameType: 'freefire', tournamentType: 'solo', currentCount: 0, maxSlots: 48, entryFee: 20, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5, qrCodeUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 'freefire-duo', gameType: 'freefire', tournamentType: 'duo', currentCount: 0, maxSlots: 24, entryFee: 40, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5, qrCodeUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 'freefire-squad', gameType: 'freefire', tournamentType: 'squad', currentCount: 0, maxSlots: 12, entryFee: 80, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5, qrCodeUrl: '', createdAt: new Date(), updatedAt: new Date() },
];

export interface IStorage {
  // Admin operations
  getAdmin(id: string): Promise<any>;
  getAdminByUsername(username: string): Promise<any>;
  createAdmin(admin: any): Promise<any>;
  validateAdmin(username: string, password: string): Promise<any>;

  // Tournament operations
  getTournament(gameType: string, tournamentType: string): Promise<any>;
  getAllTournaments(): Promise<any[]>;
  updateTournamentCount(gameType: string, tournamentType: string, increment: number): Promise<any>;
  resetTournament(gameType: string, tournamentType: string): Promise<any>;
  updateQRCode(gameType: string, tournamentType: string, qrCodeUrl: string): Promise<any>;

  // Registration operations
  createRegistration(registration: any): Promise<any>;
  getRegistration(id: string): Promise<any>;
  getAllRegistrations(): Promise<any[]>;
  updateRegistration(id: string, updates: any): Promise<any>;
  deleteRegistration(id: string): Promise<boolean>;
  bulkUpdateRegistrations(ids: string[], updates: any): Promise<number>;
  bulkDeleteRegistrations(ids: string[]): Promise<number>;

  // Activity log operations
  logActivity(activity: any): Promise<any>;

  // Initialize storage
  initialize(): Promise<void>;
}

class VercelStorage implements IStorage {
  async initialize(): Promise<void> {
    // Initialize tournaments
    tournaments = [...tournamentConfigs];

    // Create default admin
    const existingAdmin = await this.getAdminByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await this.createAdmin({
        id: "admin-1",
        username: "admin",
        password: hashedPassword,
        createdAt: new Date()
      });
    }
  }

  // Admin operations
  async getAdmin(id: string): Promise<any> {
    return admins.find(admin => admin.id === id);
  }

  async getAdminByUsername(username: string): Promise<any> {
    return admins.find(admin => admin.username === username);
  }

  async createAdmin(admin: any): Promise<any> {
    admins.push(admin);
    return admin;
  }

  async validateAdmin(username: string, password: string): Promise<any> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return null;

    const isValid = bcrypt.compareSync(password, admin.password);
    return isValid ? admin : null;
  }

  // Tournament operations
  async getTournament(gameType: string, tournamentType: string): Promise<any> {
    return tournaments.find(t => t.gameType === gameType && t.tournamentType === tournamentType);
  }

  async getAllTournaments(): Promise<any[]> {
    return tournaments.sort((a, b) => {
      if (a.gameType !== b.gameType) return a.gameType.localeCompare(b.gameType);
      return a.tournamentType.localeCompare(b.tournamentType);
    });
  }

  async updateTournamentCount(gameType: string, tournamentType: string, increment: number): Promise<any> {
    const tournament = tournaments.find(t => t.gameType === gameType && t.tournamentType === tournamentType);
    if (tournament) {
      tournament.currentCount += increment;
      tournament.updatedAt = new Date();
    }
    return tournament;
  }

  async resetTournament(gameType: string, tournamentType: string): Promise<any> {
    const tournament = tournaments.find(t => t.gameType === gameType && t.tournamentType === tournamentType);
    if (tournament) {
      tournament.currentCount = 0;
      tournament.updatedAt = new Date();
    }
    return tournament;
  }

  async updateQRCode(gameType: string, tournamentType: string, qrCodeUrl: string): Promise<any> {
    const tournament = tournaments.find(t => t.gameType === gameType && t.tournamentType === tournamentType);
    if (tournament) {
      tournament.qrCodeUrl = qrCodeUrl;
      tournament.updatedAt = new Date();
    }
    return tournament;
  }

  // Registration operations
  async createRegistration(registration: any): Promise<any> {
    const newRegistration = {
      ...registration,
      id: registration.id || `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: registration.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    registrations.push(newRegistration);
    return newRegistration;
  }

  async getRegistration(id: string): Promise<any> {
    return registrations.find(reg => reg.id === id);
  }

  async getAllRegistrations(): Promise<any[]> {
    return registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateRegistration(id: string, updates: any): Promise<any> {
    const index = registrations.findIndex(reg => reg.id === id);
    if (index !== -1) {
      registrations[index] = { ...registrations[index], ...updates, updatedAt: new Date() };
      return registrations[index];
    }
    return null;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const index = registrations.findIndex(reg => reg.id === id);
    if (index !== -1) {
      registrations.splice(index, 1);
      return true;
    }
    return false;
  }

  async bulkUpdateRegistrations(ids: string[], updates: any): Promise<number> {
    let updated = 0;
    for (const id of ids) {
      const index = registrations.findIndex(reg => reg.id === id);
      if (index !== -1) {
        registrations[index] = { ...registrations[index], ...updates, updatedAt: new Date() };
        updated++;
      }
    }
    return updated;
  }

  async bulkDeleteRegistrations(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      const index = registrations.findIndex(reg => reg.id === id);
      if (index !== -1) {
        registrations.splice(index, 1);
        deleted++;
      }
    }
    return deleted;
  }

  // Activity log operations
  async logActivity(activity: any): Promise<any> {
    const newActivity = {
      ...activity,
      id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    activityLogs.push(newActivity);
    return newActivity;
  }
}

export const storage = new VercelStorage();
