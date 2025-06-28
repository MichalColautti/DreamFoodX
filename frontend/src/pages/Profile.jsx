import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; 

const EmptyFavoritesOrError = ({ user, errorMessage }) => {
  let title = "Twój profil";
  let message = "";
  let buttonText = "Odkryj przepisy";
  let buttonLink = "/";
  let iconClass = "bi-person-circle"; 

  if (errorMessage) {
    title = errorMessage.startsWith("Aby zobaczyć")
      ? "Zaloguj się"
      : "Wystąpił problem";
    message = errorMessage.startsWith("Aby zobaczyć")
      ? "Proszę, zaloguj się, aby mieć dostęp do profilu."
      : "Przepraszamy, nie udało się załadować danych profilu. Spróbuj ponownie później.";
    buttonText = errorMessage.startsWith("Aby zobaczyć")
      ? "Przejdź do logowania"
      : "Wróć do strony głównej";
    buttonLink = errorMessage.startsWith("Aby zobaczyć") ? "/login" : "/";
    iconClass = errorMessage.startsWith("Aby zobaczyć")
      ? "bi-person-fill"
      : "bi-exclamation-circle-fill";
  } else {
    message = user?.username
      ? `${user.username}, wygląda na to, że nie masz jeszcze żadnych ulubionych przepisów.`
      : "Brak danych profilu.";
  }

  return (
    <div className="container text-center mt-5">
      <div
        className="card p-4 shadow-sm"
        style={{ borderColor: "#f97316", borderWidth: "2px" }}
      >
        <div className="card-body">
          <h4 className="card-title text-dark mb-3">
            <i className={`bi ${iconClass} me-2`} style={{ color: "#f97316" }}></i> {title}
          </h4>
          <p className="card-text text-secondary mb-4">{message}</p>
          <Link to={buttonLink} className="btn" style={{ backgroundColor: "#f97316", color: "white" }}>
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

function Profile() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setErrorMessage("Aby zobaczyć profil, musisz być zalogowany.");
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await fetch(`/api/favorites/get-favorites?username=${user.username}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data);
          if (data.length === 0) {
            setErrorMessage(null); 
          }
        } else {
          setErrorMessage("Wystąpił problem z serwerem podczas pobierania danych profilu.");
        }
      } catch (error) {
        console.error("Błąd przy pobieraniu profilu:", error);
        setErrorMessage("Błąd połączenia z serwerem. Spróbuj ponownie później.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  if (loading) {
    return <p className="text-center mt-5 text-secondary">Ładowanie profilu...</p>;
  }

  if (errorMessage || favorites.length === 0) {
    return <EmptyFavoritesOrError user={user} errorMessage={errorMessage} />;
  }

  return (
    <div className="container mt-4 text-center">
      <h2>Witaj, {user.username}!</h2>
      <h3 className="mb-4">Twoje ulubione przepisy</h3>
      <div className="row">
        {favorites.map((recipe) => (
          <div key={recipe.id} className="col-md-3 mb-4">
            <Link to={`/recipe/${recipe.id}`} className="card-link text-decoration-none">
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

export default Profile;
