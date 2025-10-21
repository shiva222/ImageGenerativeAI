import request from 'supertest';
import app from '../src/index';
import { initializeDatabase, closeDatabase } from '../src/models/database';
import fs from 'fs';
import path from 'path';

describe('Generation Routes', () => {
  let authToken: string;

  // Create a test image buffer for testing
  const createTestImageBuffer = () => {
    // Create a simple PNG buffer for testing
    const buffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x3a, 0x75, 0x26, 0xdf,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82
    ]);
    return buffer;
  };

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

    // Create a unique test user for each test
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: uniqueEmail,
        password: 'password123',
      });

    if (signupResponse.status === 201) {
      authToken = signupResponse.body.data.token;
    } else {
      throw new Error(`Failed to create test user: ${signupResponse.status} ${signupResponse.text}`);
    }
  });

  afterAll(async () => {
    await closeDatabase();
    
    // Clean up test database
    const testDbPath = path.join(__dirname, '../test-database.sqlite');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('POST /api/generations', () => {
    // Create a test image buffer for testing
    const createTestImageBuffer = () => {
      // Create a simple PNG buffer for testing
      const buffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x3a, 0x75, 0x26, 0xdf,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
        0xae, 0x42, 0x60, 0x82
      ]);
      return buffer;
    };

    it('should create generation with valid data', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Generation started',
        data: {
          generation: {
            prompt: 'Test prompt',
            style: 'realistic',
            status: 'processing',
          },
        },
      });
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/generations')
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required',
      });
    });

    it('should return 400 without image', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Image file is required',
      });
    });

    it('should return 400 without prompt', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 with invalid style', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'invalid-style')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle long prompts correctly', async () => {
      const longPrompt = 'a'.repeat(500); // Exactly at limit

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', longPrompt)
        .field('style', 'artistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(201);

      expect(response.body.data.generation.prompt).toBe(longPrompt);
    });

    it('should reject prompts that are too long', async () => {
      const tooLongPrompt = 'a'.repeat(501); // Over limit

      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', tooLongPrompt)
        .field('style', 'artistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/generations', () => {
    beforeEach(async () => {
      // Create a few test generations
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', `Test prompt ${i}`)
          .field('style', 'realistic')
          .attach('image', createTestImageBuffer(), 'test.png');
      }
    });

    it('should return user generations', async () => {
      const response = await request(app)
        .get('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          generations: expect.any(Array),
          total: expect.any(Number),
        },
      });

      expect(response.body.data.generations.length).toBeGreaterThan(0);
      expect(response.body.data.generations[0]).toHaveProperty('id');
      expect(response.body.data.generations[0]).toHaveProperty('prompt');
      expect(response.body.data.generations[0]).toHaveProperty('style');
      expect(response.body.data.generations[0]).toHaveProperty('status');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/generations')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required',
      });
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/generations?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.generations.length).toBeLessThanOrEqual(2);
    });

    it('should handle invalid limit gracefully', async () => {
      const response = await request(app)
        .get('/api/generations?limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should default to 5
      expect(response.body.data.generations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/generations/:id', () => {
    let generationId: string;

    beforeEach(async () => {
      // Create a test generation
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Single generation test')
        .field('style', 'cartoon')
        .attach('image', createTestImageBuffer(), 'test.png');

      generationId = response.body.data.generation.id;
    });

    it('should return specific generation', async () => {
      const response = await request(app)
        .get(`/api/generations/${generationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          generation: {
            id: generationId,
            prompt: 'Single generation test',
            style: 'cartoon',
            status: expect.any(String),
          },
        },
      });
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get(`/api/generations/${generationId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required',
      });
    });

    it('should return 404 for non-existent generation', async () => {
      const response = await request(app)
        .get('/api/generations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Simulated processing behavior', () => {
    it('should handle simulated failures (20% chance)', async () => {
      // This test might be flaky due to randomness, but we can test the structure
      // We'll create multiple generations and check that some can fail
      
      let hasFailure = false;
      let hasSuccess = false;
      
      // Try multiple times to increase chance of hitting both success and failure
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', `Simulation test ${i}`)
          .field('style', 'vintage')
          .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'test.png');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.generation.status).toBe('processing');

        // Wait a bit and check final status
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const checkResponse = await request(app)
          .get(`/api/generations/${response.body.data.generation.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        if (checkResponse.body.data.generation.status === 'failed') {
          hasFailure = true;
        }
        if (checkResponse.body.data.generation.status === 'completed') {
          hasSuccess = true;
        }
      }

      // At least one should succeed (very high probability)
      expect(hasSuccess).toBe(true);
      
      // Note: We can't guarantee failure due to randomness, but the structure should be correct
    });

    it('should handle overload scenarios with proper error responses', async () => {
      // Create many simultaneous generations to potentially trigger overload-like behavior
      const promises = [];
      
      for (let i = 0; i < 20; i++) {
        const promise = request(app)
          .post('/api/generations')
          .set('Authorization', `Bearer ${authToken}`)
          .field('prompt', `Overload test ${i}`)
          .field('style', 'realistic')
          .attach('image', createTestImageBuffer(), 'test.png');
        
        promises.push(promise);
      }

      const responses = await Promise.all(promises);

      // All should initially succeed (status 201) as they're queued for processing
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.generation.status).toBe('processing');
      });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Check final statuses - some should fail due to random failures
      let failedCount = 0;
      let completedCount = 0;

      for (const response of responses) {
        const generationId = response.body.data.generation.id;
        const statusResponse = await request(app)
          .get(`/api/generations/${generationId}`)
          .set('Authorization', `Bearer ${authToken}`);

        const finalStatus = statusResponse.body.data.generation.status;
        if (finalStatus === 'failed') failedCount++;
        if (finalStatus === 'completed') completedCount++;
      }

      // Should have some successes and likely some failures
      expect(completedCount).toBeGreaterThan(0);
      expect(failedCount + completedCount).toBe(20);
    });

    it('should maintain generation data integrity during failures', async () => {
      const response = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Data integrity test')
        .field('style', 'cartoon')
        .attach('image', createTestImageBuffer(), 'test.png');

      const generationId = response.body.data.generation.id;

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 4000));

      const finalResponse = await request(app)
        .get(`/api/generations/${generationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const generation = finalResponse.body.data.generation;
      
      // Regardless of success/failure, original data should be preserved
      expect(generation.prompt).toBe('Data integrity test');
      expect(generation.style).toBe('cartoon');
      expect(generation.id).toBe(generationId);
      expect(['completed', 'failed']).toContain(generation.status);
      
      // Should have creation timestamp
      expect(generation.created_at).toBeTruthy();
      
      // Should have image URL (original uploaded image)
      expect(generation.imageUrl).toMatch(/\/uploads\/.+\.png$/);
      
      // If completed, should have result image
      if (generation.status === 'completed') {
        expect(generation.resultImageUrl).toMatch(/\/uploads\/.+\.jpg$/);
      } else {
        expect(generation.resultImageUrl).toBeNull();
      }
    });
  });

  describe('Error response structure validation', () => {
    it('should return consistent error structure for validation failures', async () => {
      // Test missing fields
      const response1 = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      expect(response1.body).toHaveProperty('success', false);
      expect(response1.body).toHaveProperty('message');
      expect(typeof response1.body.message).toBe('string');

      // Test invalid style
      const response2 = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'invalid-style')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      expect(response2.body).toHaveProperty('success', false);
      expect(response2.body).toHaveProperty('message');
      expect(response2.body.message).toContain('Invalid style option');

      // Test prompt too long
      const longPrompt = 'a'.repeat(501);
      const response3 = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', longPrompt)
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      expect(response3.body).toHaveProperty('success', false);
      expect(response3.body.message).toContain('Prompt too long');
    });

    it('should return consistent error structure for authentication failures', async () => {
      const response = await request(app)
        .post('/api/generations')
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required'
      });

      // Invalid token
      const response2 = await request(app)
        .post('/api/generations')
        .set('Authorization', 'Bearer invalid-token')
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(401);

      expect(response2.body).toMatchObject({
        success: false,
        message: 'Invalid token'
      });
    });

    it('should return consistent error structure for file validation failures', async () => {
      // Test missing file
      const response1 = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Test prompt')
        .field('style', 'realistic')
        .expect(400);

      expect(response1.body).toMatchObject({
        success: false,
        message: 'Image file is required'
      });

      // Test file too large (simulate by checking message pattern)
      // Note: This is hard to test without actually creating a large file
      // The validation logic exists in validateImageFile function
    });

    it('should return proper HTTP status codes for different error types', async () => {
      // 400 for validation errors
      await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(400);

      // 401 for authentication errors
      await request(app)
        .post('/api/generations')
        .field('prompt', 'Test')
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png')
        .expect(401);

      // 404 for non-existent resources
      await request(app)
        .get('/api/generations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle authorization vs authentication consistently', async () => {
      // Create a generation with one user
      const generationResponse = await request(app)
        .post('/api/generations')
        .set('Authorization', `Bearer ${authToken}`)
        .field('prompt', 'Access control test')
        .field('style', 'realistic')
        .attach('image', createTestImageBuffer(), 'test.png');

      const generationId = generationResponse.body.data.generation.id;

      // Create another user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'other@example.com',
          password: 'password123',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password123',
        });

      const otherUserToken = loginResponse.body.data.token;

      // Try to access first user's generation
      const accessResponse = await request(app)
        .get(`/api/generations/${generationId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(accessResponse.body).toMatchObject({
        success: false,
        message: 'Access denied'
      });
    });
  });
});
