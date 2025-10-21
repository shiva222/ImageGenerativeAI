import { z } from 'zod';

// Auth validation schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Generation validation schemas
export const createGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
  style: z.enum(['realistic', 'artistic', 'cartoon', 'vintage'], {
    message: 'Invalid style option',
  }),
});

export const getGenerationsSchema = z.object({
  limit: z.string().optional().transform((val) => {
    if (!val) return 5;
    const num = parseInt(val, 10);
    return isNaN(num) ? 5 : Math.min(Math.max(num, 1), 20);
  }),
});

// File validation
export const validateImageFile = (file: { mimetype: string; size: number }): string | null => {
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

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
export type GetGenerationsInput = z.infer<typeof getGenerationsSchema>;
