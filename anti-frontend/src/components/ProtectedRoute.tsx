// src/components/ProtectedRoute.tsx
import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('CUSTOMER' | 'SELLER' | 'ADMIN')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth) return null;

  const { user, loading } = auth;

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and keep the attempted URL state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
