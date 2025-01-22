import React, { useEffect, useState } from 'react';
import { getUserDetails } from '../api';

interface UserProfileProps {
  token: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ token }) => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await getUserDetails(token);
        setUser(data);
      } catch (err) {
        setError('Failed to fetch user details');
      }
    };

    fetchUserDetails();
  }, [token]);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!user) {
    return <p>Loading user profile...</p>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p>Email: {user.email}</p>
      <p>User ID: {user.id}</p>
    </div>
  );
};

export default UserProfile;
