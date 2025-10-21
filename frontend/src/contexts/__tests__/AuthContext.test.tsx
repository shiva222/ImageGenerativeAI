import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { mockUser, mockApiResponses } from '../../test/utils';
import { vi } from 'vitest';

// Mock the API service
const mockApiService = {
  auth: {
    signup: vi.fn(),
    login: vi.fn(),
    getProfile: vi.fn(),
  },
};

vi.mock('../../services/api', () => ({
  apiService: mockApiService,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, signup, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <button onClick={() => signup({ email: 'test@example.com', password: 'password' })}>
        Signup
      </button>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should render with no user initially', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    it('should restore user from localStorage if token exists', async () => {
      // Mock localStorage with token
      localStorage.setItem('auth_token', 'mock-token');
      
      // Mock API call to get profile
      mockApiService.auth.getProfile.mockResolvedValue({ data: mockUser });

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      expect(mockApiService.auth.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid token in localStorage', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      
      mockApiService.auth.getProfile.mockRejectedValue(new Error('Invalid token'));

      renderWithProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });

      // Should clear invalid token
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Signup', () => {
    it('should signup user successfully', async () => {
      const user = userEvent.setup();
      mockApiService.auth.signup.mockResolvedValue({ data: mockApiResponses.auth.signup });

      renderWithProvider(<TestComponent />);

      // Initially no user
      expect(screen.getByTestId('user')).toHaveTextContent('No user');

      // Click signup button
      await user.click(screen.getByText('Signup'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      // Should store token in localStorage
      expect(localStorage.getItem('auth_token')).toBe(mockApiResponses.auth.signup.token);
      
      // Should navigate to studio
      expect(mockNavigate).toHaveBeenCalledWith('/studio');
    });

    it('should handle signup error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already exists';
      mockApiService.auth.signup.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Signup'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login user successfully', async () => {
      const user = userEvent.setup();
      mockApiService.auth.login.mockResolvedValue({ data: mockApiResponses.auth.login });

      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      expect(localStorage.getItem('auth_token')).toBe(mockApiResponses.auth.login.token);
      expect(mockNavigate).toHaveBeenCalledWith('/studio');
    });

    it('should handle login error', async () => {
      const user = userEvent.setup();
      mockApiService.auth.login.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } }
      });

      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
    });
  });

  describe('Logout', () => {
    it('should logout user successfully', async () => {
      const user = userEvent.setup();
      
      // Set up user in context
      localStorage.setItem('auth_token', 'mock-token');
      mockApiService.auth.getProfile.mockResolvedValue({ data: mockUser });

      renderWithProvider(<TestComponent />);

      // Wait for user to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      // Logout
      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during signup', async () => {
      const user = userEvent.setup();
      // Create a promise that we can control
      let resolveSignup: any;
      const signupPromise = new Promise(resolve => {
        resolveSignup = resolve;
      });
      mockApiService.auth.signup.mockReturnValue(signupPromise);

      renderWithProvider(<TestComponent />);

      // Start signup
      await user.click(screen.getByText('Signup'));

      // Should show loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // Resolve signup
      resolveSignup({ data: mockApiResponses.auth.signup });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      });
    });
  });
});
