import React from "react";
import { useAuth } from "../AuthContext";

function Profile() {
  const { user } = useAuth();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Profil użytkownika</h1>
      {user ? (
        <div>
          <h2 className="text-xl">Witaj, {user.username}</h2>
        </div>
      ) : (
        <div>
          <h2 className="text-xl">Zaloguj się, aby zobaczyć profil.</h2>
        </div>
      )}
    </main>
  );
}

export default Profile;
