import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';  

function Favorites() {
  const { user } = useAuth(); 
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Zaloguj się, aby zobaczyć ulubione przepisy');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await fetch(`/api/favorites/get-favorites?username=${user.username}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data);  
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error('Błąd przy pobieraniu ulubionych przepisów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  if (loading) return <p>Ładowanie ulubionych...</p>;

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  if (favorites.length === 0) return <p>{user.username}Nie masz żadnych ulubionych przepisów.</p>;

  return (
    <div className="container mt-4 text-center">
      <h2>Twoje ulubione przepisy</h2>
      <div className="row">
        {favorites.map((recipe) => (
          <div key={recipe.id} className="col-md-3 mb-4">
            <a href={`/recipe/${recipe.id}`} className="card-link text-decoration-none">
              <div className="card">
                {recipe.image && (
                  <img
                    src={recipe.image}
                    className="card-img-top"
                    alt={recipe.title}
                    style={{ objectFit: 'cover', height: '200px' }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title text-center">{recipe.title}</h5>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Favorites;
