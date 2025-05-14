import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

export default function Home() {
  const [bestRecipes, setBestRecipes] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  
  const fetchRecipes = async () => {
    try {
      const bestResponse = await axios.get('/api/recipes/best');
      setBestRecipes(bestResponse.data);

      const latestResponse = await axios.get('/api/recipes/latest');
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
          <p className="mt-2 text-xl">Wiele przepisów. Twoje źródło inspiracji</p>
          <Link to="/register">
            <button className="button">DOŁĄCZ DO NAS</button> 
          </Link>
        </div>
      </div>

      {/* Produkt - Dream Food X */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        <img src="/robot.jpg" alt="Dream Food X" className="rounded-xl shadow" />
        <div>
          <h2 className="text-2xl font-bold mb-4">Dream Food X - rewolucja gotowania dla każdego</h2>
          <p className="mb-2 text-gray-600">Spełnij się jako kucharz w przystępnej cenie</p>
          <h3 className="text-xl font-semibold text-orange-600 mb-2">Dream Food X</h3>
          <p className="text-sm leading-relaxed">
            Twój (nie)zwykły robot kuchenny!<br /><br />
            Masz dość przepłacania za sprzęty...? <br />
            Dream Food X to odpowiedź na Twoje potrzeby:<br />
            * Mieszasz<br />
            * Blendujesz<br />
            * Gotujesz na parze<br />
            * Podgrzewasz<br /><br />
            Wielofunkcyjny bez zbędnych bajerów...<br />
            Kompaktowy, wydajny, przystępny cenowo!<br />
            ......................<br />
          </p>
        </div>
      </div>

      {/* Najlepsze przepisy */}
      <div className="container mt-4">
        <h3 className="text-2xl text-center font-bold mb-4">Najlepsze przepisy</h3>
        <div className="row">
          {bestRecipes.slice(0, 4).map((recipe) => (
            <div key={recipe.id} className="col-md-3 mb-4">
              <a href={`/recipe/${recipe.id}`} className="card-link text-decoration-none">
                <div className="card">
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      className="card-img-top"
                      alt={recipe.title}
                      style={{ objectFit: 'cover', height: '200px' }}
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
      </div>


      {/* Najnowsze przepisy */}
      <div className="container mt-4">
        <h3 className="text-2xl text-center font-bold mb-4">Najnowsze przepisy</h3>
        <div className="row">
          {latestRecipes.slice(0, 4).map((recipe) => (
            <div key={recipe.id} className="col-md-3 mb-4">
              <a href={`/recipe/${recipe.id}`} className="card-link text-decoration-none">
                <div className="card">
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      className="card-img-top"
                      alt={recipe.title}
                      style={{ objectFit: 'cover', height: '200px' }}
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
      </div>
    </div>
  );
}
