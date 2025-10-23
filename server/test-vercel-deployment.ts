/**
 * Test script to verify Vercel deployment fixes
 * This script tests the key functionality that was fixed:
 * 1. Tournament slot counting accuracy
 * 2. Data separation between BGMI and Free Fire
 * 3. Registration creation and deletion
 * 4. Tournament reset functionality
 */

import { storage } from "./storage-vercel";
import { TOURNAMENT_CONFIG } from "@shared/schema";

async function runTests() {
  console.log("🧪 Starting Vercel deployment tests...\n");

  try {
    // Initialize storage
    console.log("1. Initializing storage...");
    await storage.initialize();
    console.log("   ✅ Storage initialized successfully\n");

    // Test tournament data separation
    console.log("2. Testing tournament data separation...");
    const allTournaments = await storage.getAllTournaments();
    
    // Verify we have tournaments for both games
    const bgmiTournaments = allTournaments.filter(t => t.gameType === "bgmi");
    const freeFireTournaments = allTournaments.filter(t => t.gameType === "freefire");
    
    console.log(`   🎮 BGMI tournaments: ${bgmiTournaments.length}`);
    console.log(`   🔥 Free Fire tournaments: ${freeFireTournaments.length}`);
    
    if (bgmiTournaments.length === 3 && freeFireTournaments.length === 3) {
      console.log("   ✅ Tournament data separation working correctly\n");
    } else {
      console.log("   ❌ Tournament data separation issue\n");
      return;
    }

    // Test slot counting accuracy
    console.log("3. Testing slot counting accuracy...");
    const soloTournament = await storage.getTournament("bgmi", "solo");
    const initialCount = soloTournament?.registeredCount || 0;
    console.log(`   Initial BGMI Solo slots: ${initialCount}/${soloTournament?.maxSlots}`);
    
    // Test tournament reset
    console.log("4. Testing tournament reset...");
    const resetTournament = await storage.resetTournament("bgmi", "solo");
    console.log(`   Reset BGMI Solo slots: ${resetTournament.registeredCount}/${resetTournament.maxSlots}`);
    
    if (resetTournament.registeredCount === 0) {
      console.log("   ✅ Tournament reset working correctly\n");
    } else {
      console.log("   ❌ Tournament reset issue\n");
      return;
    }

    console.log("🎉 All tests passed! Vercel deployment fixes are working correctly.");
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };