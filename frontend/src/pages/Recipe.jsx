import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

function Recipe() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(
    localStorage.getItem(`rated_value_${id}`) || 0
  );

  const handleRating = useCallback(async (star) => {
    if (localStorage.getItem(`rated_${id}`)) {
      alert('Już oceniłeś ten przepis.');
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star }),
      });

      if (response.ok) {
        const updated = await response.json();
        setRecipe((prev) => ({ ...prev, rating: updated.rating }));
        localStorage.setItem(`rated_${id}`, 'true');
        localStorage.setItem(`rated_value_${id}`, star);
        setUserRating(star);
      } else {
        alert('Błąd przy ocenianiu.');
      }
    } catch (err) {
      console.error('Błąd przy ocenianiu:', err);
      alert('Wystąpił błąd.');
    }
  }, [id]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`);
        if (response.ok) {
          const data = await response.json();
          setRecipe(data);
        } else {
          setRecipe(null);
        }
      } catch (error) {
        console.error('Błąd przy pobieraniu przepisu:', error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <p>Ładowanie przepisu...</p>;
  if (!recipe) return <p>Nie znaleziono przepisu.</p>;

  return (
    <div className="container mt-4">
      <h2>{recipe.title}</h2>
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.title}
          className="img-fluid"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      )}
      <p>{recipe.description}</p>
      <p><strong>Autor:</strong> {recipe.author}</p>

      <div className="mt-4">
        <h5>Oceń przepis:</h5>
        <div>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                fontSize: '2rem',
                cursor: localStorage.getItem(`rated_${id}`) ? 'default' : 'pointer',
                color: star <= userRating ? 'gold' : '#ccc',
                transition: 'color 0.2s',
              }}
              onClick={() => handleRating(star)}
            >
              ★
            </span>
          ))}
        </div>
        {recipe.rating > 0 && (
          <p className="mt-2 text-muted">Średnia ocena: {recipe.rating.toFixed(1)} / 5</p>
        )}
      </div>
    </div>
  );
}

export default Recipe;
