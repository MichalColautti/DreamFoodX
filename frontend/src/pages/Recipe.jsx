import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { saveAs } from "file-saver";
import { Modal, Button } from "react-bootstrap";

// ===== NOWA ZMIANA: Mapowanie czynności na ścieżki do GIFów =====
const actionGifs = {
  siekanie: "/gifs/siekanie.gif", // Przykładowa ścieżka do GIFa dla "siekanie"
  mieszanie: "/gifs/mieszanie.gif", // Przykładowa ścieżka do GIFa dla "mieszanie"
  gotowanie: "/gifs/gotowanie.gif", // Przykładowa ścieżka do GIFa dla "gotowanie"
  pieczenie: "/gifs/pieczenie.gif", // Przykładowa ścieżka do GIFa dla "pieczenie"
  smażenie: "/gifs/smażenie.gif", // Przykładowa ścieżka do GIFa dla "smażenie" (uwaga na polskie znaki w ścieżkach URL)
  // Dodaj więcej czynności jeśli masz inne
  // Możesz dodać też domyślny GIF, jeśli czynność nie ma specyficznego GIFa
  default: "/gifs/default.gif", // Opcjonalny domyślny GIF
};
// ================================================================

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

  const handleRating = useCallback(
    async (star) => {
      if (!user) {
        alert("Zaloguj się, aby ocenić przepis!");
        return;
      }

      try {
        const responseCheck = await fetch(
          `/api/recipes/${id}/check-already-rated?username=${user.username}`
        );

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
      type: "application/json",
    });
    saveAs(blob, `${recipe.title || "przepis"}.json`);
  };

  const handleDeleteRecipe = async () => {
    const confirmDelete = window.confirm('Czy na pewno chcesz usunąć ten przepis?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Przepis został usunięty.');
        window.location.href = '/'; 
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
        } else {
          setRecipe(null);
        }
      } catch (error) {
        console.error("Błąd przy pobieraniu przepisu:", error);
        setRecipe(null);
        setError("Wystąpił błąd przy pobieraniu przepisu.");
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
          console.error("Błąd przy sprawdzaniu oceny użytkownika:", error);
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
          console.error("Błąd przy sprawdzaniu ulubionych:", error);
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

      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else {
        alert("Błąd przy aktualizacji ulubionych");
      }
    } catch (err) {
      console.error("Błąd:", err);
    }
  };

  if (loading) return <p>Ładowanie przepisu...</p>;
  if (!recipe) return <p>Nie znaleziono przepisu.</p>;

  const rating =
    recipe.rating && !isNaN(recipe.rating) ? parseFloat(recipe.rating) : 0;

  // Pobieramy aktualny krok dla łatwiejszego dostępu
  const currentStep = recipe?.steps?.[currentStepIndex];

  // ===== NOWA ZMIANA: Wybieranie GIFa na podstawie czynności =====
  const currentStepGif = currentStep
    ? actionGifs[currentStep.action.toLowerCase()] || actionGifs.default
    : null;
  // Używamy .toLowerCase() aby dopasować, np. "Siekanie" do "siekanie"
  // Jeśli nie znajdzie dopasowania, użyje 'default' jeśli istnieje, w przeciwnym razie null.
  // ==============================================================

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
            style={{
              maxWidth: "600px",
              maxHeight: "400px",
              objectFit: "cover",
            }}
          />
        )}

        <p className="lead">{recipe.description}</p>

        <p>
          <strong>Autor:</strong> {recipe.author}
          {user && user.username === recipe.author && (
            <span className="ms-3">
              <Link
                to={`/recipes/${id}/edit`}
                className="btn btn-sm btn-outline-secondary me-2"
              >
                Edytuj przepis
              </Link>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleDeleteRecipe}
              >
                Usuń przepis
              </button>
            </span>
          )}
        </p>

        <button
          onClick={toggleFavorite}
          className={`btn ${
            isFavorite ? "btn-danger" : "btn-outline-primary"
          } mb-3`}
        >
          {isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        </button>

        <div className="mb-4">
          <h4>Składniki</h4>
          {recipe.ingredients?.length ? (
            <ul className="list-group list-group-flush">
              {recipe.ingredients.map((ing, idx) => (
                <li className="list-group-item" key={idx}>
                  {ing.name}
                  {ing.amount !== null && ing.amount !== undefined && (
                    <>
                      : {ing.amount}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </>
                  )}
                  {ing.description && (
                    <>
                      {" "}
                      — <em>{ing.description}</em>
                    </>
                  )}
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
                        <li>
                          Czas: {Math.floor(step.duration / 60)} min{" "}
                          {step.duration % 60} s{" "}
                        </li>
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
                  fontSize: "2rem",
                  cursor: userRating === null ? "pointer" : "default",
                  color: star <= userRating ? "gold" : "#ccc",
                  transition: "color 0.2s",
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
        <button
          className="btn btn-outline-success"
          onClick={handleExportToJSON}
        >
          Eksportuj do JSON
        </button>
      </div>

      <div className="mt-3">
        <button
          className="btn btn-outline-warning"
          onClick={() => {
            setCurrentStepIndex(0);
            setShowSlideshow(true);
            setIsStepTimerRunning(false); // Upewnij się, że timer nie działa od razu po otwarciu
            setTimer(null); // Reset timera
          }}
        >
          Krok po kroku
        </button>
      </div>

      {/* Modal Krok po kroku */}
      <Modal
        show={showSlideshow}
        onHide={() => setShowSlideshow(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Krok {currentStepIndex + 1} z {recipe?.steps?.length}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentStep ? ( // Używamy 'currentStep' zamiast 'recipe?.steps?.[currentStepIndex]' dla czytelności
            <div>
              {/* NOWA ZMIANA: Wyświetlanie GIFa na podstawie mapowania */}
              {currentStepGif && (
                <img
                  src={currentStepGif}
                  alt={`Krok ${currentStep.order} - ${currentStep.action}`}
                  className="img-fluid rounded mb-3"
                  style={{
                    maxHeight: "400px",
                    objectFit: "contain",
                    width: "100%",
                  }} // Styl do dopasowania obrazka
                />
              )}
              {/* KONIEC NOWEJ ZMIANY */}

              <h5>{currentStep.action}</h5>
              <p>{currentStep.description}</p>

              <ul>
                {currentStep.temperature && (
                  <li>Temperatura: {currentStep.temperature}°C</li>
                )}
                {currentStep.bladeSpeed && (
                  <li>Prędkość ostrzy: {currentStep.bladeSpeed}</li>
                )}
                {currentStep.duration && (
                  <li>
                    Czas:{" "}
                    {timer !== null ? (
                      <strong>{formatTime(timer)}</strong>
                    ) : (
                      formatTime(currentStep.duration)
                    )}
                  </li>
                )}
              </ul>
              <Button
                variant="success"
                onClick={() => {
                  setIsStepTimerRunning(false); // Zatrzymujemy poprzedni timer
                  setTimer(currentStep.duration || 0); // Ustawiamy czas na początek kroku
                  setTimeout(() => setIsStepTimerRunning(true), 50); // Małe opóźnienie, aby timer mógł się zresetować
                }}
                disabled={isStepTimerRunning && timer > 0} // Wyłącz przycisk, jeśli timer działa
              >
                {isStepTimerRunning && timer > 0 ? "W trakcie..." : "Start"}
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
              setIsStepTimerRunning(false); // Reset timera przy zmianie kroku
              setTimer(null); // Reset timera przy zmianie kroku
            }}
            disabled={currentStepIndex === 0}
          >
            Poprzedni
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setCurrentStepIndex((prev) =>
                Math.min(recipe.steps.length - 1, prev + 1)
              );
              setIsStepTimerRunning(false); // Reset timera przy zmianie kroku
              setTimer(null); // Reset timera przy zmianie kroku
            }}
            disabled={currentStepIndex >= recipe.steps.length - 1}
          >
            Następny
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setShowSlideshow(false);
              setIsStepTimerRunning(false); // Upewnij się, że timer zatrzymuje się po zamknięciu modalu
              setTimer(null); // Zresetuj timer
            }}
          >
            Zakończ
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Recipe;
