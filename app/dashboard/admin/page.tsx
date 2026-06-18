'use client';

import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-gray-600 text-sm">Total users</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Roles</h2>
            <p className="text-3xl font-bold text-green-600">6</p>
            <p className="text-gray-600 text-sm">Available roles</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-gray-600 text-sm">Currently active</p>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
        </div>
      </div>
    </RoleGate>
  );
}
