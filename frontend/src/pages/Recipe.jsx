import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';  

function Recipe() {
  const { id } = useParams();
  const { user } = useAuth();  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);  
  const [error, setError] = useState(null); 

  const handleRating = useCallback(async (star) => {
    if (!user) {
        alert('Zaloguj się, aby ocenić przepis!');
        return;
    }

    try {
        const responseCheck = await fetch(`/api/recipes/${id}/check-already-rated?username=${user.username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        });

        if (responseCheck.ok) {
        const dataCheck = await responseCheck.json();
        if (dataCheck.alreadyRated) {
            alert('Już oceniłeś ten przepis.');
            return;
        }
        } else {
        throw new Error('Błąd przy sprawdzaniu oceny.');
        }

        const response = await fetch(`/api/recipes/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star, username: user.username }),  
        });

        if (response.ok) {
        const updated = await response.json();
        setRecipe((prev) => ({ ...prev, rating: updated.rating, ratingCount: updated.ratingCount }));
        setUserRating(star); 
        } else {
        alert('Błąd przy ocenianiu.');
        }
    } catch (err) {
        console.error('Błąd przy ocenianiu:', err);
        setError('Wystąpił błąd przy ocenianiu'); 
    }
    }, [id, user]);

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
        setError('Wystąpił błąd przy pobieraniu przepisu.');  
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/recipes/${id}/user-rating?username=${user.username}`);
          if (response.ok) {
            const data = await response.json();
            setUserRating(data.rating || null);
          } else {
            setUserRating(null);
          }
        } catch (error) {
          console.error('Błąd przy sprawdzaniu oceny użytkownika:', error);
        }
      }
    };

    fetchUserRating();
  }, [id, user]);

  if (loading) return <p>Ładowanie przepisu...</p>;

  if (!recipe) return <p>Nie znaleziono przepisu.</p>;

  const rating = recipe.rating && !isNaN(recipe.rating) ? parseFloat(recipe.rating) : 0;

  return (
    <div className="container mt-4">
      {error && <p style={{ color: 'red' }}>{error}</p>}  
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
                cursor: userRating === null ? 'pointer' : 'default',
                color: star <= userRating ? 'gold' : '#ccc',
                transition: 'color 0.2s',
              }}
              onClick={() => handleRating(star)}
            >
              ★
            </span>
          ))}
        </div>
        {rating > 0 ? (
            <p className="mt-2 text-muted">Średnia ocena: {rating.toFixed(1)} ({recipe.ratingCount} ocen)</p>
        ) : (
            <p className="mt-2 text-muted">Brak ocen</p>
        )}
      </div>
    </div>
  );
}

export default Recipe;
