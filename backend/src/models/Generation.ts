import { getDatabase } from './database';

export interface Generation {
  id: string;
  user_id: number;
  prompt: string;
  style: string;
  image_path?: string;
  result_image_path?: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface CreateGenerationData {
  id: string;
  user_id: number;
  prompt: string;
  style: string;
  image_path?: string;
}

export class GenerationModel {
  static async create(generationData: CreateGenerationData): Promise<Generation> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO generations (id, user_id, prompt, style, image_path, status) 
        VALUES (?, ?, ?, ?, ?, 'processing')
      `);
      
      stmt.run([
        generationData.id,
        generationData.user_id,
        generationData.prompt,
        generationData.style,
        generationData.image_path || null
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Get the created generation
        GenerationModel.findById(generationData.id)
          .then(resolve)
          .catch(reject);
      });
      
      stmt.finalize();
    });
  }

  static async findById(id: string): Promise<Generation> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM generations WHERE id = ?',
        [id],
        (err, row: Generation) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new Error('Generation not found'));
            return;
          }
          resolve(row);
        }
      );
    });
  }

  static async findByUserId(userId: number, limit: number = 5): Promise<Generation[]> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (err, rows: Generation[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  }

  static async updateStatus(id: string, status: Generation['status'], resultImagePath?: string): Promise<Generation> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE generations 
        SET status = ?, result_image_path = ?
        WHERE id = ?
      `);
      
      stmt.run([status, resultImagePath || null, id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Generation not found'));
          return;
        }
        
        // Get the updated generation
        GenerationModel.findById(id)
          .then(resolve)
          .catch(reject);
      });
      
      stmt.finalize();
    });
  }

  static async delete(id: string): Promise<void> {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM generations WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Generation not found'));
          return;
        }
        
        resolve();
      });
    });
  }
}
