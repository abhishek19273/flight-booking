// API Configuration

// Base URL for the API
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// API version
const API_VERSION = 'v1';

// Request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Error messages
const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  GENERAL_ERROR: 'An error occurred. Please try again.',
};
