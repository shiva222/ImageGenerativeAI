"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeneration = exports.getGenerations = exports.createGeneration = void 0;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const Generation_1 = require("../models/Generation");
const validation_1 = require("../utils/validation");
const errorHandler_1 = require("../middleware/errorHandler");
// Simulate processing delay and random failures
const simulateProcessing = () => {
    return new Promise((resolve) => {
        // Random processing time between 1-3 seconds
        const processingTime = Math.random() * 2000 + 1000;
        setTimeout(() => {
            // 20% chance of failure (simulating "Model overloaded")
            const shouldFail = Math.random() < 0.2;
            if (shouldFail) {
                resolve({ success: false });
            }
            else {
                // For demo purposes, we'll just copy the original image as the "result"
                // In a real app, this would be the AI-generated image
                resolve({
                    success: true,
                    resultPath: `result_${Date.now()}.jpg`
                });
            }
        }, processingTime);
    });
};
exports.createGeneration = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new errorHandler_1.AppError('User not authenticated', 401);
    }
    // Validate text input
    const validatedData = validation_1.createGenerationSchema.parse(req.body);
    const { prompt, style } = validatedData;
    // Validate uploaded file
    const file = req.file;
    if (!file) {
        throw new errorHandler_1.AppError('Image file is required', 400);
    }
    const fileError = (0, validation_1.validateImageFile)(file);
    if (fileError) {
        throw new errorHandler_1.AppError(fileError, 400);
    }
    // Create generation record
    const generationId = (0, uuid_1.v4)();
    const generation = await Generation_1.GenerationModel.create({
        id: generationId,
        user_id: userId,
        prompt,
        style,
        image_path: file.path,
    });
    // Start async processing (don't await)
    processGeneration(generationId, file.path).catch(console.error);
    res.status(201).json({
        success: true,
        message: 'Generation started',
        data: {
            generation: {
                id: generation.id,
                prompt: generation.prompt,
                style: generation.style,
                status: generation.status,
                created_at: generation.created_at,
            },
        },
    });
});
const processGeneration = async (generationId, originalImagePath) => {
    try {
        const result = await simulateProcessing();
        if (result.success && result.resultPath) {
            // Copy original image to simulate result (in real app, this would be AI generation)
            const resultPath = path_1.default.join(path_1.default.dirname(originalImagePath), result.resultPath);
            await promises_1.default.copyFile(originalImagePath, resultPath);
            await Generation_1.GenerationModel.updateStatus(generationId, 'completed', resultPath);
        }
        else {
            await Generation_1.GenerationModel.updateStatus(generationId, 'failed');
        }
    }
    catch (error) {
        console.error('Processing error:', error);
        await Generation_1.GenerationModel.updateStatus(generationId, 'failed');
    }
};
exports.getGenerations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new errorHandler_1.AppError('User not authenticated', 401);
    }
    const validatedQuery = validation_1.getGenerationsSchema.parse(req.query);
    const { limit } = validatedQuery;
    const generations = await Generation_1.GenerationModel.findByUserId(userId, limit);
    // Transform data to include image URLs
    const transformedGenerations = generations.map(gen => ({
        id: gen.id,
        prompt: gen.prompt,
        style: gen.style,
        status: gen.status,
        imageUrl: gen.image_path ? `/uploads/${path_1.default.basename(gen.image_path)}` : null,
        resultImageUrl: gen.result_image_path ? `/uploads/${path_1.default.basename(gen.result_image_path)}` : null,
        created_at: gen.created_at,
    }));
    res.status(200).json({
        success: true,
        data: {
            generations: transformedGenerations,
            total: transformedGenerations.length,
        },
    });
});
exports.getGeneration = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new errorHandler_1.AppError('User not authenticated', 401);
    }
    const { id } = req.params;
    const generation = await Generation_1.GenerationModel.findById(id);
    // Check ownership
    if (generation.user_id !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    // Transform data
    const transformedGeneration = {
        id: generation.id,
        prompt: generation.prompt,
        style: generation.style,
        status: generation.status,
        imageUrl: generation.image_path ? `/uploads/${path_1.default.basename(generation.image_path)}` : null,
        resultImageUrl: generation.result_image_path ? `/uploads/${path_1.default.basename(generation.result_image_path)}` : null,
        created_at: generation.created_at,
    };
    res.status(200).json({
        success: true,
        data: {
            generation: transformedGeneration,
        },
    });
});
//# sourceMappingURL=generationsController.js.map