import { useEffect, useState } from "react";

function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user?.username) {
      setError("Nie jesteś zalogowany.");
      return;
    }

    fetch(`/api/recipes/user?username=${user.username}`)
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch(() => setError("Błąd podczas pobierania przepisów."));
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Moje przepisy</h1>
      {recipes.length === 0 ? (
        <p>Brak przepisów.</p>
      ) : (
        <div className="row">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="col-md-3 mb-4">
              <a href={`/recipe/${recipe.id}`} className="card-link text-decoration-none">
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
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyRecipes;
