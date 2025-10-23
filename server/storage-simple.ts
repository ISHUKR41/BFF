import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const sqlite = new Database("./database.db");

// Initialize database tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL,
    tournament_type TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    max_slots INTEGER NOT NULL,
    entry_fee INTEGER NOT NULL,
    winner_prize INTEGER NOT NULL,
    runner_up_prize INTEGER NOT NULL,
    per_kill_prize INTEGER NOT NULL,
    qr_code_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_type, tournament_type)
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL,
    tournament_type TEXT NOT NULL,
    player_name TEXT NOT NULL,
    player_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    team_name TEXT,
    team_members TEXT,
    payment_screenshot TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Initialize tournaments
const tournamentConfigs = [
  // BGMI Tournaments
  { gameType: 'bgmi', tournamentType: 'solo', maxSlots: 100, entryFee: 20, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9 },
  { gameType: 'bgmi', tournamentType: 'duo', maxSlots: 50, entryFee: 40, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9 },
  { gameType: 'bgmi', tournamentType: 'squad', maxSlots: 25, entryFee: 80, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9 },
  // Free Fire Tournaments
  { gameType: 'freefire', tournamentType: 'solo', maxSlots: 48, entryFee: 20, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5 },
  { gameType: 'freefire', tournamentType: 'duo', maxSlots: 24, entryFee: 40, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5 },
  { gameType: 'freefire', tournamentType: 'squad', maxSlots: 12, entryFee: 80, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5 },
];

for (const config of tournamentConfigs) {
  sqlite.prepare(`
    INSERT OR IGNORE INTO tournaments (
      id, game_type, tournament_type, max_slots, entry_fee,
      winner_prize, runner_up_prize, per_kill_prize
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `${config.gameType}-${config.tournamentType}`,
    config.gameType,
    config.tournamentType,
    config.maxSlots,
    config.entryFee,
    config.winnerPrize,
    config.runnerUpPrize,
    config.perKillPrize
  );
}

// Create default admin
const existingAdmin = sqlite.prepare("SELECT * FROM admins WHERE username = ?").get("admin");
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  sqlite.prepare(`
    INSERT INTO admins (id, username, password)
    VALUES (?, ?, ?)
  `).run("admin-1", "admin", hashedPassword);
}

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

class SimpleStorage implements IStorage {
  async initialize(): Promise<void> {
    // Already initialized above
  }

  // Admin operations
  async getAdmin(id: string): Promise<any> {
    return sqlite.prepare("SELECT * FROM admins WHERE id = ?").get(id);
  }

  async getAdminByUsername(username: string): Promise<any> {
    return sqlite.prepare("SELECT * FROM admins WHERE username = ?").get(username);
  }

  async createAdmin(admin: any): Promise<any> {
    sqlite.prepare(`
      INSERT INTO admins (id, username, password)
      VALUES (?, ?, ?)
    `).run(admin.id, admin.username, admin.password);
    return this.getAdmin(admin.id);
  }

  async validateAdmin(username: string, password: string): Promise<any> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return null;

    const isValid = bcrypt.compareSync(password, admin.password);
    return isValid ? admin : null;
  }

  // Tournament operations
  async getTournament(gameType: string, tournamentType: string): Promise<any> {
    return sqlite.prepare(`
      SELECT * FROM tournaments 
      WHERE game_type = ? AND tournament_type = ?
    `).get(gameType, tournamentType);
  }

  async getAllTournaments(): Promise<any[]> {
    return sqlite.prepare(`
      SELECT * FROM tournaments ORDER BY game_type, tournament_type
    `).all();
  }

  async updateTournamentCount(gameType: string, tournamentType: string, increment: number): Promise<any> {
    sqlite.prepare(`
      UPDATE tournaments 
      SET current_count = current_count + ?, updated_at = CURRENT_TIMESTAMP
      WHERE game_type = ? AND tournament_type = ?
    `).run(increment, gameType, tournamentType);

    return this.getTournament(gameType, tournamentType);
  }

  async resetTournament(gameType: string, tournamentType: string): Promise<any> {
    sqlite.prepare(`
      UPDATE tournaments 
      SET current_count = 0, updated_at = CURRENT_TIMESTAMP
      WHERE game_type = ? AND tournament_type = ?
    `).run(gameType, tournamentType);

    return this.getTournament(gameType, tournamentType);
  }

  async updateQRCode(gameType: string, tournamentType: string, qrCodeUrl: string): Promise<any> {
    sqlite.prepare(`
      UPDATE tournaments 
      SET qr_code_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE game_type = ? AND tournament_type = ?
    `).run(qrCodeUrl, gameType, tournamentType);

    return this.getTournament(gameType, tournamentType);
  }

  // Registration operations
  async createRegistration(registration: any): Promise<any> {
    sqlite.prepare(`
      INSERT INTO registrations (
        id, game_type, tournament_type, player_name, player_id,
        phone_number, whatsapp_number, team_name, team_members,
        payment_screenshot, transaction_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      registration.id,
      registration.gameType,
      registration.tournamentType,
      registration.playerName,
      registration.playerId,
      registration.phoneNumber,
      registration.whatsappNumber,
      registration.teamName || null,
      registration.teamMembers || null,
      registration.paymentScreenshot || null,
      registration.transactionId || null,
      registration.status || 'pending'
    );

    return this.getRegistration(registration.id);
  }

  async getRegistration(id: string): Promise<any> {
    return sqlite.prepare("SELECT * FROM registrations WHERE id = ?").get(id);
  }

  async getAllRegistrations(): Promise<any[]> {
    return sqlite.prepare(`
      SELECT * FROM registrations ORDER BY created_at DESC
    `).all();
  }

  async updateRegistration(id: string, updates: any): Promise<any> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && updates[key] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');

    if (setClause) {
      const values = Object.entries(updates)
        .filter(([key, value]) => key !== 'id' && value !== undefined)
        .map(([, value]) => value);

      sqlite.prepare(`
        UPDATE registrations 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values, id);
    }

    return this.getRegistration(id);
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const result = sqlite.prepare("DELETE FROM registrations WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async bulkUpdateRegistrations(ids: string[], updates: any): Promise<number> {
    if (ids.length === 0) return 0;

    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && updates[key] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClause) return 0;

    const values = Object.entries(updates)
      .filter(([key, value]) => key !== 'id' && value !== undefined)
      .map(([, value]) => value);

    const placeholders = ids.map(() => '?').join(',');

    const result = sqlite.prepare(`
      UPDATE registrations 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `).run(...values, ...ids);

    return result.changes;
  }

  async bulkDeleteRegistrations(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const result = sqlite.prepare(`
      DELETE FROM registrations WHERE id IN (${placeholders})
    `).run(...ids);

    return result.changes;
  }

  // Activity log operations
  async logActivity(activity: any): Promise<any> {
    sqlite.prepare(`
      INSERT INTO activity_logs (id, admin_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(activity.id, activity.adminId, activity.action, activity.details || null);

    return sqlite.prepare("SELECT * FROM activity_logs WHERE id = ?").get(activity.id);
  }
}

export const storage = new SimpleStorage();
