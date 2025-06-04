import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// Import Bootstrap CSS if you haven't already in your main App.js or index.js
// import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const [bestRecipes, setBestRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);

  const fetchRecipes = async () => {
    try {
      const bestResponse = await axios.get("/api/recipes/best");
      setBestRecipes(bestResponse.data);

      const latestResponse = await axios.get("/api/recipes/latest");
      setLatestRecipes(latestResponse.data);
    } catch (error) {
      console.error("Błąd przy pobieraniu przepisów:", error);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  return (
    <div className="font-sans text-gray-800">
      {/* mainPageTopImg */}
      <div
        className="relative bg-cover bg-center"
        style={{ backgroundImage: 'url("/mainPageTopImg.jpg")' }}
      >
        <div className="absolute inset-0 bg-opacity-40 flex flex-col items-center justify-center text-white text-center p-4">
          <h1 className="text-4xl font-bold">RECIPE+</h1>
          <p className="mt-2 text-xl">
            Wiele przepisów. Twoje źródło inspiracji
          </p>
          <Link to="/register">
            <button className="button">DOŁĄCZ DO NAS</button>
          </Link>
        </div>
      </div>

      {/* Produkt - Dream Food X */}
      <div className="container my-5">
        <div className="text-center mb-4">
          <h2 className="display-6 fw-bold">
            Dream Food X - rewolucja gotowania dla każdego
          </h2>
          <p className="lead text-muted">
            Spełnij się jako kucharz w przystępnej cenie
          </p>
        </div>
        <div className="row align-items-center dream-food-x-section">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <img
              src="/robot.jpg"
              alt="Dream Food X"
              className="img-fluid rounded shadow"
            />
          </div>
          <div className="col-lg-6">
            <h3 className="h4 fw-bold text-orange-600">Dream Food X</h3>
            <p className="text-muted small-text">
              Twój (nie)zwykły robot kuchenny!
            </p>
            <p className="mt-3 text-muted small-text">
              Masz dość przepłacania za sprzęty, które obiecują kulinarne cuda,
              a w rzeczywistości kosztują tyle, co używany samochód?
            </p>
            <p className="text-muted small-text">
              Dream Food X to odpowiedź na Twoje kuchenne potrzeby – gotowanie
              powinno być proste, a nie luksusem dla wybranych!
            </p>
            <p className="text-muted small-text">
              Z naszym niezawodnym (i nieco zadziornym) robotem kuchennym:
              <ul>
                <li>Mieszasz</li>
                <li>Blendujesz</li>
                <li>Gotujesz na parze</li>
                <li>Podsmażasz</li>
              </ul>
            </p>
            <p className="text-muted small-text">
              Wielofunkcyjny, ale bez zbędnych bajerów - nie każe Ci się łączyć
              z aplikacji, żeby zagotować wodę.
            </p>
            <p className="text-muted small-text">
              Cena, która nie boli - bo nie musisz brać kredytu na dom i garnek
              jednocześnie!
            </p>
            <p className="text-muted small-text">
              Kompaktowy, ale z dużymi możliwościami - zajmuje mniej miejsca niż
              ego niektórych szefów kuchni.
            </p>
            <p className="text-muted small-text">
              Dream Food X - bo każdy zasługuje na pyszną kuchnię bez zbędnych
              komplikacji!
            </p>
          </div>
        </div>
      </div>

      {/* Najlepsze przepisy */}
      <div className="container mt-4">
        <h3 className="text-2xl text-center font-bold mb-4">
          Najlepsze przepisy
        </h3>
        <div className="row">
          {bestRecipes.slice(0, 4).map((recipe) => (
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

      {/* Najnowsze przepisy */}
      <div className="container mt-4">
        <h3 className="text-2xl text-center font-bold mb-4">
          Najnowsze przepisy
        </h3>
        <div className="row">
          {latestRecipes.slice(0, 4).map((recipe) => (
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
    </div>
  );
}
