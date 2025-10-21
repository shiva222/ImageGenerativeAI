import { getDatabase } from './database';

export interface User {
  id: number;
  email: string;
  password: string;
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
      
      stmt.run([userData.email, userData.password], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Get the created user
        UserModel.findById(this.lastID)
          .then(resolve)
          .catch(reject);
      });
      
      stmt.finalize();
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row: User) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row || null);
        }
      );
    });
  }

  static async findById(id: number): Promise<User> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row: User) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new Error('User not found'));
            return;
          }
          resolve(row);
        }
      );
    });
  }

  static async emailExists(email: string): Promise<boolean> {
    const user = await UserModel.findByEmail(email);
    return user !== null;
  }
}
