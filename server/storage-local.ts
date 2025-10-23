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
import { db, eq, and, or, like, desc, sql, count } from "./database-local";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const sqlite = new Database("./database.db");

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
  updateRegistration(
    id: string,
    updates: Partial<InsertRegistration>
  ): Promise<Registration>;
  deleteRegistration(id: string): Promise<boolean>;
  bulkUpdateRegistrations(
    ids: string[],
    updates: Partial<InsertRegistration>
  ): Promise<number>;
  bulkDeleteRegistrations(ids: string[]): Promise<number>;

  // Activity log operations
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;

  // Initialize storage
  initialize(): Promise<void>;
}

class LocalStorage implements IStorage {
  async initialize(): Promise<void> {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
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

    await db.execute(sql`
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

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Initialize tournaments if they don't exist
    for (const [gameType, gameConfig] of Object.entries(TOURNAMENT_CONFIG)) {
      for (const [tournamentType, config] of Object.entries(gameConfig)) {
        await db.execute(sql`
          INSERT OR IGNORE INTO tournaments (
            id, game_type, tournament_type, max_slots, entry_fee,
            winner_prize, runner_up_prize, per_kill_prize
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `${gameType}-${tournamentType}`,
          gameType,
          tournamentType,
          config.maxSlots,
          config.entryFee,
          config.winnerPrize,
          config.runnerUpPrize,
          config.perKillPrize
        ]);
      }
    }

    // Create default admin if it doesn't exist
    const existingAdmin = await this.getAdminByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await this.createAdmin({
        id: "admin-1",
        username: "admin",
        password: hashedPassword,
      });
    }
  }

  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM admins WHERE id = ?
    `, [id]);
    return result.rows[0] as Admin | undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM admins WHERE username = ?
    `, [username]);
    return result.rows[0] as Admin | undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    await db.execute(sql`
      INSERT INTO admins (id, username, password)
      VALUES (?, ?, ?)
    `, [admin.id, admin.username, admin.password]);
    
    const created = await this.getAdmin(admin.id);
    if (!created) throw new Error("Failed to create admin");
    return created;
  }

  async validateAdmin(username: string, password: string): Promise<Admin | null> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return null;

    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? admin : null;
  }

  // Tournament operations
  async getTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Tournament | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM tournaments 
      WHERE game_type = ? AND tournament_type = ?
    `, [gameType, tournamentType]);
    return result.rows[0] as Tournament | undefined;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    const result = await db.execute(sql`
      SELECT * FROM tournaments ORDER BY game_type, tournament_type
    `);
    return result.rows as Tournament[];
  }

  async updateTournamentCount(
    gameType: GameType,
    tournamentType: TournamentType,
    increment: number
  ): Promise<Tournament> {
    await db.execute(sql`
      UPDATE tournaments 
      SET current_count = current_count + ?, updated_at = CURRENT_TIMESTAMP
      WHERE game_type = ? AND tournament_type = ?
    `, [increment, gameType, tournamentType]);

    const updated = await this.getTournament(gameType, tournamentType);
    if (!updated) throw new Error("Tournament not found");
    return updated;
  }

  async resetTournament(
    gameType: GameType,
    tournamentType: TournamentType
  ): Promise<Tournament> {
    await db.execute(sql`
      UPDATE tournaments 
      SET current_count = 0, updated_at = CURRENT_TIMESTAMP
      WHERE game_type = ? AND tournament_type = ?
    `, [gameType, tournamentType]);

    const updated = await this.getTournament(gameType, tournamentType);
    if (!updated) throw new Error("Tournament not found");
    return updated;
  }

  async updateQRCode(
    gameType: GameType,
    tournamentType: TournamentType,
    qrCodeUrl: string
  ): Promise<Tournament> {
    await db.execute(sql`
      UPDATE tournaments 
      SET qr_code_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE game_type = ? AND tournament_type = ?
    `, [qrCodeUrl, gameType, tournamentType]);

    const updated = await this.getTournament(gameType, tournamentType);
    if (!updated) throw new Error("Tournament not found");
    return updated;
  }

  // Registration operations
  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    await db.execute(sql`
      INSERT INTO registrations (
        id, game_type, tournament_type, player_name, player_id,
        phone_number, whatsapp_number, team_name, team_members,
        payment_screenshot, transaction_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    const created = await this.getRegistration(registration.id);
    if (!created) throw new Error("Failed to create registration");
    return created;
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM registrations WHERE id = ?
    `, [id]);
    return result.rows[0] as Registration | undefined;
  }

  async getAllRegistrations(): Promise<Registration[]> {
    const result = await db.execute(sql`
      SELECT * FROM registrations ORDER BY created_at DESC
    `);
    return result.rows as Registration[];
  }

  async updateRegistration(
    id: string,
    updates: Partial<InsertRegistration>
  ): Promise<Registration> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && updates[key as keyof InsertRegistration] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');

    if (setClause) {
      const values = Object.entries(updates)
        .filter(([key, value]) => key !== 'id' && value !== undefined)
        .map(([, value]) => value);

      await db.execute(sql`
        UPDATE registrations 
        SET ${sql.raw(setClause)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [...values, id]);
    }

    const updated = await this.getRegistration(id);
    if (!updated) throw new Error("Registration not found");
    return updated;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM registrations WHERE id = ?
    `, [id]);
    return result.changes > 0;
  }

  async bulkUpdateRegistrations(
    ids: string[],
    updates: Partial<InsertRegistration>
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && updates[key as keyof InsertRegistration] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClause) return 0;

    const values = Object.entries(updates)
      .filter(([key, value]) => key !== 'id' && value !== undefined)
      .map(([, value]) => value);

    const placeholders = ids.map(() => '?').join(',');

    const result = await db.execute(sql`
      UPDATE registrations 
      SET ${sql.raw(setClause)}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${sql.raw(placeholders)})
    `, [...values, ...ids]);

    return result.changes;
  }

  async bulkDeleteRegistrations(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const result = await db.execute(sql`
      DELETE FROM registrations WHERE id IN (${sql.raw(placeholders)})
    `, ids);

    return result.changes;
  }

  // Activity log operations
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    await db.execute(sql`
      INSERT INTO activity_logs (id, admin_id, action, details)
      VALUES (?, ?, ?, ?)
    `, [activity.id, activity.adminId, activity.action, activity.details || null]);

    const result = await db.execute(sql`
      SELECT * FROM activity_logs WHERE id = ?
    `, [activity.id]);
    return result.rows[0] as ActivityLog;
  }
}

export const storage = new LocalStorage();
