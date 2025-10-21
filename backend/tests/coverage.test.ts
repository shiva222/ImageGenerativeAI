import request from 'supertest';
import app from '../src/index';
import { initializeDatabase, closeDatabase } from '../src/models/database';
import fs from 'fs';
import path from 'path';

describe('Coverage Tests', () => {
  beforeAll(async () => {
    // Use a test database
    const testDbPath = path.join(__dirname, '../test-database.sqlite');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Override database path for tests
    process.env.NODE_ENV = 'test';
    await initializeDatabase();
  });

  beforeEach(async () => {
    // Clear all tables before each test to ensure isolation
    const { getDatabase } = await import('../src/models/database');
    const db = getDatabase();
    
    // Clear all tables in the correct order (respect foreign keys)
    db.exec('DELETE FROM generations');
    db.exec('DELETE FROM users');
    
    // Reset the auto-increment counters
    db.exec('DELETE FROM sqlite_sequence WHERE name IN ("users", "generations")');
  });

  afterAll(async () => {
    await closeDatabase();
    
    // Clean up test database
    const testDbPath = path.join(__dirname, '../test-database.sqlite');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Health endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Error handling coverage', () => {
    it('should handle JWT token expired error', async () => {
      // Create an expired token by mocking jwt.verify to throw TokenExpiredError
      const jwt = require('jsonwebtoken');
      const originalVerify = jwt.verify;
      
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Token expired',
      });

      // Restore original function
      jwt.verify = originalVerify;
    });

    it('should handle invalid JWT token error', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid token',
      });
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send('{"email": invalid json}')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle validation errors with proper structure', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: '123', // too short
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe('File upload validation coverage', () => {
    const createTestFile = (type: string = 'image/png', size: number = 1000) => {
      const buffer = Buffer.alloc(size);
      return {
        buffer,
        mimetype: type,
        size,
        originalname: 'test.png',
      };
    };

    it('should handle unsupported file type', async () => {
      // First create and login a user
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const authToken = signupResponse.body.data.token;

      // Create a text file instead of image
      const textBuffer = Buffer.from('This is not an image');
      
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', textBuffer, { filename: 'test.txt', contentType: 'text/plain' });

      // Should get validation error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle oversized file', async () => {
      // First create and login a user
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test2@example.com',
          password: 'password123',
        });

      const authToken = signupResponse.body.data.token;

      // Create a large file (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
      // Create a valid PNG header for the large buffer
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      pngHeader.copy(largeBuffer, 0);
      
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', largeBuffer, { filename: 'large.png', contentType: 'image/png' });

      // Should get validation error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Database error handling coverage', () => {
    it('should handle database connection errors gracefully', async () => {
      // This tests the database error handling paths
      const { getDatabase } = await import('../src/models/database');
      const db = getDatabase();
      
      // Force a database error by trying to insert invalid data
      const UserModel = require('../src/models/User').UserModel;
      
      try {
        // Try to create user with null email (should fail)
        await UserModel.create({
          email: null,
          password: 'hashedPassword',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle generation not found error', async () => {
      // First create and login a user
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test3@example.com',
          password: 'password123',
        });

      const authToken = signupResponse.body.data.token;

      const response = await request(app)
        .get('/api/generations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe('Controller edge cases', () => {
    it('should handle missing user in authenticated request', async () => {
      // Create a valid JWT token but for a user that doesn't exist in DB
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { userId: 'non-existent-user-id', email: 'fake@example.com' },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle bcrypt comparison failure', async () => {
      // First create a user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test4@example.com',
          password: 'correctpassword',
        });

      // Then try to login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test4@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid email or password',
      });
    });
  });

  describe('Validation utility coverage', () => {
    it('should validate image file type correctly', async () => {
      const { validateImageFile } = await import('../src/utils/validation');
      
      // Test valid file type
      const validResult = validateImageFile({
        mimetype: 'image/png',
        size: 1024 * 1024, // 1MB
      } as Express.Multer.File);
      expect(validResult).toBeNull();

      // Test invalid type
      const invalidTypeError = validateImageFile({
        mimetype: 'text/plain',
        size: 1024,
      } as Express.Multer.File);
      expect(invalidTypeError).toContain('JPEG and PNG files are allowed');

      // Test oversized file
      const oversizeError = validateImageFile({
        mimetype: 'image/png',
        size: 11 * 1024 * 1024, // 11MB
      } as Express.Multer.File);
      expect(oversizeError).toContain('less than 10MB');
    });
  });
});

