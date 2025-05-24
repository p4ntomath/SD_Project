import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchAllUsers } from '../backend/firebase/adminAccess.jsx';
import { ClipLoader } from 'react-spinners';
import MainNav from '../components/AdminComponents/Navigation/AdminMainNav';
import MobileBottomNav from '../components/AdminComponents/Navigation/AdminMobileBottomNav';

// Default status options
const DEFAULT_STATUSES = ['active', 'inactive', 'pending'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Get unique roles and statuses for filter dropdowns
  const uniqueRoles = [...new Set(users.map(user => user.role))];
  const uniqueStatuses = [...new Set([...DEFAULT_STATUSES, ...users.map(user => user.status || 'active')])];

  // Filter users based on selected role and status
  const filteredUsers = users.filter(user => {
    const roleMatch = selectedRole === 'all' || user.role === selectedRole;
    const statusMatch = selectedStatus === 'all' || user.status === selectedStatus;
    return roleMatch && statusMatch;
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchAllUsers();
        // Ensure each user has a status
        const usersWithStatus = data.map(user => ({
          ...user,
          status: user.status || 'Active'
        }));
        setUsers(usersWithStatus);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <section className="min-h-screen bg-gray-50">
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-7xl mx-auto">
          <section className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <section className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Back to dashboard"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Users</h1>
            </section>

            <section className="flex items-center w-full sm:w-auto gap-4">
              <section>
                <label htmlFor="role-filter" className="mr-2 text-sm text-gray-600 whitespace-nowrap">
                  Filter by Role:
                </label>
                <select
                  id="role-filter"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </section>
              <section>
                <label htmlFor="status-filter" className="mr-2 text-sm text-gray-600 whitespace-nowrap">
                  Filter by Status:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </section>
            </section>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {loading ? (
              <section className="min-h-[200px] flex items-center justify-center">
                <ClipLoader color="#3B82F6" />
              </section>
            ) : (
              <section className="overflow-x-auto">
                <table className="min-w-full sectionide-y sectionide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th key="actions" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white sectionide-y sectionide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4">
                          <section className="text-sm font-medium text-gray-900">{user.fullName}</section>
                          <section className="text-sm text-gray-500 sm:hidden mt-1">{user.email}</section>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <section className="text-sm text-gray-900">{user.email}</section>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <section className="text-sm text-gray-900 capitalize">{user.role}</section>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <section className="text-sm text-gray-900" data-testid={`user-status-desktop-${user.id}`}>
                            {user.status}
                          </section>
                        </td>
                        <td className="sm:hidden">
                          <section className="text-sm text-gray-500 mt-1" data-testid={`user-status-mobile-${user.id}`}>
                            {user.status}
                          </section>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            data-testid={`view-details-${user.id}`}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <section className="text-center py-8">
                    <p className="text-gray-500">No users found</p>
                  </section>
                )}
              </section>
            )}
          </motion.section>
        </section>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </section>
  );
}