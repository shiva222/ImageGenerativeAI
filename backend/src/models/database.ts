import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
let db: sqlite3.Database;

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      
      // Create tables
      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
};

const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const userTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const generationTable = `
      CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        style TEXT NOT NULL,
        image_path TEXT,
        result_image_path TEXT,
        status TEXT DEFAULT 'processing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    db.serialize(() => {
      db.run(userTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      db.run(generationTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Database connection closed');
      resolve();
    });
  });
};
