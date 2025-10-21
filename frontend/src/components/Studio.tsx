import React, { useState, useRef } from 'react';
import type { StyleOption, CreateGenerationData, Generation } from '../types';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import GenerationCard from './GenerationCard';
import { 
  PhotoIcon, 
  XMarkIcon,
  StopIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const STYLE_OPTIONS: { value: StyleOption; label: string; description: string; emoji: string }[] = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic style', emoji: '📸' },
  { value: 'artistic', label: 'Artistic', description: 'Creative artistic interpretation', emoji: '🎨' },
  { value: 'cartoon', label: 'Cartoon', description: 'Fun cartoon style', emoji: '🎭' },
  { value: 'vintage', label: 'Vintage', description: 'Classic vintage look', emoji: '📺' },
];

const Studio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleOption>('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_RETRIES = 3;

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a JPEG or PNG image';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadRecentGenerations = async () => {
    try {
      const response = await apiService.getGenerations(5);
      setRecentGenerations(response.data.generations);
    } catch (err) {
      console.error('Failed to load recent generations:', err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile || !prompt.trim()) {
      setError('Please select an image and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const generationData: CreateGenerationData = {
        prompt: prompt.trim(),
        style,
        image: selectedFile,
      };

      await apiService.createGeneration(generationData, controller);
      
      // Reload recent generations to show the new one
      await loadRecentGenerations();
      
      setRetryCount(0);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Generation was aborted by user
        return;
      }

      const errorMessage = err.response?.data?.message || 'Generation failed';
      
      if (errorMessage.includes('Model overloaded') && retryCount < MAX_RETRIES) {
        setError(`${errorMessage}. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(prev => prev + 1);
        
        // Retry after a short delay
        setTimeout(() => {
          if (!abortController?.signal.aborted) {
            handleGenerate();
          }
        }, 2000);
        return;
      }

      setError(errorMessage);
      setRetryCount(0);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsGenerating(false);
    setRetryCount(0);
    setError('');
  };

  const restoreGeneration = (generation: Generation) => {
    setPrompt(generation.prompt);
    setStyle(generation.style as StyleOption);
    
    // If the generation has an original image, we can't restore the file
    // but we can show a message about it
    if (generation.imageUrl) {
      setError('Note: Original image from this generation cannot be restored. Please upload a new image.');
    }
  };

  React.useEffect(() => {
    loadRecentGenerations();
  }, []);

  // Clean up preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center p-2 bg-primary-500 rounded-xl shadow-lg mb-4">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            AI Generation Studio
          </h1>
          <p className="text-lg text-white opacity-90 max-w-2xl mx-auto">
            Transform your images with the power of AI. Upload, describe your vision, and watch magic happen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Generation Form */}
          <div className="space-y-6 animate-slideIn">
            <div className="generation-card">
              <div className="flex items-center space-x-2 mb-6">
                <CpuChipIcon className="h-4 w-4 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Create Generation</h2>
              </div>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2 animate-slideIn">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Image
                </label>
                
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                  >
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-700 mb-2">
                      Drop your image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Support for PNG, JPG • Max 10MB
                    </p>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="image-preview relative overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <button
                          onClick={clearFile}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110"
                          aria-label="Remove image"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <p><strong>File:</strong> {selectedFile.name}</p>
                      <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isGenerating}
                />
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-3">
                  Describe Your Vision
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate... Be creative and detailed!"
                    className="input h-32 resize-none text-base"
                    disabled={isGenerating}
                    maxLength={500}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                    {prompt.length}/500
                  </div>
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                      <span>Choose Style</span>
                      <div className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
                        Select One
                      </div>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Pick the perfect style for your creation</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%' }}>
                  {STYLE_OPTIONS.map((option) => (
                    <label key={option.value} className="cursor-pointer block group">
                      <input
                        type="radio"
                        name="style"
                        value={option.value}
                        checked={style === option.value}
                        onChange={(e) => setStyle(e.target.value as StyleOption)}
                        className="sr-only"
                        disabled={isGenerating}
                      />
                      <div className={`
                        relative p-5 rounded-3xl border-3 transition-all duration-300 transform overflow-hidden
                        ${style === option.value 
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 via-primary-25 to-white shadow-2xl scale-105 ring-4 ring-primary-200 ring-opacity-50' 
                          : 'border-gray-200 bg-gradient-to-br from-white via-gray-25 to-gray-50 hover:border-primary-300 hover:shadow-xl hover:scale-103 hover:ring-2 hover:ring-primary-100'
                        }
                        group-hover:shadow-2xl backdrop-blur-sm
                      `}>
                        {/* Selection indicator */}
                        {style === option.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Background overlay effects */}
                        <div className="absolute inset-0 rounded-3xl">
                          {/* Selected glow effect */}
                          {style === option.value && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 opacity-15 animate-pulse"></div>
                              <div className="absolute inset-0 bg-gradient-radial from-primary-300-30 via-transparent to-transparent"></div>
                            </>
                          )}
                          
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-200 via-purple-200 to-pink-200 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </div>

                        {/* Animated border for selected */}
                        {style === option.value && (
                          <div className="absolute inset-0 rounded-3xl">
                            <div className="absolute inset-0 rounded-3xl border-2 border-primary-400 animate-pulse"></div>
                            <div className="absolute inset-1 rounded-3xl border border-primary-300/50"></div>
                          </div>
                        )}
                        
                        <div className="relative flex items-center space-x-3">
                          <div className={`
                            p-3 rounded-2xl transition-all duration-300 relative overflow-hidden
                            ${style === option.value 
                              ? 'bg-gradient-to-br from-white to-primary-50 shadow-lg transform scale-110 ring-2 ring-primary-200/50' 
                              : 'bg-gradient-to-br from-gray-50 to-white group-hover:from-white group-hover:to-primary-25 group-hover:shadow-md group-hover:scale-105 group-hover:ring-1 group-hover:ring-primary-100'
                            }
                          `}>
                            {/* Emoji container background effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="text-2xl block relative z-10">{option.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`
                              font-bold text-sm transition-colors duration-300
                              ${style === option.value ? 'text-primary-700' : 'text-gray-900 group-hover:text-primary-600'}
                            `}>
                              {option.label}
                            </p>
                            <p className={`
                              text-xs transition-colors duration-300
                              ${style === option.value ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-600'}
                            `}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Enhanced shimmer effect */}
                        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200 skew-x-12"></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 via-transparent to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleGenerate}
                  disabled={!selectedFile || !prompt.trim() || isGenerating}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 py-4 text-lg font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size="sm" text="" variant="pulse" />
                      <span>Generating Magic...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
                
                {isGenerating && (
                  <button
                    onClick={handleAbort}
                    className="btn-danger flex items-center space-x-2 px-6"
                  >
                    <StopIcon className="h-4 w-4" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent Generations */}
          <div className="space-y-6 animate-slideIn" style={{ animationDelay: '0.2s' }}>
            <div className="generation-card">
              <div className="flex items-center space-x-2 mb-6">
                <ClockIcon className="h-4 w-4 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Recent Creations</h2>
              </div>
              
              {recentGenerations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-xl mb-3">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-base mb-2">No generations yet</p>
                  <p className="text-gray-400 text-sm">Your creations will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentGenerations.map((generation, index) => (
                    <div 
                      key={generation.id} 
                      className="animate-slideIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <GenerationCard
                        generation={generation}
                        onRestore={restoreGeneration}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;