'use client';

import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/context/AuthContext';

export default function OperatorDashboard() {
  const { user } = useAuth();

  return (
    <RoleGate allowedRoles={['operator']}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Operator Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Operations</h2>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-gray-600 text-sm">Active operations</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Efficiency</h2>
            <p className="text-3xl font-bold text-green-600">0%</p>
            <p className="text-gray-600 text-sm">Efficiency rate</p>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
        </div>
      </div>
    </RoleGate>
  );
}
