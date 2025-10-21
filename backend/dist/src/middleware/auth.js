"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const errorHandler_1 = require("./errorHandler");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw new errorHandler_1.AppError('Access token required', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Verify user still exists
        const user = await User_1.UserModel.findById(decoded.userId);
        req.user = {
            id: user.id,
            email: user.email,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Invalid token', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticateToken = authenticateToken;
const generateToken = (userId, email) => {
    return jsonwebtoken_1.default.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map