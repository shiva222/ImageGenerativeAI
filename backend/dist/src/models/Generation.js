"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationModel = void 0;
const database_1 = require("./database");
class GenerationModel {
    static async create(generationData) {
        const db = (0, database_1.getDatabase)();
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
            ], function (err) {
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
    static async findById(id) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM generations WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new Error('Generation not found'));
                    return;
                }
                resolve(row);
            });
        });
    }
    static async findByUserId(userId, limit = 5) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows || []);
            });
        });
    }
    static async updateStatus(id, status, resultImagePath) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
        UPDATE generations 
        SET status = ?, result_image_path = ?
        WHERE id = ?
      `);
            stmt.run([status, resultImagePath || null, id], function (err) {
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
    static async delete(id) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM generations WHERE id = ?', [id], function (err) {
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
exports.GenerationModel = GenerationModel;
//# sourceMappingURL=Generation.js.map