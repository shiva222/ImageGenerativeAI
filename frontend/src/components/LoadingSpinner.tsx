import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'gradient';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerSizeClasses = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Enhanced default spinner with multiple layers
  const renderDefaultSpinner = () => (
    <div className="relative">
      {/* Outer glow ring */}
      <div 
        className={`${sizeClasses[size]} animate-spin-slow rounded-full absolute opacity-30`}
        style={{
          background: 'conic-gradient(from 0deg, transparent, #6366f1, transparent)',
          filter: 'blur(2px)',
          animationDuration: '2s'
        }}
      />
      
      {/* Main spinning ring */}
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-transparent relative z-10`}
        style={{
          background: 'conic-gradient(from 0deg, #e5e7eb, #6366f1, #8b5cf6, #e5e7eb)',
          borderRadius: '50%',
          padding: '2px',
          animationDuration: '1.2s'
        }}
      >
        <div className="w-full h-full bg-white rounded-full"></div>
      </div>

      {/* Counter-rotating inner ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`${
            size === 'sm' ? 'h-3 w-3' : 
            size === 'md' ? 'h-5 w-5' : 'h-8 w-8'
          } animate-spin-reverse rounded-full border border-primary-300`}
          style={{
            animationDuration: '1.8s'
          }}
        />
      </div>
        
      {/* Central sparkle icon */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <SparklesIcon 
          className={`${
            size === 'sm' ? 'h-2 w-2' : 
            size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
          } text-primary-600 animate-twinkle`} 
        />
      </div>
    </div>
  );

  // Animated dots loader
  const renderDotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${
            size === 'sm' ? 'h-1.5 w-1.5' : 
            size === 'md' ? 'h-2 w-2' : 'h-3 w-3'
          } bg-primary-500 rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );

  // Pulsing gradient circle
  const renderPulseSpinner = () => (
    <div 
      className={`${sizeClasses[size]} rounded-full animate-pulse-scale`}
      style={{
        background: 'linear-gradient(45deg, #6366f1, #8b5cf6, #d946ef)',
        animationDuration: '1.5s'
      }}
    />
  );

  // Gradient wave loader
  const renderGradientSpinner = () => (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} rounded-full overflow-hidden relative`}
        style={{
          background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
        }}
      >
        <div 
          className="absolute inset-0 animate-wave"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            transform: 'translateX(-100%)',
            animationDuration: '1.5s'
          }}
        />
      </div>
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots': return renderDotsSpinner();
      case 'pulse': return renderPulseSpinner();
      case 'gradient': return renderGradientSpinner();
      default: return renderDefaultSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]}`}>
      {renderSpinner()}
      
      {text && (
        <p 
          className={`${textSizeClasses[size]} text-gray-600 font-medium animate-text-glow`} 
          aria-live="polite"
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;