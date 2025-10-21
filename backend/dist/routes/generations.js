"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generationsController_1 = require("../controllers/generationsController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// All generation routes require authentication
router.use(auth_1.authenticateToken);
/**
 * @route POST /api/generations
 * @desc Create a new generation
 * @access Private
 */
router.post('/', upload_1.upload.single('image'), generationsController_1.createGeneration);
/**
 * @route GET /api/generations
 * @desc Get user's generations
 * @access Private
 */
router.get('/', generationsController_1.getGenerations);
/**
 * @route GET /api/generations/:id
 * @desc Get a specific generation
 * @access Private
 */
router.get('/:id', generationsController_1.getGeneration);
exports.default = router;
//# sourceMappingURL=generations.js.map