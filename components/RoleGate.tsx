'use client';

import { useAuth } from '@/context/AuthContext';
import { ReactNode } from 'react';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export default function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!user) {
    return fallback || <div className="p-4 text-red-600">Authentication required</div>;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="p-4 text-red-600">
          Access denied. Your role ({user.role}) does not have permission to view this content.
        </div>
      )
    );
  }

  return <>{children}</>;
}
