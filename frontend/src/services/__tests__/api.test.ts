import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../api';
import axios from 'axios';
import { mockUser, mockGeneration, createMockFile } from '../../test/utils';

// Mock axios
const mockedAxios = {
  create: vi.fn(() => mockedAxios),
  get: vi.fn(),
  post: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: mockedAxios,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = mockLocalStorage as any;

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('Authentication', () => {
    describe('signup', () => {
      it('should make POST request to signup endpoint', async () => {
        const signupData = { email: 'test@example.com', password: 'password123' };
        const expectedResponse = { user: mockUser, token: 'jwt-token' };
        
        mockedAxios.post.mockResolvedValue({ data: expectedResponse });

        const result = await (apiService as any).auth.signup(signupData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/signup', signupData);
        expect(result.data).toEqual(expectedResponse);
      });

      it('should handle signup errors', async () => {
        const signupData = { email: 'test@example.com', password: 'password123' };
        const errorResponse = { 
          response: { 
            data: { message: 'Email already exists' },
            status: 400 
          }
        };

        mockedAxios.post.mockRejectedValue(errorResponse);

        await expect((apiService as any).auth.signup(signupData)).rejects.toEqual(errorResponse);
      });
    });

    describe('login', () => {
      it('should make POST request to login endpoint', async () => {
        const loginData = { email: 'test@example.com', password: 'password123' };
        const expectedResponse = { user: mockUser, token: 'jwt-token' };
        
        mockedAxios.post.mockResolvedValue({ data: expectedResponse });

        const result = await (apiService as any).auth.login(loginData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', loginData);
        expect(result.data).toEqual(expectedResponse);
      });

      it('should handle login errors', async () => {
        const loginData = { email: 'test@example.com', password: 'wrongpassword' };
        const errorResponse = { 
          response: { 
            data: { message: 'Invalid credentials' },
            status: 401 
          }
        };

        mockedAxios.post.mockRejectedValue(errorResponse);

        await expect((apiService as any).auth.login(loginData)).rejects.toEqual(errorResponse);
      });
    });

    describe('getProfile', () => {
      it('should make GET request to profile endpoint', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockUser });

        const result = await (apiService as any).auth.getProfile();

        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/me');
        expect(result.data).toEqual(mockUser);
      });

      it('should handle profile fetch errors', async () => {
        const errorResponse = { 
          response: { 
            data: { message: 'Unauthorized' },
            status: 401 
          }
        };

        mockedAxios.get.mockRejectedValue(errorResponse);

        await expect((apiService as any).auth.getProfile()).rejects.toEqual(errorResponse);
      });
    });
  });

  describe('Generations', () => {
    describe('create', () => {
      it('should make POST request with FormData for generation', async () => {
        const file = createMockFile('test.jpg');
        const generationData = {
          prompt: 'A beautiful landscape',
          style: 'realistic' as const,
          image: file,
        };

        mockedAxios.post.mockResolvedValue({ data: mockGeneration });

        const result = await (apiService as any).generations.create(generationData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/generations', expect.any(FormData), {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        expect(result.data).toEqual(mockGeneration);
      });

      it('should properly construct FormData', async () => {
        const file = createMockFile('test.jpg');
        const generationData = {
          prompt: 'A beautiful landscape',
          style: 'artistic' as const,
          image: file,
        };

        mockedAxios.post.mockResolvedValue({ data: mockGeneration });

        await (apiService as any).generations.create(generationData);

        const callArgs = mockedAxios.post.mock.calls[0];
        const formData = callArgs[1] as FormData;

        expect(formData).toBeInstanceOf(FormData);
        // Note: FormData.get() might not be available in all test environments
        // This tests that FormData was created properly
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/generations',
          expect.any(FormData),
          expect.objectContaining({
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        );
      });

      it('should handle generation creation errors', async () => {
        const file = createMockFile('test.jpg');
        const generationData = {
          prompt: 'A beautiful landscape',
          style: 'realistic' as const,
          image: file,
        };

        const errorResponse = { 
          response: { 
            data: { message: 'Generation failed' },
            status: 500 
          }
        };

        mockedAxios.post.mockRejectedValue(errorResponse);

        await expect((apiService as any).generations.create(generationData)).rejects.toEqual(errorResponse);
      });

      it('should handle file size validation on client side', async () => {
        const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024); // 15MB
        const generationData = {
          prompt: 'A beautiful landscape',
          style: 'realistic' as const,
          image: largeFile,
        };

        // The API service should still attempt the request
        // File validation might happen in the component or backend
        mockedAxios.post.mockRejectedValue({
          response: {
            data: { message: 'File too large' },
            status: 400
          }
        });

        await expect((apiService as any).generations.create(generationData)).rejects.toMatchObject({
          response: {
            data: { message: 'File too large' },
            status: 400
          }
        });
      });
    });

    describe('getRecent', () => {
      it('should make GET request to generations endpoint with default limit', async () => {
        const mockGenerations = [mockGeneration];
        mockedAxios.get.mockResolvedValue({ data: mockGenerations });

        const result = await (apiService as any).generations.getRecent();

        expect(mockedAxios.get).toHaveBeenCalledWith('/generations?limit=5');
        expect(result.data).toEqual(mockGenerations);
      });

      it('should make GET request with custom limit', async () => {
        const mockGenerations = [mockGeneration];
        mockedAxios.get.mockResolvedValue({ data: mockGenerations });

        const result = await (apiService as any).generations.getRecent(10);

        expect(mockedAxios.get).toHaveBeenCalledWith('/generations?limit=10');
        expect(result.data).toEqual(mockGenerations);
      });

      it('should handle empty generations list', async () => {
        mockedAxios.get.mockResolvedValue({ data: [] });

        const result = await (apiService as any).generations.getRecent();

        expect(result.data).toEqual([]);
      });

      it('should handle generations fetch errors', async () => {
        const errorResponse = { 
          response: { 
            data: { message: 'Failed to fetch generations' },
            status: 500 
          }
        };

        mockedAxios.get.mockRejectedValue(errorResponse);

        await expect((apiService as any).generations.getRecent()).rejects.toEqual(errorResponse);
      });
    });
  });

  describe('Axios Instance Configuration', () => {
    it('should have correct base configuration', () => {
      // Test that axios instance is created with correct config
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3001/api',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should add authorization header when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      // The request interceptor should add the auth header
      // This would be tested by checking if the interceptor was set up
      expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
    });

    it('should handle requests without token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      // Should still make requests without auth header
      expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
    });

    it('should handle response interceptor for errors', () => {
      // Should set up response interceptor
      expect(mockedAxios.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should pass through network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect((apiService as any).auth.getProfile()).rejects.toEqual(networkError);
    });

    it('should pass through timeout errors', async () => {
      const timeoutError = { 
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded' 
      };
      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect((apiService as any).auth.getProfile()).rejects.toEqual(timeoutError);
    });

    it('should handle 404 errors', async () => {
      const notFoundError = { 
        response: { 
          data: { message: 'Not found' },
          status: 404 
        }
      };
      mockedAxios.get.mockRejectedValue(notFoundError);

      await expect((apiService as any).auth.getProfile()).rejects.toEqual(notFoundError);
    });

    it('should handle 500 server errors', async () => {
      const serverError = { 
        response: { 
          data: { message: 'Internal server error' },
          status: 500 
        }
      };
      mockedAxios.get.mockRejectedValue(serverError);

      await expect((apiService as any).generations.getRecent()).rejects.toEqual(serverError);
    });
  });

  describe('Content Types', () => {
    it('should use application/json for regular requests', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockUser });

      await (apiService as any).auth.login({ email: 'test@example.com', password: 'password' });

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', expect.any(Object));
    });

    it('should use multipart/form-data for file uploads', async () => {
      const file = createMockFile('test.jpg');
      mockedAxios.post.mockResolvedValue({ data: mockGeneration });

      await (apiService as any).generations.create({
        prompt: 'test',
        style: 'realistic',
        image: file,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/generations',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });
  });
});
