import React from 'react';
import type { Generation } from '../types';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PhotoIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface GenerationCardProps {
  generation: Generation;
  onRestore: (generation: Generation) => void;
}

const GenerationCard: React.FC<GenerationCardProps> = ({ generation, onRestore }) => {
  const getStatusIcon = () => {
    switch (generation.status) {
      case 'processing':
        return <ClockIcon className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (generation.status) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  };

  const getStatusBadgeClass = () => {
    switch (generation.status) {
      case 'processing':
        return 'status-badge status-processing';
      case 'completed':
        return 'status-badge status-completed';
      case 'failed':
        return 'status-badge status-failed';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleDateString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStyleEmoji = (style: string) => {
    switch (style) {
      case 'realistic': return '📸';
      case 'artistic': return '🎨';
      case 'cartoon': return '🎭';
      case 'vintage': return '📺';
      default: return '✨';
    }
  };

  const imageToShow = generation.resultImageUrl || generation.imageUrl;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-primary-200 transition-all duration-300 hover:shadow-lg group">
      <div className="flex items-start space-x-4">
        {/* Image Preview */}
        <div className="flex-shrink-0 relative">
          {imageToShow ? (
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${imageToShow}`}
                alt="Generation preview"
                className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className={`w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${imageToShow ? 'hidden' : ''}`}>
                <PhotoIcon className="h-6 w-6 text-gray-400" />
              </div>
              {/* Status overlay for processing */}
              {generation.status === 'processing' && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                  <div className="animate-spin">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <PhotoIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className={getStatusBadgeClass()}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
            <button
              onClick={() => onRestore(generation)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 group-hover:scale-110"
              title="Restore this generation"
              aria-label="Restore generation settings"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-gray-900 font-medium line-clamp-2 leading-snug">
              {generation.prompt}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStyleEmoji(generation.style)}</span>
              <span className="text-gray-600 font-medium capitalize">
                {generation.style}
              </span>
            </div>
            <span className="text-gray-500 text-xs">
              {formatDate(generation.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary-200 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};

export default GenerationCard;