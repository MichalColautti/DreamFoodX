import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

function Profile() {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [errorFavorites, setErrorFavorites] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoadingFavorites(false);
      setErrorFavorites("Zaloguj się, aby zobaczyć ulubione przepisy.");
      return;
    }

    // Fetch ulubione przepisy
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`/api/favorites/get-favorites?username=${user.username}`);
        if (!res.ok) throw new Error("Nie udało się pobrać ulubionych przepisów");
        const data = await res.json();
        setFavorites(data);
        setErrorFavorites(null);
      } catch (error) {
        setErrorFavorites(error.message);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [user]);

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <h1 className="text-3xl font-bold mb-6">Profil użytkownika</h1>
        <p className="text-xl mb-4">Zaloguj się, aby zobaczyć profil.</p>
        <Link
          to="/login"
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Przejdź do logowania
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Profil użytkownika</h1>
      <h2 className="text-xl mb-4">Witaj, {user.username}!</h2>

      {/* Ulubione przepisy */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-center">Ulubione przepisy</h3>
        {loadingFavorites ? (
          <p>Ładowanie ulubionych przepisów...</p>
        ) : errorFavorites ? (
          <p className="text-red-600">{errorFavorites}</p>
        ) : favorites.length === 0 ? (
          <p>Brak ulubionych przepisów.</p>
        ) : (
          <div className="container">
            <div className="row">
              {favorites.map((recipe) => (
                <div key={recipe.id} className="col-6 col-md-3 mb-4">
                  <Link
                    to={`/recipe/${recipe.id}`}
                    className="card-link text-decoration-none"
                  >
                    <div className="card h-100">
                      {recipe.image && (
                        <img
                          src={recipe.image}
                          className="card-img-top"
                          alt={recipe.title}
                          style={{ objectFit: "cover", height: "200px" }}
                        />
                      )}
                      <div className="card-body">
                        <h5 className="card-title text-center">{recipe.title}</h5>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Profile;
