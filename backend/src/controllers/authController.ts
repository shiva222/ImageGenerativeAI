import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { generateToken } from '../middleware/auth';
import { signupSchema, loginSchema, SignupInput, LoginInput } from '../utils/validation';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedData: SignupInput = signupSchema.parse(req.body);
  const { email, password } = validatedData;

  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await UserModel.create({
    email,
    password: hashedPassword,
  });

  // Generate token
  const token = generateToken(user.id, user.email);

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

export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedData: LoginInput = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  // Find user
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user.id, user.email);

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

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await UserModel.findById(Number(userId));

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
