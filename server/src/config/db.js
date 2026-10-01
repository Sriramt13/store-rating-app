const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_DIALECT = (process.env.DB_DIALECT || 'mysql').toLowerCase();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_rating_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

let activeDialect = 'mysql';
let mysqlPool = null;
let sqliteDb = null;
let isInitialized = false;

const sqlitePath = path.resolve(__dirname, '../../database.sqlite');

/**
 * Initialize SQLite database connection
 */
function getSqliteDb() {
  if (!sqliteDb) {
    sqliteDb = new sqlite3.Database(sqlitePath);
    sqliteDb.run('PRAGMA foreign_keys = ON;');
  }
  return sqliteDb;
}

/**
 * Run a query in SQLite with promise wrapper
 */
function querySqlite(sql, params = []) {
  const db = getSqliteDb();
  const trimmed = sql.trim().toUpperCase();

  // Normalize MySQL syntax to SQLite if needed
  let normalizedSql = sql
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(/ON DUPLICATE KEY UPDATE/gi, 'ON CONFLICT(user_id, store_id) DO UPDATE SET')
    .replace(/VALUES\(([a-zA-Z0-9_]+)\)/gi, 'excluded.$1')
    .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;?/gi, ';')
    .replace(/CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci/gi, '')
    .replace(/TINYINT/gi, 'INTEGER')
    .replace(/ENUM\([^)]+\)/gi, 'VARCHAR(20)');

  // Remove trailing MySQL table options or index syntax in CREATE TABLE if needed
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
    return new Promise((resolve, reject) => {
      db.all(normalizedSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      db.run(normalizedSql, params, function (err) {
        if (err) return reject(err);
        resolve({
          insertId: this.lastID,
          affectedRows: this.changes
        });
      });
    });
  }
}

/**
 * Initialize database tables
 */
async function initDatabase() {
  // Try MySQL first if configured
  if (DB_DIALECT === 'mysql') {
    try {
      console.log(`[DB] Attempting connection to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
      const rootConn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 4000
      });

      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();

      mysqlPool = mysql.createPool(dbConfig);

      // Create users table
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(60) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          address VARCHAR(400) NOT NULL,
          role ENUM('ADMIN', 'USER', 'STORE_OWNER') NOT NULL DEFAULT 'USER',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users_email (email),
          INDEX idx_users_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create stores table
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS stores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(60) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          address VARCHAR(400) NOT NULL,
          owner_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_stores_name (name),
          INDEX idx_stores_email (email),
          INDEX idx_stores_owner (owner_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create ratings table
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          store_id INT NOT NULL,
          rating TINYINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_store (user_id, store_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          INDEX idx_ratings_store (store_id),
          INDEX idx_ratings_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      activeDialect = 'mysql';
      isInitialized = true;
      console.log(`[DB] Connected to MySQL successfully! Database: ${dbConfig.database}`);
      return 'mysql';
    } catch (err) {
      console.warn(`[DB] Could not connect to MySQL (${err.message}).`);
      console.log('[DB] Switching to high-performance local SQLite database fallback.');
    }
  }

  // SQLite Fallback / Dialect
  activeDialect = 'sqlite';
  const db = getSqliteDb();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(60) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          address VARCHAR(400) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'USER',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS stores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(60) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          address VARCHAR(400) NOT NULL,
          owner_id INTEGER NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          store_id INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, store_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        );
      `, (err) => {
        if (err) return reject(err);
        isInitialized = true;
        console.log(`[DB] Local SQLite Database ready at ${sqlitePath}`);
        resolve('sqlite');
      });
    });
  });
}

/**
 * Universal Query Executor: works with MySQL or SQLite seamlessly
 */
async function query(sql, params = []) {
  if (!isInitialized) {
    await initDatabase();
  }

  if (activeDialect === 'mysql' && mysqlPool) {
    const [results] = await mysqlPool.execute(sql, params);
    return results;
  } else {
    return await querySqlite(sql, params);
  }
}

function getActiveDialect() {
  return activeDialect;
}

module.exports = {
  dbConfig,
  initDatabase,
  query,
  getActiveDialect
};
