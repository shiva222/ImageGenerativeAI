import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import History from '../History';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { apiService } from '../../services/api';
import { mockGeneration } from '../../test/utils';
import { vi } from 'vitest';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getGenerations: vi.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful empty response by default
    const mockGetGenerations = (apiService as any).getGenerations;
    mockGetGenerations.mockResolvedValue({ 
      data: { 
        generations: [] 
      } 
    });
  });

  describe('Rendering', () => {
    it('should render history page header', async () => {
      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/AI Generation History/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/View and manage your AI generations/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      // Return a promise that doesn't resolve immediately
      mockGetGenerations.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<History />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show refresh button', async () => {
      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no generations exist', async () => {
      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/No generations yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Start creating/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to studio/i })).toBeInTheDocument();
    });

    it('should have working link to studio page', async () => {
      renderWithProviders(<History />);

      await waitFor(() => {
        const studioLink = screen.getByRole('link', { name: /go to studio/i });
        expect(studioLink).toHaveAttribute('href', '/studio');
      });
    });
  });

  describe('Generations Display', () => {
    const mockGenerations = [
      { ...mockGeneration, id: '1', prompt: 'First generation' },
      { ...mockGeneration, id: '2', prompt: 'Second generation' },
      { ...mockGeneration, id: '3', prompt: 'Third generation' },
    ];

    it('should display list of generations', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: mockGenerations 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText('First generation')).toBeInTheDocument();
        expect(screen.getByText('Second generation')).toBeInTheDocument();
        expect(screen.getByText('Third generation')).toBeInTheDocument();
      });

      // Should not show empty state
      expect(screen.queryByText(/No generations yet/i)).not.toBeInTheDocument();
    });

    it('should display generation count', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: mockGenerations 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/3.*generation/i)).toBeInTheDocument();
      });
    });

    it('should handle single generation correctly', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: [mockGeneration] 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/1.*generation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    const mockGenerations = [
      { ...mockGeneration, id: '1', status: 'completed' as const, prompt: 'Completed generation' },
      { ...mockGeneration, id: '2', status: 'failed' as const, prompt: 'Failed generation' },
      { ...mockGeneration, id: '3', status: 'processing' as const, prompt: 'Processing generation' },
    ];

    it('should show filter options', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: mockGenerations 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/All/i)).toBeInTheDocument();
        expect(screen.getByText(/Completed/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/Processing/i)).toBeInTheDocument();
      });
    });

    it('should filter generations by status', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: mockGenerations 
        } 
      });

      renderWithProviders(<History />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Completed generation')).toBeInTheDocument();
        expect(screen.getByText('Failed generation')).toBeInTheDocument();
        expect(screen.getByText('Processing generation')).toBeInTheDocument();
      });

      // Click completed filter
      const completedFilter = screen.getByRole('button', { name: /completed/i });
      await user.click(completedFilter);

      // Should only show completed generations
      await waitFor(() => {
        expect(screen.getByText('Completed generation')).toBeInTheDocument();
        expect(screen.queryByText('Failed generation')).not.toBeInTheDocument();
        expect(screen.queryByText('Processing generation')).not.toBeInTheDocument();
      });
    });

    it('should show all generations when "All" filter is selected', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: mockGenerations 
        } 
      });

      renderWithProviders(<History />);

      // First filter to completed
      await waitFor(() => {
        expect(screen.getByText('Completed generation')).toBeInTheDocument();
      });

      const completedFilter = screen.getByRole('button', { name: /completed/i });
      await user.click(completedFilter);

      // Then click "All" to show everything again
      const allFilter = screen.getByRole('button', { name: /all/i });
      await user.click(allFilter);

      await waitFor(() => {
        expect(screen.getByText('Completed generation')).toBeInTheDocument();
        expect(screen.getByText('Failed generation')).toBeInTheDocument();
        expect(screen.getByText('Processing generation')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh generations when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: [] 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should call API again
      expect(mockGetGenerations).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    it('should show loading state during refresh', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      
      // First call resolves immediately
      mockGetGenerations.mockResolvedValueOnce({ 
        data: { 
          generations: [] 
        } 
      });
      
      // Second call (refresh) takes time
      let resolveRefresh: any;
      const refreshPromise = new Promise(resolve => {
        resolveRefresh = resolve;
      });
      mockGetGenerations.mockReturnValueOnce(refreshPromise);

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Resolve refresh
      resolveRefresh({ data: { generations: [] } });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockRejectedValue({
        response: { data: { message: 'Failed to load history' } }
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load history')).toBeInTheDocument();
      });
    });

    it('should show generic error for network failures', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load generation history/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      
      // First call fails
      mockGetGenerations.mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      mockGetGenerations.mockResolvedValueOnce({ 
        data: { 
          generations: [mockGeneration] 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load generation history/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry|refresh/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(mockGeneration.prompt)).toBeInTheDocument();
        expect(screen.queryByText(/Failed to load/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Restore Functionality', () => {
    it('should show notification when generation is restored', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: [mockGeneration] 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(mockGeneration.prompt)).toBeInTheDocument();
      });

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      await user.click(restoreButton);

      // Should show notification (check for notification content)
      await waitFor(() => {
        expect(screen.getByText(/Settings restored/i)).toBeInTheDocument();
      });
    });

    it('should auto-hide notification after timeout', async () => {
      const user = userEvent.setup();
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: [mockGeneration] 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText(mockGeneration.prompt)).toBeInTheDocument();
      });

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      await user.click(restoreButton);

      // Notification should appear
      await waitFor(() => {
        expect(screen.getByText(/Settings restored/i)).toBeInTheDocument();
      });

      // Wait for auto-hide (3 seconds + buffer)
      await waitFor(() => {
        expect(screen.queryByText(/Settings restored/i)).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderWithProviders(<History />);

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toBeInTheDocument();
        expect(mainHeading).toHaveTextContent(/AI Generation History/i);
      });
    });

    it('should have accessible filter buttons', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: [mockGeneration] 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        const filterButtons = screen.getAllByRole('button');
        const filterGroup = filterButtons.filter(btn => 
          ['All', 'Completed', 'Failed', 'Processing'].includes(btn.textContent || '')
        );

        filterGroup.forEach(button => {
          expect(button).toHaveAttribute('aria-pressed');
        });
      });
    });

    it('should announce loading and error states to screen readers', async () => {
      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockReturnValue(new Promise(() => {})); // Never resolves

      renderWithProviders(<History />);

      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of generations efficiently', async () => {
      const largeGenerationList = Array.from({ length: 100 }, (_, i) => ({
        ...mockGeneration,
        id: `generation-${i}`,
        prompt: `Generation ${i}`,
      }));

      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: largeGenerationList 
        } 
      });

      const startTime = performance.now();
      
      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText('Generation 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render reasonably quickly (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });

    it('should implement virtualization for long lists', async () => {
      const largeGenerationList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockGeneration,
        id: `generation-${i}`,
        prompt: `Generation ${i}`,
      }));

      const mockGetGenerations = (apiService as any).getGenerations;
      mockGetGenerations.mockResolvedValue({ 
        data: { 
          generations: largeGenerationList 
        } 
      });

      renderWithProviders(<History />);

      await waitFor(() => {
        expect(screen.getByText('Generation 0')).toBeInTheDocument();
      });

      // Should not render all 1000 items in DOM at once
      const renderedItems = screen.getAllByText(/Generation \d+/);
      expect(renderedItems.length).toBeLessThan(100); // Should be virtualized
    });
  });
});
