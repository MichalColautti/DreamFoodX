import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap CSS is imported for styling
import { Link } from "react-router-dom"; // Import Link

// Komponent pomocniczy do wyświetlania pustego stanu/błędu
const EmptyFavoritesOrError = ({ user, errorMessage }) => {
  let title = "Twoje ulubione przepisy";
  let message = "";
  let buttonText = "Odkryj nowe przepisy";
  let buttonLink = "/";
  let iconClass = "bi-heart-fill"; // Domyślna ikona dla braku przepisów

  if (errorMessage) {
    // Jeśli jest błąd, dostosuj komunikat i przycisk
    title = errorMessage.startsWith("Aby zobaczyć")
      ? "Zaloguj się"
      : "Wystąpił problem";
    message = errorMessage.startsWith("Aby zobaczyć")
      ? "Proszę, zaloguj się, aby mieć dostęp do ulubionych przepisów."
      : "Przepraszamy, nie udało się załadować ulubionych przepisów. Spróbuj ponownie później.";
    buttonText = errorMessage.startsWith("Aby zobaczyć")
      ? "Przejdź do logowania"
      : "Wróć do strony głównej";
    buttonLink = errorMessage.startsWith("Aby zobaczyć") ? "/login" : "/";
    iconClass = errorMessage.startsWith("Aby zobaczyć")
      ? "bi-person-fill"
      : "bi-exclamation-circle-fill"; // Ikona dla błędów
  } else {
    // Domyślny komunikat dla braku przepisów (gdy nie ma błędu)
    message = user?.username
      ? `${user.username}, wygląda na to, że nie masz jeszcze żadnych ulubionych przepisów. Ale to żaden problem!`
      : "Wygląda na to, że nie masz jeszcze żadnych ulubionych przepisów. Ale to żaden problem!";
  }

  return (
    <div className="container text-center mt-5">
      <div
        className="card p-4 shadow-sm"
        style={{ borderColor: "#f97316", borderWidth: "2px" }}
      >
        <div className="card-body">
          <h4 className="card-title text-dark mb-3">
            <i
              className={`bi ${iconClass} me-2`} // Użycie dynamicznej klasy ikony
              style={{ color: "#f97316" }}
            ></i>{" "}
            {title}
          </h4>
          <p className="card-text text-secondary mb-4">{message}</p>
          <Link
            to={buttonLink}
            className="btn"
            style={{ backgroundColor: "#f97316", color: "white" }}
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setErrorMessage("Aby zobaczyć ulubione przepisy, musisz być zalogowany.");
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `/api/favorites/get-favorites?username=${user.username}`
        );
        if (response.ok) {
          const data = await response.json();
          setFavorites(data);
          // Jeśli response.ok jest true, ale dane są puste,
          // to errorMessage pozostaje null, a to będzie wyświetlone
          // przez EmptyFavoritesOrError z domyślnym komunikatem "brak przepisów".
          if (data.length === 0) {
            setErrorMessage(null); // Upewniamy się, że errorMessage jest null dla "braku przepisów"
          }
        } else {
          // Jeśli response.ok jest false (np. 500 Server Error), ustaw błąd
          setErrorMessage(
            "Wystąpił problem z serwerem podczas pobierania ulubionych przepisów."
          );
        }
      } catch (error) {
        console.error("Błąd przy pobieraniu ulubionych przepisów:", error);
        setErrorMessage(
          "Błąd połączenia z serwerem. Sprawdź swoje połączenie internetowe lub spróbuj ponownie później."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  if (loading) {
    return (
      <p className="text-center mt-5 text-secondary">Ładowanie ulubionych...</p>
    );
  }

  // Jeśli jest błąd LUB brak ulubionych, wyświetl ten sam komponent "EmptyFavoritesOrError"
  if (errorMessage || favorites.length === 0) {
    return <EmptyFavoritesOrError user={user} errorMessage={errorMessage} />;
  }

  // W przeciwnym razie, wyświetl listę ulubionych przepisów
  return (
    <div className="container mt-4 text-center">
      <h2>Twoje ulubione przepisy</h2>
      <div className="row">
        {favorites.map((recipe) => (
          <div key={recipe.id} className="col-md-3 mb-4">
            <Link
              to={`/recipe/${recipe.id}`}
              className="card-link text-decoration-none"
            >
              <div className="card">
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
  );
}

export default Favorites;
