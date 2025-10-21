"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./models/database");
const auth_1 = __importDefault(require("./routes/auth"));
const generations_1 = __importDefault(require("./routes/generations"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// Logging middleware
app.use((0, morgan_1.default)('combined'));
// Rate limiting
app.use(rateLimiter_1.rateLimiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static files for uploaded images
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/generations', generations_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Initialize database and start server
const startServer = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        console.log('Database initialized successfully');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer().catch(console.error);
exports.default = app;
//# sourceMappingURL=index.js.map