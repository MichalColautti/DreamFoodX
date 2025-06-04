import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { saveAs } from 'file-saver';
import { Modal, Button } from 'react-bootstrap';

function Recipe() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timer, setTimer] = useState(null);
  const [isStepTimerRunning, setIsStepTimerRunning] = useState(false);

  const handleRating = useCallback(
    async (star) => {
      if (!user) {
        alert('Zaloguj się, aby ocenić przepis!');
        return;
      }

      try {
        const responseCheck = await fetch(
          `/api/recipes/${id}/check-already-rated?username=${user.username}`
        );

        if (responseCheck.ok) {
          const dataCheck = await responseCheck.json();
          if (dataCheck.alreadyRated) {
            alert('Już oceniłeś ten przepis.');
            return;
          }
        }

        const response = await fetch(`/api/recipes/${id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: star, username: user.username }),
        });

        if (response.ok) {
          const updated = await response.json();
          setRecipe((prev) => ({
            ...prev,
            rating: updated.rating,
            ratingCount: updated.ratingCount,
          }));
          setUserRating(star);
        } else {
          alert('Błąd przy ocenianiu.');
        }
      } catch (err) {
        console.error('Błąd przy ocenianiu:', err);
        setError('Wystąpił błąd przy ocenianiu');
      }
    },
    [id, user]
  );

  const handleExportToJSON = () => {
    if (!recipe) return;

    const recipeToExport = {
      title: recipe.title,
      description: recipe.description,
      author: recipe.author,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    };

    const blob = new Blob([JSON.stringify(recipeToExport, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, `${recipe.title || 'przepis'}.json`);
  };

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
          const response = await fetch(
            `/api/recipes/${id}/user-rating?username=${user.username}`
          );
          if (response.ok) {
            const data = await response.json();
            setUserRating(data.rating || null);
          }
        } catch (error) {
          console.error('Błąd przy sprawdzaniu oceny użytkownika:', error);
        }
      }
    };

    fetchUserRating();
  }, [id, user]);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (user) {
        try {
          const response = await fetch(
            `/api/recipes/${id}/is-favorite?username=${user.username}`
          );
          if (response.ok) {
            const data = await response.json();
            setIsFavorite(data.isFavorite);
          }
        } catch (error) {
          console.error('Błąd przy sprawdzaniu ulubionych:', error);
        }
      }
    };

    fetchFavoriteStatus();
  }, [id, user]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} s`;
  }

  useEffect(() => {
    if (!showSlideshow || !isStepTimerRunning) return;

    const currentStep = recipe?.steps?.[currentStepIndex];
    if (!currentStep || !currentStep.duration) return;

    let remaining = currentStep.duration;
    setTimer(remaining);

    const interval = setInterval(() => {
      remaining -= 1;
      setTimer(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsStepTimerRunning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStepIndex, showSlideshow, recipe, isStepTimerRunning]);

  const toggleFavorite = async () => {
    if (!user) {
      alert('Zaloguj się, aby dodawać do ulubionych!');
      return;
    }

    const method = isFavorite ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`/api/recipes/${id}/favorite`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else {
        alert('Błąd przy aktualizacji ulubionych');
      }
    } catch (err) {
      console.error('Błąd:', err);
    }
  };

  if (loading) return <p>Ładowanie przepisu...</p>;
  if (!recipe) return <p>Nie znaleziono przepisu.</p>;

  const rating =
    recipe.rating && !isNaN(recipe.rating) ? parseFloat(recipe.rating) : 0;
  
  return (
    <div className="container my-5">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm p-4">
        <h2 className="mb-3">{recipe.title}</h2>

        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="img-fluid rounded mb-3"
            style={{ maxWidth: '600px', maxHeight: '400px', objectFit: 'cover' }}
          />
        )}

        <p className="lead">{recipe.description}</p>

        <p>
          <strong>Autor:</strong> {recipe.author}
          {user && user.username === recipe.author && (
            <Link
              to={`/recipes/${id}/edit`}
              className="btn btn-sm btn-outline-secondary ms-3"
            >
              Edytuj przepis
            </Link>
          )}
        </p>

        <button
          onClick={toggleFavorite}
          className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline-primary'} mb-3`}
        >
          {isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        </button>

        <div className="mb-4">
          <h4>Składniki</h4>
          {recipe.ingredients?.length ? (
            <ul className="list-group list-group-flush">
              {recipe.ingredients.map((ing, idx) => (
                <li className="list-group-item" key={idx}>
                  {ing.name}
                  {(ing.amount !== null && ing.amount !== undefined) && (
                    <>: {ing.amount}{ing.unit ? ` ${ing.unit}` : ''}</>
                  )}
                  {ing.description && <> — <em>{ing.description}</em></>}
                </li>
              ))}
            </ul>
          ) : (
            <p>Brak składników</p>
          )}
        </div>

        <div className="mb-4">
          <h4>Kroki przygotowania</h4>
          {recipe.steps?.length ? (
            <ol className="ps-3">
              {recipe.steps.map((step) => (
                <li key={step.order} className="mb-2">
                  <strong>{step.action}</strong>: {step.description}
                  {(step.temperature || step.bladeSpeed || step.duration) && (
                    <ul>
                      {step.temperature && (
                        <li>Temperatura: {step.temperature}°C</li>
                      )}
                      {step.bladeSpeed && (
                        <li>Prędkość ostrzy: {step.bladeSpeed}</li>
                      )}
                      {step.duration && (
                        <li>Czas: {Math.floor(step.duration / 60)} min {step.duration % 60} s </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p>Brak kroków przygotowania</p>
          )}
        </div>

        <div>
          <h5>Oceń przepis</h5>
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
                onClick={() => userRating === null && handleRating(star)}
                role="button"
                aria-label={`Oceń na ${star} gwiazdek`}
              >
                ★
              </span>
            ))}
          </div>
          {rating > 0 ? (
            <p className="mt-2 text-muted">
              Średnia ocena: {rating.toFixed(1)} ({recipe.ratingCount} ocen)
            </p>
          ) : (
            <p className="mt-2 text-muted">Brak ocen</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button className="btn btn-outline-success" onClick={handleExportToJSON}>
          Eksportuj do JSON
        </button>
      </div>
      <div className="mt-3">
        <button className="btn btn-outline-warning" onClick={() => {
          setCurrentStepIndex(0);
          setShowSlideshow(true);
        }}>
          Krok po kroku
        </button>
      </div>

      
  <Modal show={showSlideshow} onHide={() => setShowSlideshow(false)} centered size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Krok {currentStepIndex + 1} z {recipe?.steps?.length}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {recipe?.steps?.[currentStepIndex] ? (
        <div>
          <h5>{recipe.steps[currentStepIndex].action}</h5>
          <p>{recipe.steps[currentStepIndex].description}</p>

          <ul>
            {recipe.steps[currentStepIndex].temperature && (
              <li>Temperatura: {recipe.steps[currentStepIndex].temperature}°C</li>
            )}
            {recipe.steps[currentStepIndex].bladeSpeed && (
              <li>Prędkość ostrzy: {recipe.steps[currentStepIndex].bladeSpeed}</li>
            )}
            {recipe.steps[currentStepIndex].duration && (
              <li>
                Czas: {timer !== null ? (
                  <strong>{formatTime(timer)}</strong>
                ) : (
                  formatTime(recipe.steps[currentStepIndex].duration)
                )}
              </li>
            
            )}
          </ul>
          <Button
            variant="success"
            onClick={() => {
              setIsStepTimerRunning(false);
              setTimer(recipe?.steps?.[currentStepIndex]?.duration || 0);
              setTimeout(() => setIsStepTimerRunning(true), 50);
            }}
          >
            Start
          </Button>
        </div>
      ) : (
        <p>Brak danych kroku.</p>
      )}
    </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            setCurrentStepIndex((prev) => Math.max(0, prev - 1));
            setIsStepTimerRunning(false);
            setTimer(null);
          }}
          disabled={currentStepIndex === 0}
        >
          Poprzedni
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            setCurrentStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1));
            setIsStepTimerRunning(false);
            setTimer(null);
          }}
          disabled={currentStepIndex >= recipe.steps.length - 1}
        >
          Następny
        </Button>
        <Button variant="danger" onClick={() => {
          setShowSlideshow(false);
          setIsStepTimerRunning(false);
          setTimer(null);
        }}>
          Zakończ
        </Button>
      </Modal.Footer>
    </Modal>
    </div>
  );
}

export default Recipe;
