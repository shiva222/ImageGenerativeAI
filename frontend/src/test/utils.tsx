import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

// Mock generation data
export const mockGeneration = {
  id: 'test-generation-id',
  prompt: 'A beautiful landscape',
  style: 'realistic' as const,
  status: 'completed' as const,
  imageUrl: '/uploads/test-image.jpg',
  originalImageUrl: '/uploads/original-test-image.jpg',
  created_at: '2025-10-21T10:00:00Z',
  updated_at: '2025-10-21T10:05:00Z',
  createdAt: '2025-10-21T10:00:00Z',
  updatedAt: '2025-10-21T10:05:00Z',
  userId: 'test-user-id',
};

// Mock API responses
export const mockApiResponses = {
  auth: {
    signup: {
      user: mockUser,
      token: 'mock-jwt-token',
    },
    login: {
      user: mockUser,
      token: 'mock-jwt-token',
    },
    me: mockUser,
  },
  generations: {
    create: mockGeneration,
    list: [mockGeneration],
  },
};

// Test wrapper with providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock file for testing file uploads
export const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to wait for async operations
export const waitForAsyncOperation = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock axios instance
export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

// Mock API service
export const mockApiService = {
  auth: {
    signup: vi.fn(),
    login: vi.fn(),
    getProfile: vi.fn(),
  },
  generations: {
    create: vi.fn(),
    getRecent: vi.fn(),
  },
};
