import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import axios from 'axios';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user-profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const { name, surname, email } = response.data;
      setName(name);
      setSurname(surname);
      setEmail(email);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put('http://localhost:5000/api/user-profile', 
        { name, surname },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await axios.delete('http://localhost:5000/api/user-profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        logout();
        navigate('/login');
      } catch (error) {
        console.error('Error deleting user account:', error);
      }
    }
  };

  return (
    <div className="user-profile">
      <h1>User Profile</h1>
      <div className="profile-info">
        <div className="info-group">
          <label>Name:</label>
          {isEditing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} />
          ) : (
            <span>{name}</span>
          )}
        </div>
        <div className="info-group">
          <label>Surname:</label>
          {isEditing ? (
            <input value={surname} onChange={(e) => setSurname(e.target.value)} />
          ) : (
            <span>{surname}</span>
          )}
        </div>
        <div className="info-group">
          <label>Email:</label>
          <span>{email}</span>
        </div>
      </div>
      <div className="profile-actions">
        {isEditing ? (
          <button onClick={handleSave}>Save Changes</button>
        ) : (
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        )}
        <button onClick={handleDelete} className="delete-button">Delete Account</button>
      </div>
    </div>
  );
};

export default UserProfile;