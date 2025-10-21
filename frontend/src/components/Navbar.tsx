import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  SparklesIcon, 
  ClockIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return (
      <nav className="navbar animate-fadeIn">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors group no-underline"
              style={{ textDecoration: 'none' }}
            >
              <div className="p-1.5 bg-primary-500 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span>AI Studio</span>
            </Link>
            
            <div className="flex space-x-4">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50 no-underline"
                style={{ textDecoration: 'none' }}
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="btn-primary text-sm px-6 no-underline"
                style={{ textDecoration: 'none' }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar animate-fadeIn">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors group no-underline"
            style={{ textDecoration: 'none' }}
          >
            <div className="p-1.5 bg-primary-500 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <span>AI Studio</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            {/* Navigation Links */}
            <div className="flex items-center space-x-1 mr-4">
              <Link
                to="/studio"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                  isActive('/studio')
                    ? 'text-white bg-primary-500 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <CpuChipIcon className="h-4 w-4" />
                <span>Studio</span>
              </Link>
              
              <Link
                to="/history"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                  isActive('/history')
                    ? 'text-white bg-primary-500 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <ClockIcon className="h-4 w-4" />
                <span>History</span>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="p-1 bg-primary-100 rounded-lg">
                <UserCircleIcon className="h-4 w-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                {user.email}
              </span>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-red-50 group"
              aria-label="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 group-hover:transform group-hover:translate-x-1 transition-transform" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;