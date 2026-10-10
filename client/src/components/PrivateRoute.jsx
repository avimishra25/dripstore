import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const PrivateRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <Loader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default PrivateRoute;
