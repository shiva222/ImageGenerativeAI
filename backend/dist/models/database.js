"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getDatabase = exports.initializeDatabase = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../database.sqlite');
let db;
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3_1.default.Database(dbPath, (err) => {
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
exports.initializeDatabase = initializeDatabase;
const createTables = () => {
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
const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};
exports.getDatabase = getDatabase;
const closeDatabase = () => {
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
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map