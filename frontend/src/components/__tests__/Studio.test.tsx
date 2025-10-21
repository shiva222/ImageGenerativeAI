import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Studio from '../Studio';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { apiService } from '../../services/api';
import { mockGeneration, createMockFile } from '../../test/utils';
import { vi } from 'vitest';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    createGeneration: vi.fn(),
    getGenerations: vi.fn(),
  },
}));

// Mock URL.createObjectURL for file preview
global.URL.createObjectURL = vi.fn(() => 'mock-url');

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Studio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getGenerations to return empty array by default
    const mockGetGenerations = (apiService as any).getGenerations;
    mockGetGenerations.mockResolvedValue({ data: { generations: [] } });
  });

  describe('Rendering', () => {
    it('should render all studio components', async () => {
      renderWithProviders(<Studio />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Drop your image here, or click to browse')).toBeInTheDocument();
      });

      expect(screen.getByText('Describe Your Vision')).toBeInTheDocument();
      expect(screen.getByText('Choose Style')).toBeInTheDocument();
      expect(screen.getByText('Select One')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });

    it('should render style options in 2x2 grid', async () => {
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByText('Realistic')).toBeInTheDocument();
      });

      expect(screen.getByText('Realistic')).toBeInTheDocument();
      expect(screen.getByText('Artistic')).toBeInTheDocument();
      expect(screen.getByText('Cartoon')).toBeInTheDocument();
      expect(screen.getByText('Vintage')).toBeInTheDocument();
    });

    it('should show recent creations section', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ data: { generations: [mockGeneration] } });

      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByText('Recent Creations')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('should show file upload zone', async () => {
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByText('Drop your image here, or click to browse')).toBeInTheDocument();
        expect(screen.getByText('Support for PNG, JPG • Max 10MB')).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png');
    });

    // Note: File upload functionality testing requires more complex setup
    // These tests are simplified to focus on component structure
  });

  describe('Prompt Input', () => {
    it('should allow entering a prompt', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/describe what you want to generate/i)).toBeInTheDocument();
      });

      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);

      await user.type(promptTextarea, 'A beautiful landscape with mountains and lakes');

      expect(promptTextarea).toHaveValue('A beautiful landscape with mountains and lakes');
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByText('0/500')).toBeInTheDocument();
      });

      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);

      await user.type(promptTextarea, 'Test prompt');

      expect(screen.getByText('11/500')).toBeInTheDocument();
    });

    it('should limit prompt to 500 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Studio />);

      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i) as HTMLTextAreaElement;

      expect(promptTextarea).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Style Selection', () => {
    it('should render style options', async () => {
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByText('Realistic')).toBeInTheDocument();
        expect(screen.getByText('Artistic')).toBeInTheDocument();
        expect(screen.getByText('Cartoon')).toBeInTheDocument();
        expect(screen.getByText('Vintage')).toBeInTheDocument();
      });
    });

    it('should have realistic style selected by default', async () => {
      renderWithProviders(<Studio />);

      await waitFor(() => {
        const realisticRadio = screen.getByDisplayValue('realistic');
        expect(realisticRadio).toBeChecked();
      });
    });

    it('should allow selecting a different style', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByText('Artistic')).toBeInTheDocument();
      });

      const artisticRadio = screen.getByDisplayValue('artistic');
      await user.click(artisticRadio);

      expect(artisticRadio).toBeChecked();
    });
  });

  describe('Generation Process', () => {
    it('should render generate button', async () => {
      renderWithProviders(<Studio />);

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /generate/i });
        expect(generateButton).toBeInTheDocument();
        expect(generateButton).toBeDisabled(); // Initially disabled without file/prompt
      });
    });

    it('should enable generate button when file and prompt are provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Studio />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Initially disabled
      expect(generateButton).toBeDisabled();

      // Add prompt
      await user.type(promptTextarea, 'A beautiful landscape');
      expect(generateButton).toBeDisabled(); // Still disabled without file

      // Add file (simulate file selection)
      const file = createMockFile();
      
      // Simulate file change event directly
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      // Create controllable promise
      let resolveGeneration: any;
      const generationPromise = new Promise(resolve => {
        resolveGeneration = resolve;
      });
      mockCreate.mockReturnValue(generationPromise);

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      
      // Start generation
      await user.click(generateButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Generating Magic...')).toBeInTheDocument();
        expect(generateButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
      });

      // Resolve generation
      resolveGeneration({ data: mockGeneration });

      await waitFor(() => {
        expect(screen.queryByText('Generating Magic...')).not.toBeInTheDocument();
        expect(generateButton).not.toBeDisabled();
        expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
      });
    });

    it('should update history after successful generation', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      const mockGetGenerations = (apiService as any).getGenerations;

      // Initially empty  
      mockGetGenerations.mockResolvedValue({ data: { generations: [] } });

      const updatedGenerations = [mockGeneration];
      mockCreate.mockResolvedValue({ data: mockGeneration });

      renderWithProviders(<Studio />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('No generations yet')).toBeInTheDocument();
      });

      // Fill form and generate
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'A beautiful landscape');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      // Mock getGenerations to return the new generation after creation
      mockGetGenerations.mockResolvedValueOnce({ data: { generations: updatedGenerations } });

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Wait for generation to complete and history to update
      await waitFor(() => {
        // Verify that the prompt appears in the history (multiple elements are expected)
        const promptElements = screen.getAllByText(mockGeneration.prompt);
        expect(promptElements.length).toBeGreaterThan(1); // Should be in both input and history
      });

      expect(screen.queryByText('No generations yet')).not.toBeInTheDocument();
    });

    it('should handle generation errors gracefully', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      mockCreate.mockRejectedValue({
        response: { data: { message: 'Generation failed' } }
      });

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
      });

      // Should not be in loading state
      expect(screen.queryByText('Generating Magic...')).not.toBeInTheDocument();
      expect(generateButton).not.toBeDisabled();
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      mockCreate.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Error and Retry Handling', () => {
    it.skip('should retry up to 3 times on model overload', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      // Mock to fail with overload error 3 times, then succeed
      let callCount = 0;
      mockCreate.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.reject({
            response: { data: { message: 'Model overloaded' } }
          });
        } else {
          return Promise.resolve({ data: mockGeneration });
        }
      });

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Should show retry messages for first attempt
      await waitFor(() => {
        expect(screen.getByText(/Model overloaded.*Retrying.*\(1\/3\)/)).toBeInTheDocument();
      });

      // Fast-forward through retry delays
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(2000); // Skip the 2-second delay
        await vi.runAllTimersAsync(); // Run any pending timers
      }

      // Wait for all retries to complete
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });

      // Should eventually succeed (no more retrying message)
      await waitFor(() => {
        expect(screen.queryByText(/Retrying/)).not.toBeInTheDocument();
      });
      
      vi.useRealTimers(); // Clean up
    });

    it.skip('should stop retrying after 3 attempts', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      // Always fail with overload error
      mockCreate.mockRejectedValue({
        response: { data: { message: 'Model overloaded' } }
      });

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Fast-forward through all retry delays
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(2000); // Skip the 2-second delay
        await vi.runAllTimersAsync(); // Run any pending timers
      }

      // Wait for all retries to complete
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });

      // Should eventually show final error (no more retries)
      await waitFor(() => {
        expect(screen.getByText('Model overloaded')).toBeInTheDocument();
        expect(screen.queryByText(/Retrying/)).not.toBeInTheDocument();
      });
      
      vi.useRealTimers(); // Clean up
    });

    it('should not retry for non-overload errors', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      mockCreate.mockRejectedValue({
        response: { data: { message: 'Invalid prompt' } }
      });

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Invalid prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Should show error immediately without retry
      await waitFor(() => {
        expect(screen.getByText('Invalid prompt')).toBeInTheDocument();
      });

      expect(mockCreate).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Abort Controller Functionality', () => {
    it('should show abort button during generation', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      // Return a pending promise
      mockCreate.mockReturnValue(new Promise(() => {})); // Never resolves

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Should show abort button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
      });
    });

    it('should cancel generation when abort button is clicked', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      let abortController: AbortController | null = null;
      mockCreate.mockImplementation((data: any, controller: AbortController) => {
        abortController = controller;
        return new Promise((resolve, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('AbortError'));
          });
        });
      });

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Click abort button
      const abortButton = await screen.findByRole('button', { name: /stop/i });
      await user.click(abortButton);

      // Should clear loading state
      await waitFor(() => {
        expect(screen.queryByText('Generating Magic...')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
      });

      // AbortController should have been aborted
      expect((abortController as unknown as AbortController).signal.aborted).toBe(true);
    });

    it('should handle abort during retry sequence', async () => {
      const user = userEvent.setup();
      const mockCreate = (apiService as any).createGeneration;
      
      let abortController: AbortController | null = null;
      mockCreate.mockImplementation((data: any, controller: AbortController) => {
        abortController = controller;
        return Promise.reject({
          response: { data: { message: 'Model overloaded' } }
        });
      });

      renderWithProviders(<Studio />);

      // Fill form
      const promptTextarea = screen.getByPlaceholderText(/describe what you want to generate/i);
      await user.type(promptTextarea, 'Test prompt');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile();
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      // Wait for first retry message
      await waitFor(() => {
        expect(screen.getByText(/Retrying.*1\/3/)).toBeInTheDocument();
      });

      // Abort during retry
      const abortButton = screen.getByRole('button', { name: /stop/i });
      await user.click(abortButton);

      // Should stop retrying and clear state
      await waitFor(() => {
        expect(screen.queryByText(/Retrying/)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(<Studio />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
      });

      const promptTextarea = screen.getByLabelText(/describe your vision/i);
      const generateButton = screen.getByRole('button', { name: /generate/i });

      expect(promptTextarea).toBeInTheDocument();
      expect(generateButton).toBeInTheDocument();
      
      // Check that file input exists
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });
});
