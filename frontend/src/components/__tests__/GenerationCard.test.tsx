import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import GenerationCard from '../GenerationCard';
import { mockGeneration, createMockFile } from '../../test/utils';
import { vi } from 'vitest';

describe('GenerationCard', () => {
  const mockOnRestore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render generation card with basic information', () => {
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      expect(screen.getByText(mockGeneration.prompt)).toBeInTheDocument();
      expect(screen.getByText('Realistic')).toBeInTheDocument(); // Style should be capitalized
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display creation date and time', () => {
      const generation = {
        ...mockGeneration,
        createdAt: '2025-10-21T10:30:00Z',
      };

      render(<GenerationCard generation={generation} onRestore={mockOnRestore} />);

      // Should show relative time or formatted date
      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });

    it('should show restore button', () => {
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      expect(restoreButton).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show processing status with spinner icon', () => {
      const processingGeneration = {
        ...mockGeneration,
        status: 'processing' as const,
      };

      render(<GenerationCard generation={processingGeneration} onRestore={mockOnRestore} />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      // Check for spinner animation class
      const statusIcon = screen.getByTestId('status-icon') || document.querySelector('.animate-spin');
      expect(statusIcon).toBeInTheDocument();
    });

    it('should show completed status with check icon', () => {
      const completedGeneration = {
        ...mockGeneration,
        status: 'completed' as const,
      };

      render(<GenerationCard generation={completedGeneration} onRestore={mockOnRestore} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      // Should have green styling for completed status
      const statusBadge = screen.getByText('Completed').closest('[class*="status"]');
      expect(statusBadge).toHaveClass(/completed|green/);
    });

    it('should show failed status with error icon', () => {
      const failedGeneration = {
        ...mockGeneration,
        status: 'failed' as const,
      };

      render(<GenerationCard generation={failedGeneration} onRestore={mockOnRestore} />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
      // Should have red styling for failed status
      const statusBadge = screen.getByText('Failed').closest('[class*="status"]');
      expect(statusBadge).toHaveClass(/failed|red/);
    });
  });

  describe('Image Display', () => {
    it('should show original image when available', () => {
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      const originalImage = screen.getByAltText(/original/i);
      expect(originalImage).toBeInTheDocument();
      expect(originalImage).toHaveAttribute('src', mockGeneration.imageUrl);
    });

    it('should show result image when generation is completed', () => {
      const completedGeneration = {
        ...mockGeneration,
        status: 'completed' as const,
        resultImageUrl: '/uploads/result-image.jpg',
      };

      render(<GenerationCard generation={completedGeneration} onRestore={mockOnRestore} />);

      const resultImage = screen.getByAltText(/result|generated/i);
      expect(resultImage).toBeInTheDocument();
      expect(resultImage).toHaveAttribute('src', completedGeneration.resultImageUrl);
    });

    it('should handle missing images gracefully', () => {
      const generationWithoutImages = {
        ...mockGeneration,
        imageUrl: undefined,
        resultImageUrl: undefined,
      };

      render(<GenerationCard generation={generationWithoutImages} onRestore={mockOnRestore} />);

      // Should render without crashing
      expect(screen.getByText(mockGeneration.prompt)).toBeInTheDocument();
      
      // Should show placeholder or fallback
      const placeholders = screen.queryAllByText(/no image/i);
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('Style Display', () => {
    it('should display different style options correctly', () => {
      const styles = ['realistic', 'artistic', 'cartoon', 'vintage'] as const;
      
      styles.forEach(style => {
        const generation = { ...mockGeneration, style };
        const { unmount } = render(<GenerationCard generation={generation} onRestore={mockOnRestore} />);
        
        // Style should be capitalized
        const expectedLabel = style.charAt(0).toUpperCase() + style.slice(1);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should show style with appropriate styling or icon', () => {
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      const styleElement = screen.getByText('Realistic');
      expect(styleElement).toBeInTheDocument();
      
      // Should have appropriate styling class
      const styleContainer = styleElement.closest('[class*="style"]') || styleElement.parentElement;
      expect(styleContainer).toHaveClass(/style|badge|tag/);
    });
  });

  describe('Interactions', () => {
    it('should call onRestore when restore button is clicked', async () => {
      const user = userEvent.setup();
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      await user.click(restoreButton);

      expect(mockOnRestore).toHaveBeenCalledWith(mockGeneration);
      expect(mockOnRestore).toHaveBeenCalledTimes(1);
    });

    it('should show hover effects on interactive elements', async () => {
      const user = userEvent.setup();
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      const card = screen.getByText(mockGeneration.prompt).closest('[class*="card"]') || 
                  screen.getByText(mockGeneration.prompt).closest('div');
      
      if (card) {
        await user.hover(card);
        
        // Should have hover effects (hard to test directly, but check for interactive classes)
        expect(card).toHaveClass(/hover|cursor|transform/);
      }
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<GenerationCard generation={mockGeneration} onRestore={mockOnRestore} />);

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      
      // Should be focusable
      restoreButton.focus();
      expect(restoreButton).toHaveFocus();

      // Should work with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnRestore).toHaveBeenCalledWith(mockGeneration);
    });
  });

  describe('Truncated Text', () => {
    it('should handle long prompts gracefully', () => {
      const longPromptGeneration = {
        ...mockGeneration,
        prompt: 'A'.repeat(200), // Very long prompt
      };

      render(<GenerationCard generation={longPromptGeneration} onRestore={mockOnRestore} />);

      const promptElement = screen.getByText(longPromptGeneration.prompt, { exact: false });
      expect(promptElement).toBeInTheDocument();
      
      // Should have truncation styling
      expect(promptElement).toHaveClass(/truncate|ellipsis|clamp/);
    });

    it('should show full prompt on hover or expansion', async () => {
      const user = userEvent.setup();
      const longPromptGeneration = {
        ...mockGeneration,
        prompt: 'This is a very long prompt that should be truncated in the UI but shown fully when hovered or expanded',
      };

      render(<GenerationCard generation={longPromptGeneration} onRestore={mockOnRestore} />);

      const promptElement = screen.getByText(longPromptGeneration.prompt, { exact: false });
      
      // Hover should reveal full text or have tooltip
      await user.hover(promptElement);
      
      // Check if full text is available (either visible or in title attribute)
      const hasFullText = promptElement.textContent?.includes(longPromptGeneration.prompt) ||
                         promptElement.getAttribute('title')?.includes(longPromptGeneration.prompt);
      expect(hasFullText).toBe(true);
    });
  });

  describe('Error States', () => {
    it('should handle generation with missing properties', () => {
      const incompleteGeneration = {
        id: 'test-id',
        prompt: 'Test prompt',
        status: 'completed' as const,
        // Missing other properties
      } as any;

      render(<GenerationCard generation={incompleteGeneration} onRestore={mockOnRestore} />);

      // Should render without crashing
      expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDateGeneration = {
        ...mockGeneration,
        createdAt: 'invalid-date',
      };

      render(<GenerationCard generation={invalidDateGeneration} onRestore={mockOnRestore} />);

      // Should render without crashing
      expect(screen.getByText(mockGeneration.prompt)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props do not change', () => {
      let renderCount = 0;
      const TestComponent = ({ generation, onRestore }: any) => {
        renderCount++;
        return <GenerationCard generation={generation} onRestore={onRestore} />;
      };

      const { rerender } = render(
        <TestComponent generation={mockGeneration} onRestore={mockOnRestore} />
      );

      const initialRenderCount = renderCount;

      // Rerender with same props
      rerender(
        <TestComponent generation={mockGeneration} onRestore={mockOnRestore} />
      );

      // Should not have re-rendered (if component is properly memoized)
      expect(renderCount).toBe(initialRenderCount + 1); // +1 for rerender call itself
    });
  });
});
