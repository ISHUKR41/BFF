import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory storage
let tournaments: any[] = [];
let registrations: any[] = [];
let admins: any[] = [];

// Initialize data
function initializeData() {
  if (tournaments.length === 0) {
    tournaments = [
      { id: 'bgmi-solo', gameType: 'bgmi', tournamentType: 'solo', currentCount: 0, maxSlots: 100, entryFee: 20, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9, qrCodeUrl: '' },
      { id: 'bgmi-duo', gameType: 'bgmi', tournamentType: 'duo', currentCount: 0, maxSlots: 50, entryFee: 40, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9, qrCodeUrl: '' },
      { id: 'bgmi-squad', gameType: 'bgmi', tournamentType: 'squad', currentCount: 0, maxSlots: 25, entryFee: 80, winnerPrize: 350, runnerUpPrize: 250, perKillPrize: 9, qrCodeUrl: '' },
      { id: 'freefire-solo', gameType: 'freefire', tournamentType: 'solo', currentCount: 0, maxSlots: 48, entryFee: 20, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5, qrCodeUrl: '' },
      { id: 'freefire-duo', gameType: 'freefire', tournamentType: 'duo', currentCount: 0, maxSlots: 24, entryFee: 40, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5, qrCodeUrl: '' },
      { id: 'freefire-squad', gameType: 'freefire', tournamentType: 'squad', currentCount: 0, maxSlots: 12, entryFee: 80, winnerPrize: 350, runnerUpPrize: 150, perKillPrize: 5, qrCodeUrl: '' },
    ];
  }
  
  if (admins.length === 0) {
    admins.push({
      id: 'admin-1',
      username: 'admin',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
      createdAt: new Date().toISOString()
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize data
  initializeData();
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url || '', 'http://localhost');
  const path = pathname.replace('/api', '');

  try {
    // Health check
    if (path === '/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'in-memory',
        environment: process.env.NODE_ENV || 'production'
      });
    }

    // Get all tournaments
    if (path === '/tournaments' && req.method === 'GET') {
      return res.status(200).json(tournaments);
    }

    // Get specific tournament
    if (path.startsWith('/tournaments/') && req.method === 'GET') {
      const [, gameType, tournamentType] = path.split('/');
      const tournament = tournaments.find(t => 
        t.gameType === gameType && t.tournamentType === tournamentType
      );
      
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }
      
      return res.status(200).json(tournament);
    }

    // Create registration
    if (path === '/registrations' && req.method === 'POST') {
      const registration = req.body;
      
      console.log('Registration data received:', JSON.stringify(registration, null, 2));
      
      // Validate required fields
      if (!registration.gameType || !registration.tournamentType || !registration.playerName) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'gameType, tournamentType, and playerName are required'
        });
      }
      
      // Find tournament
      const tournament = tournaments.find(t => 
        t.gameType === registration.gameType && 
        t.tournamentType === registration.tournamentType
      );
      
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }
      
      if (tournament.currentCount >= tournament.maxSlots) {
        return res.status(400).json({ error: 'Tournament is full' });
      }
      
      // Create registration
      const newRegistration = {
        ...registration,
        id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      registrations.push(newRegistration);
      
      // Update tournament count
      tournament.currentCount += 1;
      
      console.log('Registration created successfully:', newRegistration.id);
      console.log('Total registrations:', registrations.length);
      
      return res.status(201).json({
        success: true,
        registration: newRegistration,
        message: 'Registration successful!'
      });
    }

    // Get all registrations (admin)
    if (path === '/registrations' && req.method === 'GET') {
      return res.status(200).json(registrations);
    }

    // Admin login
    if (path === '/admin/login' && req.method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const admin = admins.find(a => a.username === username);
      
      if (!admin || password !== 'admin123') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      return res.status(200).json({
        success: true,
        admin: { id: admin.id, username: admin.username },
        token: 'admin-token-' + Date.now()
      });
    }

    // Default response
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}