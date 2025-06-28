import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import { useAuth } from "../AuthContext"; // Import useAuth to get user info consistently
import { Link } from "react-router-dom"; // Import Link

function MyRecipes() {
  const { user } = useAuth(); // Get user from AuthContext for consistency
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState("");

  useEffect(() => {
    // Moved user check to AuthContext for consistency and better error handling
    if (!user?.username) {
      setError("Aby zobaczyć swoje przepisy, musisz być zalogowany.");
      setLoading(false); // Stop loading if not logged in
      return;
    }

    const fetchMyRecipes = async () => {
      try {
        const response = await fetch(
          `/api/recipes/user?username=${user.username}`
        );
        if (!response.ok) {
          throw new Error("Wystąpił błąd podczas pobierania przepisów.");
        }
        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        console.error("Błąd podczas pobierania przepisów:", err);
        setError(err.message || "Błąd podczas pobierania przepisów.");
      } finally {
        setLoading(false); // Stop loading after fetch
      }
    };

    fetchMyRecipes();
  }, [user]); // Depend on 'user' from AuthContext

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <p className="text-secondary">Ładowanie Twoich przepisów...</p>
      </div>
    );
  }

  // Scenario 1: User is not logged in (error state handled by the check in useEffect)
  if (error) {
    return (
      <div className="container text-center mt-5">
        <div
          className="card p-4 shadow-sm"
          style={{ borderColor: "#f97316", borderWidth: "2px" }}
        >
          <div className="card-body">
            <h4 className="card-title text-dark mb-3">
              <i
                className="bi bi-person-fill me-2"
                style={{ color: "#f97316" }}
              ></i>{" "}
              {/* User icon */}
              {error}
            </h4>
            <p className="card-text text-secondary mb-4">
              Proszę, zaloguj się, aby mieć dostęp do swoich przepisów.
            </p>
            <Link // Changed <a> to Link
              to="/login" // Changed href to to
              className="btn"
              style={{ backgroundColor: "#f97316", color: "white" }}
            >
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Scenario 2: User is logged in but has no recipes
  if (recipes.length === 0) {
    return (
      <div className="container text-center mt-5">
        <div
          className="card p-4 shadow-sm"
          style={{ borderColor: "#f97316", borderWidth: "2px" }}
        >
          <div className="card-body">
            <h4 className="card-title text-dark mb-3">
              <i
                className="bi bi-journal-plus me-2"
                style={{ color: "#f97316" }}
              ></i>{" "}
              {/* Plus icon for recipes */}
              Brak Twoich przepisów!
            </h4>
            <p className="card-text text-secondary mb-4">
              {user?.username ? `${user.username}, ` : ""}nie dodałeś jeszcze
              żadnych przepisów. Czas podzielić się swoimi kulinarnymi dziełami!
            </p>
            <Link // Changed <a> to Link
              to="/new-recipe" // Changed href to to
              className="btn"
              style={{ backgroundColor: "#f97316", color: "white" }}
            >
              Dodaj nowy przepis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If there are recipes, display them as before
  return (
    <div className="container mt-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Moje przepisy</h1>
      <div className="row">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="col-md-3 mb-4">
            <Link // Changed <a> to Link
              to={`/recipe/${recipe.id}`} // Changed href to to
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
  );
}

export default MyRecipes;
