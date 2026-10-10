import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

const AdminRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  if (initializing) return <Loader />;

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default AdminRoute;
