import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function SearchResults() {
  const query = useQuery();
  const name = query.get('name');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return; 

    const fetchRecipes = async () => {
      try {
        const response = await fetch(`/api/recipes/search?name=${encodeURIComponent(name)}`);
        if (response.ok) {
          const data = await response.json();
          setRecipes(data);
        } else {
          setRecipes([]);
        }
      } catch (error) {
        console.error('Błąd przy pobieraniu przepisów:', error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [name]);

  return (
    <div className="container mt-4">
      <h2>Wyniki wyszukiwania dla "{name}"</h2>
      {loading && <p>Ładowanie wyników...</p>}
      {!loading && recipes.length === 0 && <p>Nie znaleziono przepisów.</p>}
      {!loading && recipes.length > 0 && (
        <div className="row">
          {recipes.map((recipe) => (
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
      )}
    </div>
  );
}

export default SearchResults;
