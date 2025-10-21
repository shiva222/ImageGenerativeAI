import { Router } from 'express';
import { createGeneration, getGenerations, getGeneration } from '../controllers/generationsController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All generation routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/generations
 * @desc Create a new generation
 * @access Private
 */
router.post('/', upload.single('image'), createGeneration);

/**
 * @route GET /api/generations
 * @desc Get user's generations
 * @access Private
 */
router.get('/', getGenerations);

/**
 * @route GET /api/generations/:id
 * @desc Get a specific generation
 * @access Private
 */
router.get('/:id', getGeneration);

export default router;
