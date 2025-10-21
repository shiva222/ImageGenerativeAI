"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = require("./database");
class UserModel {
    static async create(userData) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
            stmt.run([userData.email, userData.password], function (err) {
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
    static async findByEmail(email) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }
    static async findById(id) {
        const db = (0, database_1.getDatabase)();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new Error('User not found'));
                    return;
                }
                resolve(row);
            });
        });
    }
    static async emailExists(email) {
        const user = await UserModel.findByEmail(email);
        return user !== null;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map