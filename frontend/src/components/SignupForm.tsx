import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { SignupData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  SparklesIcon, 
  UserIcon, 
  LockClosedIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const SignupForm: React.FC = () => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      password.length >= 6,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ];
    strength = checks.filter(Boolean).length;
    return { strength, checks };
  };

  const passwordAnalysis = getPasswordStrength(formData.password);

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !confirmPassword) {
      return 'All fields are required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (formData.password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(formData);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    if (error) setError('');
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-400';
    if (strength <= 3) return 'bg-yellow-400';
    if (strength <= 4) return 'bg-blue-400';
    return 'bg-green-400';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-primary-600 opacity-8 animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-primary-500 opacity-8 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full bg-primary-400 opacity-5 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="auth-card animate-fadeIn max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-500 rounded-xl shadow-lg">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join AI Studio
          </h1>
          <p className="text-gray-600">
            Create your account and start generating amazing content
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div 
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-slideIn"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="input-icon-left">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your email"
                  disabled={loading}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="input-icon-left">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <div className="input-icon-right">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-primary-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 animate-slideIn">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Password strength</span>
                    <span className={`text-xs font-semibold ${
                      passwordAnalysis.strength <= 2 ? 'text-red-600' :
                      passwordAnalysis.strength <= 3 ? 'text-yellow-600' :
                      passwordAnalysis.strength <= 4 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getStrengthText(passwordAnalysis.strength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordAnalysis.strength)}`}
                      style={{ width: `${(passwordAnalysis.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {[
                      { check: passwordAnalysis.checks[0], text: 'At least 6 characters' },
                      { check: passwordAnalysis.checks[1], text: 'Lowercase letter' },
                      { check: passwordAnalysis.checks[2], text: 'Uppercase letter' },
                      { check: passwordAnalysis.checks[3], text: 'Number' },
                      { check: passwordAnalysis.checks[4], text: 'Special character' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <CheckCircleIcon 
                          className={`h-4 w-4 ${item.check ? 'text-green-500' : 'text-gray-300'}`}
                        />
                        <span className={item.check ? 'text-green-700' : 'text-gray-500'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="input-icon-left">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${
                    confirmPassword && formData.password !== confirmPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : confirmPassword && formData.password === confirmPassword
                      ? 'border-green-300 focus:border-green-500'
                      : ''
                  }`}
                  placeholder="Confirm your password"
                  disabled={loading}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <div className="input-icon-right">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="hover:text-primary-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              {confirmPassword && formData.password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600 animate-slideIn">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center py-3 text-base font-semibold"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" text="" variant="gradient" />
                  <span className="ml-2">Creating account...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  <span>Create account</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-4">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors no-underline"
                style={{ textDecoration: 'none' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>

        {/* Decorative elements */}
        <div className="absolute top-6 right-6 w-2 h-2 bg-primary-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-6 left-6 w-1 h-1 bg-primary-500 rounded-full opacity-60"></div>
        <div className="absolute top-1/3 left-4 w-1 h-1 bg-primary-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-1/3 right-3 w-1 h-1 bg-primary-400 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default SignupForm;