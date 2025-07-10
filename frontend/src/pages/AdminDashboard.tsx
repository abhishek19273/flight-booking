import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // This would normally fetch from your backend API
        // For demo purposes, we're just creating mock data
        const mockUsers: UserData[] = [
          {
            id: '1',
            email: 'user1@example.com',
            first_name: 'John',
            last_name: 'Doe',
            role: 'user',
            created_at: '2023-01-15T10:30:00Z'
          },
          {
            id: '2',
            email: 'user2@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'user',
            created_at: '2023-02-20T14:45:00Z'
          },
          {
            id: '3',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            created_at: '2023-01-01T09:00:00Z'
          }
        ];
        
        // Add the current user to the list if they're not already there
        if (user && !mockUsers.some(u => u.id === user.id)) {
          mockUsers.push({
            id: user.id,
            email: user.email || 'unknown@email.com',
            first_name: user.user_metadata?.first_name || 'Unknown',
            last_name: user.user_metadata?.last_name || 'User',
            role: user.user_metadata?.role || 'user',
            created_at: user.created_at || new Date().toISOString()
          });
        }
        
        setUsers(mockUsers);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users');
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage users and application settings
              </p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Admin Access
            </div>
          </div>
          
          {/* Admin Info */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Admin Information</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="mt-1 text-sm text-gray-900">{user?.user_metadata?.role || 'admin'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="mt-1 text-sm text-gray-900 truncate">{user?.id}</p>
              </div>
            </div>
          </div>
          
          {/* User Management */}
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage all users in the system
              </p>
            </div>
            
            {loading ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <p>Loading users...</p>
              </div>
            ) : error ? (
              <div className="px-4 py-5 sm:px-6 text-center text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Admin Actions */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Admin Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Add New User
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Export User Data
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
