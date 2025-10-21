import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      const customText = 'Generating your image...';
      render(<LoadingSpinner text={customText} />);
      
      expect(screen.getByText(customText)).toBeInTheDocument();
    });

    it('should render without text when empty string provided', () => {
      render(<LoadingSpinner text="" />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      // Screen reader text should still be present
      expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size spinner', () => {
      render(<LoadingSpinner size="sm" text="Small spinner" />);
      
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('h-5', 'w-5');
      
      const text = screen.getByText('Small spinner');
      expect(text).toHaveClass('text-xs');
    });

    it('should render medium size spinner (default)', () => {
      render(<LoadingSpinner size="md" text="Medium spinner" />);
      
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('h-8', 'w-8');
      
      const text = screen.getByText('Medium spinner');
      expect(text).toHaveClass('text-sm');
    });

    it('should render large size spinner', () => {
      render(<LoadingSpinner size="lg" text="Large spinner" />);
      
      const spinner = screen.getByLabelText('Loading...');
      expect(spinner).toHaveClass('h-12', 'w-12');
      
      const text = screen.getByText('Large spinner');
      expect(text).toHaveClass('text-base');
    });
  });

  describe('Variant Types', () => {
    it('should render default variant', () => {
      render(<LoadingSpinner variant="default" />);
      
      // Should have sparkle icon in default variant
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should render dots variant', () => {
      render(<LoadingSpinner variant="dots" />);
      
      // Should render three dots
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('should render pulse variant', () => {
      render(<LoadingSpinner variant="pulse" />);
      
      // Should have pulse animation class
      const pulseElement = document.querySelector('.animate-pulse-scale');
      expect(pulseElement).toBeInTheDocument();
    });

    it('should render gradient variant', () => {
      render(<LoadingSpinner variant="gradient" />);
      
      // Should have wave animation
      const waveElement = document.querySelector('.animate-wave');
      expect(waveElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingSpinner text="Loading content" />);
      
      const loadingText = screen.getByText('Loading content');
      expect(loadingText).toHaveAttribute('aria-live', 'polite');
      
      const hiddenLabel = screen.getByText('Loading...');
      expect(hiddenLabel).toHaveClass('sr-only');
    });

    it('should be announced to screen readers', () => {
      render(<LoadingSpinner text="Processing your request" />);
      
      const announcement = screen.getByText('Processing your request');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Animation Classes', () => {
    it('should have proper animation classes for default variant', () => {
      render(<LoadingSpinner variant="default" />);
      
      // Check for spinning elements
      const spinningElements = document.querySelectorAll('.animate-spin, .animate-spin-slow, .animate-spin-reverse');
      expect(spinningElements.length).toBeGreaterThan(0);
      
      // Check for twinkle animation on sparkle icon
      const twinkleElement = document.querySelector('.animate-twinkle');
      expect(twinkleElement).toBeInTheDocument();
    });

    it('should have staggered animation delays for dots variant', () => {
      render(<LoadingSpinner variant="dots" />);
      
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
      
      // Each dot should have a different animation delay
      dots.forEach((dot, index) => {
        const computedStyle = window.getComputedStyle(dot);
        expect(computedStyle.animationDelay).toBe(`${index * 0.2}s`);
      });
    });
  });

  describe('Container Spacing', () => {
    it('should apply correct spacing classes based on size', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      
      let container = document.querySelector('.space-y-1');
      expect(container).toBeInTheDocument();

      rerender(<LoadingSpinner size="md" />);
      container = document.querySelector('.space-y-2');
      expect(container).toBeInTheDocument();

      rerender(<LoadingSpinner size="lg" />);
      container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Text Glow Animation', () => {
    it('should apply text glow animation to text', () => {
      render(<LoadingSpinner text="Glowing text" />);
      
      const text = screen.getByText('Glowing text');
      expect(text).toHaveClass('animate-text-glow');
    });
  });

  describe('Integration with Different Contexts', () => {
    it('should work in button context', () => {
      render(
        <button disabled>
          <LoadingSpinner size="sm" text="" />
          <span>Loading...</span>
        </button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    });

    it('should work in form context', () => {
      render(
        <form>
          <LoadingSpinner text="Submitting form..." />
        </form>
      );
      
      expect(screen.getByText('Submitting form...')).toBeInTheDocument();
    });

    it('should work in modal context', () => {
      render(
        <div role="dialog" aria-label="Processing">
          <LoadingSpinner size="lg" text="Processing your request..." />
        </div>
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
    });
  });
});
