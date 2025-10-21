// Jest setup file

// Mock uuid module to avoid ES module issues and provide unique IDs
let mockCounter = 0;
jest.mock('uuid', () => ({
  v4: () => `mocked-uuid-${++mockCounter}`
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Increase timeout for database operations
jest.setTimeout(10000);
