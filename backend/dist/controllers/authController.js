"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const errorHandler_1 = require("../middleware/errorHandler");
exports.signup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate input
    const validatedData = validation_1.signupSchema.parse(req.body);
    const { email, password } = validatedData;
    // Check if user already exists
    const existingUser = await User_1.UserModel.findByEmail(email);
    if (existingUser) {
        throw new errorHandler_1.AppError('User with this email already exists', 400);
    }
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
    // Create user
    const user = await User_1.UserModel.create({
        email,
        password: hashedPassword,
    });
    // Generate token
    const token = (0, auth_1.generateToken)(user.id, user.email);
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
            token,
        },
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate input
    const validatedData = validation_1.loginSchema.parse(req.body);
    const { email, password } = validatedData;
    // Find user
    const user = await User_1.UserModel.findByEmail(email);
    if (!user) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Verify password
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Generate token
    const token = (0, auth_1.generateToken)(user.id, user.email);
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
            token,
        },
    });
});
exports.me = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new errorHandler_1.AppError('User not authenticated', 401);
    }
    const user = await User_1.UserModel.findById(userId);
    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        },
    });
});
//# sourceMappingURL=authController.js.map