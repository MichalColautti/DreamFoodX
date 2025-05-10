import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []); 

  return (
    <main>
      <h1>User Profile</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.username}</h2>
        </div>
      ) : (
        <div>
          <h2>Please log in to view your profile.</h2>
        </div>
      )}
    </main>
  );
}

export default Profile;
