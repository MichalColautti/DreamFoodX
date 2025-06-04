import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function AddRecipe() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: "", description: "", image: null });
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [customIngredient, setCustomIngredient] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [ingredientList, setIngredientList] = useState([]);

  const [steps, setSteps] = useState([]);
  const [currentStepAction, setCurrentStepAction] = useState("");
  const [currentStepDescription, setCurrentStepDescription] = useState("");
  const [temperature, setTemperature] = useState("");
  const [bladeSpeed, setBladeSpeed] = useState("");
  const [duration, setDuration] = useState("");

  const allowedUnits = ["g", "ml", "l", "szt"];

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchCategories();
    }
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/ingredients/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Błąd pobierania kategorii:", err);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files[0];
      setForm({ ...form, image: file });

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleAddIngredient = () => {
    const name = customIngredient.trim() || selectedIngredient;
    const qty = quantity.trim();

    if (!name) {
      setMessage("Proszę wybrać lub wpisać składnik.");
      return;
    }

    const num = parseFloat(qty);
    if (isNaN(num) || num <= 0) {
      setMessage("Wprowadź poprawną ilość.");
      return;
    }

    if (
      ingredientList.some(
        (ing) => ing.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setMessage("Ten składnik już został dodany.");
      return;
    }

    setIngredientList([...ingredientList, { name, amount: num, unit }]);
    setSelectedIngredient("");
    setCustomIngredient("");
    setQuantity("");
    setUnit("g");
    setMessage("");
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredientList(ingredientList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddStep = () => {
    if (currentStepAction && currentStepDescription.trim()) {
      if (bladeSpeed) {
        const speed = parseInt(bladeSpeed);
        if (speed < 0 || speed > 10) {
          setMessage("Prędkość noża musi być od 0 do 10.");
          return;
        }
      }

      setSteps([
        ...steps,
        {
          action: currentStepAction,
          description: currentStepDescription.trim(),
          temperature: temperature ? parseInt(temperature) : null,
          bladeSpeed: bladeSpeed ? parseInt(bladeSpeed) : null,
          duration: duration ? parseInt(duration) * 60 : null,
        },
      ]);
      setCurrentStepAction("");
      setCurrentStepDescription("");
      setTemperature("");
      setBladeSpeed("");
      setDuration("");
      setMessage("");
    } else {
      setMessage("Uzupełnij czynność i opis kroku.");
    }
  };

  const handleRemoveStep = (indexToRemove) => {
    const updatedSteps = steps.filter((_, idx) => idx !== indexToRemove);
    // Reorder steps if necessary (though not strictly needed if order is determined by index)
    const reorderedSteps = updatedSteps.map((step, idx) => ({
      ...step,
      order: idx + 1, // Maintain order property if it's used elsewhere
    }));
    setSteps(reorderedSteps);
  };

  const moveStepUp = (index) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [
      newSteps[index],
      newSteps[index - 1],
    ];
    setSteps(newSteps);
  };

  const moveStepDown = (index) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index + 1], newSteps[index]] = [
      newSteps[index],
      newSteps[index + 1],
    ];
    setSteps(newSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("Musisz być zalogowany, aby dodać przepis.");
      return;
    }

    if (ingredientList.length === 0) {
      setMessage("Dodaj przynajmniej jeden składnik.");
      return;
    }

    if (steps.length === 0) {
      setMessage("Dodaj przynajmniej jeden krok przygotowania.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("author", user.username);
    formData.append("ingredients", JSON.stringify(ingredientList));
    formData.append("steps", JSON.stringify(steps));
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "Przepis dodany!");
        setForm({ title: "", description: "", image: null });
        setIngredientList([]);
        setSteps([]);
        setPreview("");
        document.getElementById("image-upload").value = "";
      } else {
        setMessage(data.message || "Błąd podczas dodawania przepisu.");
      }
    } catch (err) {
      console.error("Błąd:", err);
      setMessage("Błąd połączenia z serwerem.");
    }
  };

  const handleImportFromJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (
          !data.title ||
          !data.description ||
          !Array.isArray(data.ingredients) ||
          !Array.isArray(data.steps)
        ) {
          setMessage("Nieprawidłowy format pliku JSON.");
          return;
        }

        setForm({
          title: data.title,
          description: data.description,
          image: null,
        });
        setIngredientList(data.ingredients);
        setSteps(data.steps);
        setPreview("");
        setMessage("Dane zaimportowane z pliku JSON.");
      } catch (error) {
        console.error("Błąd parsowania JSON:", error);
        setMessage("Błąd parsowania pliku JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="container my-5">
      <h1 className="mb-4">Dodaj przepis</h1>
      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Tytuł przepisu
          </label>
          <input
            type="text"
            className="form-control"
            id="title"
            name="title"
            placeholder="Tytuł przepisu"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Opis przepisu
          </label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            placeholder="Opis przepisu"
            value={form.description}
            onChange={handleChange}
            rows="4"
          ></textarea>
        </div>

        {/* Ingredients */}
        <h2 className="mt-4 mb-3">Składniki</h2>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <select
              className="form-select"
              onChange={(e) => {
                const categoryName = e.target.value;
                setSelectedCategory(categoryName);
                const category = categories.find(
                  (c) => c.name === categoryName
                );
                setIngredients(category ? category.items : []);
                setSelectedIngredient("");
              }}
              value={selectedCategory}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <select
              className="form-select"
              value={selectedIngredient}
              onChange={(e) => setSelectedIngredient(e.target.value)}
            >
              <option value="">Wybierz składnik</option>
              {ingredients.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Własny składnik"
              value={customIngredient}
              onChange={(e) => setCustomIngredient(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Ilość (np. 200)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {allowedUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={handleAddIngredient}
            >
              Dodaj składnik
            </button>
          </div>
        </div>

        {ingredientList.length > 0 && (
          <ul className="list-group mb-4">
            {ingredientList.map((ing, idx) => (
              <li
                key={idx}
                className="list-group-item d-flex justify-content-between align-items-center"
                style={{ listStyleType: "none" }}
              >
                <div className="row flex-grow-1 align-items-center g-2">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={ing.name}
                      onChange={(e) => {
                        const newList = [...ingredientList];
                        newList[idx].name = e.target.value;
                        setIngredientList(newList);
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="Ilość"
                      value={ing.amount}
                      onChange={(e) => {
                        const newList = [...ingredientList];
                        newList[idx].amount = parseFloat(e.target.value);
                        setIngredientList(newList);
                      }}
                    />
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={ing.unit}
                      onChange={(e) => {
                        const newList = [...ingredientList];
                        newList[idx].unit = e.target.value;
                        setIngredientList(newList);
                      }}
                    >
                      <option value="">brak</option>
                      {allowedUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm ms-3"
                  onClick={() => handleRemoveIngredient(idx)}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Steps */}
        <h2 className="mt-4 mb-3">Kroki przygotowania</h2>
        <div className="mb-3">
          <label htmlFor="stepAction" className="form-label">
            Czynność
          </label>
          <select
            className="form-select"
            id="stepAction"
            value={currentStepAction}
            onChange={(e) => setCurrentStepAction(e.target.value)}
          >
            <option value="">Wybierz czynność</option>
            <option value="siekanie">Siekanie</option>
            <option value="mieszanie">Mieszanie</option>
            <option value="gotowanie">Gotowanie</option>
            <option value="pieczenie">Pieczenie</option>
            <option value="smażenie">Smażenie</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="stepDescription" className="form-label">
            Opis czynności
          </label>
          <textarea
            className="form-control"
            id="stepDescription"
            placeholder="Opis czynności"
            value={currentStepDescription}
            onChange={(e) => setCurrentStepDescription(e.target.value)}
            rows="3"
          ></textarea>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              placeholder="Temperatura (°C)"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              placeholder="Prędkość noża (0–10)"
              value={bladeSpeed}
              onChange={(e) => setBladeSpeed(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              placeholder="Czas (min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary mb-4"
          onClick={handleAddStep}
        >
          Dodaj krok
        </button>

        {steps.length > 0 && (
          <ol className="list-group mb-4">
            {steps.map((step, idx) => (
              <li key={idx} className="list-group-item">
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">
                    Krok {idx + 1}: {step.action}
                  </h5>
                  <small className="text-muted">
                    {step.temperature !== null &&
                      `Temp: ${step.temperature}°C `}
                    {step.bladeSpeed !== null &&
                      `Prędkość: ${step.bladeSpeed} `}
                    {step.duration !== null &&
                      `Czas: ${Math.round(step.duration / 60)} min`}
                  </small>
                </div>
                <p className="mb-1">{step.description}</p>
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveStep(idx)}
                  >
                    Usuń
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => moveStepUp(idx)}
                    disabled={idx === 0}
                  >
                    Przesuń w górę
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => moveStepDown(idx)}
                    disabled={idx === steps.length - 1}
                  >
                    Przesuń w dół
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mb-2">
          <label htmlFor="recipeImage" className="d-none">
            Obrazek przepisu:
          </label>
          <input
            type="file"
            className="form-control d-none"
            id="recipeImage"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          <button
            type="button"
            className="btn btn-success btn-lg w-100 py-3"
            onClick={() => document.getElementById("recipeImage").click()}
          >
            <i className="bi bi-image me-2"></i> Zmień / Dodaj obrazek przepisu
          </button>

          {preview && (
            <div className="mt-4 text-center p-3 border rounded bg-light shadow-sm">
              <p className="mb-2 text-muted">Podgląd obrazka:</p>
              <img
                src={preview}
                alt="Podgląd"
                className="img-fluid rounded shadow-sm"
                style={{
                  maxWidth: "300px",
                  height: "auto",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary  w-100">
          Dodaj
        </button>
        <div className="mt-3">
          <label htmlFor="importJson" className="form-label">
            Importuj z pliku JSON
          </label>
          <input
            id="importJson"
            type="file"
            accept="application/json"
            onChange={handleImportFromJson}
            className="form-control"
          />
        </div>
      </form>
    </main>
  );
}

export default AddRecipe;
