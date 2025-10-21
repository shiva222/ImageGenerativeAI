import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import SignupForm from '../SignupForm';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { apiService } from '../../services/api';
import { mockApiResponses } from '../../test/utils';
import { vi } from 'vitest';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    signup: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} {...props}>{children}</a>
    ),
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render signup form elements', () => {
      renderWithProviders(<SignupForm />);

      expect(screen.getByText('Join AI Studio')).toBeInTheDocument();
      expect(screen.getByText('Create your account and start generating amazing content')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('should have link to login page', () => {
      renderWithProviders(<SignupForm />);
      
      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should render password toggle buttons', () => {
      renderWithProviders(<SignupForm />);
      
      const passwordToggles = screen.getAllByLabelText(/show password/i);
      expect(passwordToggles).toHaveLength(2); // One for password, one for confirm password
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show password strength indicator when password is entered', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText('Password');

      await user.type(passwordInput, 'weak');

      expect(screen.getByText('Password strength')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should update strength indicator based on password complexity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText('Password');

      // Test weak password
      await user.type(passwordInput, 'abc');
      expect(screen.getByText('Weak')).toBeInTheDocument();

      // Clear and test stronger password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123!');
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('should show password requirements checklist', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText('Password');

      await user.type(passwordInput, 'Test123!');

      expect(screen.getByText('At least 6 characters')).toBeInTheDocument();
      expect(screen.getByText('Lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('Uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Special character')).toBeInTheDocument();
    });
  });

  describe('Password Confirmation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should show success state when passwords match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Confirm password field should have success styling (green border)
      expect(confirmPasswordInput).toHaveClass('border-green-300');
    });
  });

  describe('Form Validation', () => {
    it('should validate all required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Try to submit empty form
      await user.click(submitButton);

      // Debug: Check if any error appears (use a more flexible approach)
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveTextContent('All fields are required');
      }, { timeout: 3000 });
    });

    it('should validate minimum password length', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123'); // Too short
      await user.type(confirmPasswordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
      });
    });

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockSignup = (apiService as any).signup;
      mockSignup.mockResolvedValue({ data: mockApiResponses.auth.signup });

      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Fill and submit form
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockSignup = (apiService as any).signup;
      
      let resolveSignup: any;
      const signupPromise = new Promise(resolve => {
        resolveSignup = resolve;
      });
      mockSignup.mockReturnValue(signupPromise);

      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      resolveSignup({ data: mockApiResponses.auth.signup });

      await waitFor(() => {
        expect(screen.queryByText('Creating account...')).not.toBeInTheDocument();
      });
    });

    it('should display error message on signup failure', async () => {
      const user = userEvent.setup();
      const mockSignup = (apiService as any).signup;
      const errorMessage = 'Email already exists';
      mockSignup.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signup failed. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Password Toggle Functionality', () => {
    it('should toggle password visibility for main password field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const passwordInput = screen.getByLabelText('Password');
      const passwordToggles = screen.getAllByLabelText(/show password/i);
      const passwordToggle = passwordToggles[0];

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(passwordToggle);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility for confirm password field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const passwordToggles = screen.getAllByLabelText(/show password/i);
      const confirmPasswordToggle = passwordToggles[1];

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      await user.click(confirmPasswordToggle);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignupForm />);

      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
        expect(errorElement).toHaveTextContent('All fields are required');
      });
    });
  });
});
