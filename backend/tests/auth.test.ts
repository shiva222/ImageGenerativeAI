import request from 'supertest';
import app from '../src/index';
import { initializeDatabase, closeDatabase } from '../src/models/database';
import fs from 'fs';
import path from 'path';

describe('Auth Routes', () => {
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

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            email: userData.email,
          },
          token: expect.any(String),
        },
      });

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid email format'),
      });
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('at least 6 characters'),
      });
    });

    it('should return 400 for duplicate email', async () => {
      // First create a user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        });

      // Try to create the same user again
      const userData = {
        email: 'duplicate@example.com', // Same email
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already exists'),
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create unique user for this test
      const loginEmail = `login-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: loginEmail,
          password: 'password123',
        });

      const loginData = {
        email: loginEmail,
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email: loginData.email,
          },
          token: expect.any(String),
        },
      });
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;
    let testEmail: string;

    beforeEach(async () => {
      // Create unique user for each test
      testEmail = `me-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'password123',
        });

      if (signupResponse.status === 201) {
        authToken = signupResponse.body.data.token;
      } else {
        // Fallback to login if signup fails
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: 'password123',
          });
        authToken = loginResponse.body.data.token;
      }
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: testEmail,
          },
        },
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid token',
      });
    });
  });
});
