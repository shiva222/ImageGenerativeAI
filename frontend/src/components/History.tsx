import React, { useState, useEffect } from 'react';
import type { Generation } from '../types';
import { apiService } from '../services/api';
import GenerationCard from './GenerationCard';
import LoadingSpinner from './LoadingSpinner';
import { 
  ClockIcon, 
  PhotoIcon, 
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const History: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGenerations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGenerations(20); // Load more for history page
      setGenerations(response.data.generations);
      setError('');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load generation history';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (_generation: Generation) => {
    // For the history page, we'll show a toast-like notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>Settings restored! Go to Studio to continue.</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  useEffect(() => {
    loadGenerations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading your generation history..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg mb-4">
          <ClockIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          Generation History
        </h1>
        <p className="text-lg text-white opacity-90">
          View and manage all your creative AI generations
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 bg-opacity-90 backdrop-filter backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl animate-slideIn">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {generations.length === 0 ? (
        <div className="text-center py-16">
          <div className="generation-card max-w-md mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-xl mb-4">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No generations yet
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Start creating amazing AI generations in the studio and they'll appear here for you to manage and revisit.
            </p>
            <a
              href="/studio"
              className="btn-primary inline-flex items-center space-x-2 text-lg px-8 py-4 no-underline"
              style={{ textDecoration: 'none' }}
            >
              <SparklesIcon className="h-5 w-5" />
              <span>Go to Studio</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="generation-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <ClockIcon className="h-4 w-4 text-primary-600" />
                  </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {generations.length} generation{generations.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-sm text-gray-600">
                    Your creative journey so far
                  </p>
                </div>
              </div>
              <button
                onClick={loadGenerations}
                className="btn-secondary flex items-center space-x-2 text-sm"
                disabled={loading}
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid gap-4">
              {generations.map((generation, index) => (
                <div 
                  key={generation.id}
                  className="animate-slideIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <GenerationCard
                    generation={generation}
                    onRestore={handleRestore}
                  />
                </div>
              ))}
            </div>

            {generations.length >= 20 && (
              <div className="text-center py-6 mt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing latest 20 generations
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Older generations are automatically archived
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;