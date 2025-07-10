import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmPasswordReset } = useAuth();

  // Check if we're in a valid password recovery flow
  const [isRecoveryFlow, setIsRecoveryFlow] = useState<boolean>(false);
  
  useEffect(() => {
    // Check for error in URL hash (e.g., #error=access_denied&error_code=otp_expired)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    
    if (errorParam) {
      // Handle specific error cases
      if (hashParams.get('error_code') === 'otp_expired') {
        setError('The password reset link has expired. Please request a new password reset link.');
      } else {
        setError(errorDescription || 'An error occurred with your password reset link. Please request a new one.');
      }
      return;
    }
    
    // If no error in hash, check if the user session is in recovery mode
    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setIsRecoveryFlow(true);
      } else {
        setError('Invalid password reset session. Please request a new password reset link.');
      }
    };
    
    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (!isRecoveryFlow) {
      return setError('Invalid password reset session. Please request a new password reset link.');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await confirmPasswordReset(password);
      
      if (error) throw error;
      
      setMessage('Password has been successfully reset!');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Your password has been reset. You can now log in with your new password.' } });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span className="text-xl font-bold text-gray-900">SkyBound</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/search" className="text-gray-700 hover:text-blue-600 transition-colors">Search Flights</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">
                Sign In
              </Link>
              <Link to="/signup" className="text-white bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium py-2 px-4 rounded-md shadow-sm">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left side with form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Reset your password
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Enter your new password below
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('expired') && (
                      <div className="mt-3">
                        <Link to="/forgot-password" className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md shadow-sm transition-all duration-150">
                          Request New Reset Link
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {message && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{message}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!isRecoveryFlow || loading}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!isRecoveryFlow || loading}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!isRecoveryFlow || loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting password...
                    </>
                  ) : 'Reset Password'}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side with image - hidden on mobile */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/90 to-blue-600/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507812984078-917a274065be')] bg-cover bg-center"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
            <div className="max-w-md text-center">
              <svg className="h-16 w-16 mx-auto text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-3xl font-bold mt-6 mb-4">Secure Your Account</h2>
              <p className="text-lg mb-6">Create a strong password to protect your SkyBound account and continue your journey safely.</p>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <p className="text-white/90">For a strong password:</p>
                <ul className="text-white/80 text-sm mt-2 space-y-1 text-left">
                  <li>• Use at least 8 characters</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Add numbers and special characters</li>
                  <li>• Avoid using personal information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
