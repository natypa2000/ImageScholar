import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home';
import Registration from './Registration';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import UserManual from './UserManual';
import Search from './Search';
import RelatedPage from './RelatedPage';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './authContext';
import SideMenu from './SideMenu';
import Upload from './Upload';
import UserProfile from './UserProfile';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <RoutesWithSideMenu />
      </Router>
    </AuthProvider>
  );
};

const RoutesWithSideMenu = () => {
 const location = useLocation();
 const showSideMenu = !['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <>
      {showSideMenu && <SideMenu />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/upload" element={<ProtectedRoute element={<Upload />} />} />
        <Route path="/user-manual" element={<ProtectedRoute element={<UserManual />} />} />
        <Route path="/search" element={<ProtectedRoute element={<Search />} />} />
        <Route path="/related" element={<ProtectedRoute element={<RelatedPage />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<UserProfile />} />} />
      </Routes>
    </>
  );
};

export default App;