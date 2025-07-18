import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { saveAs } from "file-saver";
import { Modal, Button } from "react-bootstrap";

const actionGifs = {
  siekanie: "/gifs/siekanie.gif",
  mieszanie: "/gifs/mieszanie.gif",
  gotowanie: "/gifs/gotowanie.gif",
  pieczenie: "/gifs/pieczenie.gif",
  smażenie: "/gifs/smażenie.gif",
};

function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [timeLeft, setTimeLeft] = useState(0);

  const handleRating = useCallback(async (star) => {
    if (!user) {
      alert("Zaloguj się, aby ocenić przepis!");
      return;
    }
    try {
      const responseCheck = await fetch(`/api/recipes/${id}/check-already-rated?username=${user.username}`);
      if (responseCheck.ok) {
        const dataCheck = await responseCheck.json();
        if (dataCheck.alreadyRated) {
          alert("Już oceniłeś ten przepis.");
          return;
        }
      }
      const response = await fetch(`/api/recipes/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        alert("Błąd przy ocenianiu.");
      }
    } catch (err) {
      console.error("Błąd przy ocenianiu:", err);
      setError("Wystąpił błąd przy ocenianiu");
    }
  }, [id, user]);

  const startTimer = useCallback((durationInMinutes) => {
    const durationInSeconds = Math.floor(durationInMinutes * 60); 
    setIsStepTimerRunning(true);
    setTimeLeft(durationInSeconds);
    
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 40) {
          clearInterval(timerId);
          setIsStepTimerRunning(false);
          return 0;
        }
        return prevTime - 40;
      });
    }, 1000);
    
    setTimer(timerId);
    return timerId;
  }, []);

  const stopTimer = useCallback(() => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setIsStepTimerRunning(false);
    setTimeLeft(0);
  }, [timer]);

  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  const handleExportToJSON = () => {
    if (!recipe) return;
    
    const recipeToExport = {
      title: recipe.title,
      description: recipe.description,
      author: recipe.author,
      image: recipe.image,
      rating: recipe.rating,
      ratingCount: recipe.ratingCount,
      steps: recipe.steps.map(step => ({
        type: step.type,
        order: step.order,
        description: step.description,
        ...(step.type === 'action' && {
          action: step.action,
          temperature: step.temperature,
          bladeSpeed: step.bladeSpeed,
          duration: step.duration
        }),
        ...(step.type === 'ingredient' && {
          ingredients: step.ingredients.map(ing => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit
          }))
        })
      })),
      ingredientsSummary: sumIngredients(recipe.steps),
      createdAt: recipe.created_at
    };
    
    const blob = new Blob([JSON.stringify(recipeToExport, null, 2)], { 
      type: "application/json" 
    });
    saveAs(blob, `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "przepis"}.json`);
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten przepis?')) return;
    try {
      const response = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Przepis został usunięty.');
        navigate('/');
      } else {
        const data = await response.json();
        alert(`Błąd: ${data.message || 'Nie udało się usunąć przepisu.'}`);
      }
    } catch (err) {
      console.error('Błąd przy usuwaniu:', err);
      alert('Błąd połączenia z serwerem.');
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`);
        if (response.ok) {
          const data = await response.json();
          setRecipe(data);

          if (user) {
            const [favoriteRes, ratingRes] = await Promise.all([
              fetch(`/api/recipes/${id}/is-favorite?username=${user.username}`),
              fetch(`/api/recipes/${id}/user-rating?username=${user.username}`)
            ]);

            if (favoriteRes.ok) {
              const favData = await favoriteRes.json();
              setIsFavorite(favData.isFavorite);
            }

            if (ratingRes.ok) {
              const rateData = await ratingRes.json();
              if (rateData.rating != null) {
                setUserRating(rateData.rating);
              }
            }
          }
        } else {
          setRecipe(null);
        }
      } catch (err) {
        console.error("Błąd przy pobieraniu przepisu:", err);
        setRecipe(null);
        setError("Wystąpił błąd przy pobieraniu przepisu.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, user]);

  const sumIngredients = (steps) => {
    const map = new Map();
    steps.forEach(step => {
      if (step.ingredients) {
        step.ingredients.forEach(({ name, amount, unit }) => {
          const key = `${name.toLowerCase()}|${unit || ""}`;
          const numericAmount = parseFloat(amount);
          if (!isNaN(numericAmount)) {
            if (map.has(key)) {
              map.get(key).amount += numericAmount;
            } else {
              map.set(key, { name, amount: numericAmount, unit });
            }
          }
        });
      }
    });
    return Array.from(map.values());
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert("Zaloguj się, aby dodawać do ulubionych!");
      return;
    }
    const method = isFavorite ? "DELETE" : "POST";
    try {
      const response = await fetch(`/api/recipes/${id}/favorite`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      if (response.ok) setIsFavorite(!isFavorite);
      else alert("Błąd przy aktualizacji ulubionych");
    } catch (err) {
      console.error("Błąd:", err);
    }
  };

  if (loading) return <p>Ładowanie przepisu...</p>;
  if (!recipe) return <p>Nie znaleziono przepisu.</p>;

  const rating = recipe.rating && !isNaN(recipe.rating) ? parseFloat(recipe.rating) : 0;
  const ingredientsSummary = sumIngredients(recipe.steps);

  const currentStep = recipe.steps?.[currentStepIndex];
  const currentStepGif = currentStep && currentStep.type === 'action'
    ? (actionGifs[currentStep.action?.toLowerCase()] || actionGifs.default)
    : null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container my-5">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card shadow-sm p-4">
        <h2>{recipe.title}</h2>
        {recipe.image && (
          <img src={recipe.image} alt={recipe.title} className="img-fluid rounded my-3" style={{ maxHeight: "400px", objectFit: "cover" }} />
        )}
        <p className="lead">{recipe.description}</p>
        <p><strong>Autor:</strong> {recipe.author}</p>

        {user && user.username === recipe.author && (
          <div className="mb-3">
            <Link to={`/recipes/${id}/edit`} className="btn btn-outline-secondary me-2">Edytuj</Link>
            <button className="btn btn-outline-danger" onClick={handleDeleteRecipe}>Usuń</button>
          </div>
        )}

        <button onClick={toggleFavorite} className={`btn ${isFavorite ? "btn-danger" : "btn-outline-primary"} mb-3`}>
          {isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        </button>

        <h3>Składniki (łącznie):</h3>
        {ingredientsSummary.length ? (
          <ul className="list-group list-group-flush">
            {ingredientsSummary.map((ing, idx) => (
              <li key={idx} className="list-group-item">{ing.name}: {ing.amount} {ing.unit}</li>
            ))}
          </ul>
        ) : <p>Brak składników</p>}

        <h4 className="mt-4">Kroki przygotowania</h4>
        <ol className="ps-3">
          {recipe.steps.map((step, index) => (
            <li key={index} className="mb-2">
              <strong>
                {step.type === "action" && `${step.action}: ${step.description}`}
                {step.type === "ingredient" && `Dodanie składnika: ${step.description}`}
                {step.type === "description" && step.description}
              </strong>
              {step.type === "action" && (
                <ul>
                  {step.temperature && <li>Temperatura: {step.temperature}°C</li>}
                  {step.bladeSpeed && <li>Prędkość noża: {step.bladeSpeed}</li>}
                  {step.duration && <li>Czas: {Math.floor(step.duration / 60)} min</li>}
                </ul>
              )}
              {step.type === "ingredient" && step.ingredients?.length > 0 && (
                <ul>
                  {step.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing.name}: {ing.amount} {ing.unit}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        <div className="my-4">
          <h5>Oceń przepis</h5>
          {[1,2,3,4,5].map(star => (
            <span
              key={star}
              style={{ fontSize: "2rem", cursor: userRating === null ? "pointer" : "default", color: star <= userRating ? "gold" : "#ccc" }}
              onClick={() => userRating === null && handleRating(star)}
            >
              ★
            </span>
          ))}
          <p className="mt-2 text-muted">{rating > 0 ? `Średnia ocena: ${rating.toFixed(1)}` : "Brak ocen"}</p>
        </div>

        <div className="mt-3">
          <button className="btn btn-outline-success me-2" onClick={handleExportToJSON}>Eksportuj do JSON</button>
          <button className="btn btn-outline-warning" onClick={() => { setCurrentStepIndex(0); setShowSlideshow(true); stopTimer(); }}>Krok po kroku</button>
        </div>
      </div>

      {/* Slideshow */}
      <Modal show={showSlideshow} onHide={() => { setShowSlideshow(false); stopTimer(); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Krok {currentStepIndex + 1} z {recipe.steps.length}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentStep ? (
            <div>
              {currentStepGif && (
                <img src={currentStepGif} alt={currentStep.action} className="img-fluid mb-3" style={{ maxHeight: "400px", objectFit: "contain" }} />
              )}
              {currentStep.type === "action" && (
                <>
                  <h5>{currentStep.action}</h5>
                  <p>{currentStep.description}</p>
                  <ul>
                    {currentStep.temperature && <li>Temperatura: {currentStep.temperature}°C</li>}
                    {currentStep.bladeSpeed && <li>Prędkość: {currentStep.bladeSpeed}</li>}
                    {currentStep.duration && <li>Czas: {Math.floor(currentStep.duration / 60)} min</li>}
                  </ul>
                  {currentStep.duration && (
                    <div className="mt-3">
                      {isStepTimerRunning ? (
                        <>
                          <div className="progress mb-2">
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated" 
                              role="progressbar" 
                              style={{ width: `${(timeLeft / (currentStep.duration / 60)) * 100}%` }}
                              aria-valuenow={timeLeft}
                              aria-valuemin="0"
                              aria-valuemax={currentStep.duration / 60}
                            >
                              {formatTime(timeLeft)}
                            </div>
                          </div>
                          <button className="btn btn-danger" onClick={stopTimer}>
                            Zatrzymaj odliczanie
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => startTimer(currentStep.duration/60)}
                        >
                          Rozpocznij odliczanie ({Math.floor(currentStep.duration/60)} min)
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              {currentStep.type === "ingredient" && (
                <>
                  <h5>Dodanie składnika</h5>
                  <p>{currentStep.description}</p>
                  <ul>
                    {currentStep.ingredients.map((ing, idx) => (
                      <li key={idx}>{ing.name}: {ing.amount} {ing.unit}</li>
                    ))}
                  </ul>
                </>
              )}
              {currentStep.type === "description" && (
                <>
                  <h5>Opis</h5>
                  <p>{currentStep.description}</p>
                </>
              )}
            </div>
          ) : <p>Brak danych kroku.</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setCurrentStepIndex((prev) => Math.max(0, prev - 1)); stopTimer(); }} disabled={currentStepIndex === 0}>Poprzedni</Button>
          <Button variant="primary" onClick={() => { setCurrentStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1)); stopTimer(); }} disabled={currentStepIndex >= recipe.steps.length - 1}>Następny</Button>
          <Button variant="danger" onClick={() => { setShowSlideshow(false); stopTimer(); }}>Zakończ</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Recipe;