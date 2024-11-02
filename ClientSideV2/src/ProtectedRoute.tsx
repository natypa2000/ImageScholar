// src/ProtectedRoute.tsx
import React from 'react';
import { Navigate, RouteProps, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';  // Make sure this is correctly imported

interface ProtectedRouteProps extends Omit<RouteProps, 'element' | 'children'> {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to the login page and pass the current location in state
    // so it can redirect back after logging in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return React.cloneElement(element, { ...rest });
};

export default ProtectedRoute;


