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
    <main>
      <h1 className="text-2xl font-bold mb-4">Moje przepisy</h1>
      {recipes.length === 0 ? (
        <p>Brak przepisów.</p>
      ) : (
        <ul className="space-y-2">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="p-4 border rounded">
              <h2 className="text-lg font-semibold">{recipe.title}</h2>
              <p>{recipe.description}</p>
              <img
                src={recipe.image}
                alt={recipe.title}
                className="mt-2 max-w-xs"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default MyRecipes;
