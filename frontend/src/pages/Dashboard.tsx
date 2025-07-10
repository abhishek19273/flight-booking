import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MyBookings from '../components/dashboard/MyBookings';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
              <button onClick={() => navigate('/search')} className="text-gray-700 hover:text-blue-600 transition-colors">Search Flights</button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors">My Bookings</button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors">Account</button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 hidden md:inline">
                  Welcome, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="md:flex justify-between items-center">
            <div className="p-6 md:p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}!</h1>
              <p className="text-blue-100 mb-4">Manage your bookings and discover new destinations</p>
              <button 
                onClick={() => navigate('/search')} 
                className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors duration-200"
              >
                Book a Flight
              </button>
            </div>
            <div className="hidden md:block p-6">
              <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" 
                alt="Airplane wing" 
                className="w-64 h-auto rounded-lg shadow-md" 
              />
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            My Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
              </div>
              {user?.user_metadata?.phone_number && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{user.user_metadata.phone_number}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account Type</p>
                <p className="font-medium text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user?.app_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}
                  </span>
                </p>
              </div>
              <div>
                <button 
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  onClick={() => navigate('/profile/edit')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* My Bookings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            My Bookings
          </h2>
          <MyBookings />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
