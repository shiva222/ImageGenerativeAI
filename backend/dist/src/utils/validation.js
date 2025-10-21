"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageFile = exports.getGenerationsSchema = exports.createGenerationSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
// Auth validation schemas
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Generation validation schemas
exports.createGenerationSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
    style: zod_1.z.enum(['realistic', 'artistic', 'cartoon', 'vintage'], {
        message: 'Invalid style option',
    }),
});
exports.getGenerationsSchema = zod_1.z.object({
    limit: zod_1.z.string().optional().transform((val) => {
        if (!val)
            return 5;
        const num = parseInt(val, 10);
        return isNaN(num) ? 5 : Math.min(Math.max(num, 1), 20);
    }),
});
// File validation
const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowedTypes.includes(file.mimetype)) {
        return 'Only JPEG and PNG files are allowed';
    }
    if (file.size > maxSize) {
        return 'File size must be less than 10MB';
    }
    return null;
};
exports.validateImageFile = validateImageFile;
//# sourceMappingURL=validation.js.map