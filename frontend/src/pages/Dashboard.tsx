import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-200">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">My Bookings</h3>
            <p className="text-sm text-gray-600 mb-4">View and manage your upcoming and past flights</p>
            <button 
              onClick={() => navigate('/bookings')} 
              className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center"
            >
              View Bookings
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-green-200">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Search Flights</h3>
            <p className="text-sm text-gray-600 mb-4">Find and book your next adventure</p>
            <button 
              onClick={() => navigate('/search')} 
              className="text-green-600 text-sm font-medium hover:text-green-800 flex items-center"
            >
              Search Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-purple-200">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Manage your preferences and security</p>
            <button 
              onClick={() => navigate('/settings')} 
              className="text-purple-600 text-sm font-medium hover:text-purple-800 flex items-center"
            >
              Go to Settings
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Recent Activity
          </h2>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-500 text-center py-8">No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
