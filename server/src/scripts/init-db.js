const { initDatabase } = require('../config/db');

async function run() {
  console.log('[Init] Initializing database schema...');
  try {
    await initDatabase();
    console.log('[Init] Database schema created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Init] Failed to initialize database:', error.message);
    process.exit(1);
  }
}

run();
