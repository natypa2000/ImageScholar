import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import './Menu.css';  // Import the CSS file for styling

const Menu: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="top-menu">
      <ul className="menu-list">
        <li className="menu-item"><Link to="/home" className="menu-link">Home</Link></li>
        <li className="menu-item"><Link to="/user-manual" className="menu-link">User Manual</Link></li>
        <li className="menu-item"><Link to="/upload" className="menu-link">Upload</Link></li>
        <li className="menu-item"><Link to="/search" className="menu-link">Search</Link></li>
        <li className="menu-item"><Link to="/related" className="menu-link">Related Page</Link></li>
        <li className="menu-item"><Link to="/profile" className="menu-link">Profile</Link></li>
        <li className="menu-item"><a href="#" onClick={handleLogout} className="logoutButton">Log out</a></li>
      </ul>
    </nav>
  );
};

export default Menu;