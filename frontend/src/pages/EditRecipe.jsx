import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function EditRecipe() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: "", description: "", image: null });
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState({
    action: "",
    description: "",
    temperature: "",
    bladeSpeed: "",
    duration: "",
    ingredients: [],
  });

  const [stepSelectedCategory, setStepSelectedCategory] = useState("");
  const [stepIngredients, setStepIngredients] = useState([]);
  const [stepSelectedIngredient, setStepSelectedIngredient] = useState("");
  const [stepCustomIngredient, setStepCustomIngredient] = useState("");
  const [stepQuantity, setStepQuantity] = useState("");
  const [stepUnit, setStepUnit] = useState("g");
  const [stepType, setStepType] = useState("");

  const allowedUnits = ["g", "ml", "l", "szt"];

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchRecipe();
      fetchCategories();
    }
  }, [user, navigate, id]);

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`/api/recipes/${id}`);
      const data = await res.json();
      
      setForm({
        title: data.title,
        description: data.description,
        image: null
      });
      
      if (data.imageUrl) {
        setPreview(data.imageUrl);
      }
      
      const convertedSteps = data.steps.map(step => ({
        ...step,
        ingredients: step.ingredients || []
      }));
      
      setSteps(convertedSteps);
    } catch (err) {
      console.error("Błąd pobierania przepisu:", err);
      setMessage("Nie udało się załadować przepisu");
    }
  };

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
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStepCategoryChange = (e) => {
    const categoryName = e.target.value;
    setStepSelectedCategory(categoryName);
    const category = categories.find((c) => c.name === categoryName);
    setStepIngredients(category ? category.items : []);
    setStepSelectedIngredient("");
  };

  const handleAddStepIngredient = () => {
    const name = stepCustomIngredient.trim() || stepSelectedIngredient;
    const qty = stepQuantity.trim();

    if (!name) {
      setMessage("Proszę wybrać lub wpisać składnik dla kroku.");
      return;
    }

    const num = parseFloat(qty);
    if (isNaN(num) || num <= 0) {
      setMessage("Wprowadź poprawną ilość dla składnika kroku.");
      return;
    }

    if (
      currentStep.ingredients.some(
        (ing) => ing.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setMessage("Ten składnik już został dodany do tego kroku.");
      return;
    }

    const newIngredients = [
      ...currentStep.ingredients,
      { name, amount: num, unit: stepUnit },
    ];
    setCurrentStep((prev) => ({ ...prev, ingredients: newIngredients }));

    setStepSelectedIngredient("");
    setStepCustomIngredient("");
    setStepQuantity("");
    setStepUnit("g");
    setMessage("");
  };

  const handleRemoveStepIngredient = (index) => {
    const newIngredients = currentStep.ingredients.filter((_, i) => i !== index);
    setCurrentStep((prev) => ({ ...prev, ingredients: newIngredients }));
  };

  const handleAddStep = () => {
    let newStep = {};

    if (stepType === "action") {
      const { action, description, temperature, bladeSpeed, duration } = currentStep;

      if (!action || !description.trim()) {
        setMessage("Uzupełnij czynność i opis kroku.");
        return;
      }

      newStep = {
        type: "action",
        action,
        description: description.trim(),
        temperature: temperature ? parseInt(temperature) : null,
        bladeSpeed: bladeSpeed ? parseInt(bladeSpeed) : null,
        duration: duration ? parseInt(duration) * 60 : null,
        ingredients: currentStep.ingredients
      };
    }

    else if (stepType === "ingredient") {
      const name = stepCustomIngredient.trim() || stepSelectedIngredient;
      const qty = stepQuantity.trim();

      if (!name) {
        setMessage("Proszę wybrać lub wpisać składnik.");
        return;
      }
      const num = parseFloat(qty);
      if (isNaN(num) || num <= 0) {
        setMessage("Wprowadź poprawną ilość.");
        return;
      }

      newStep = {
        type: "ingredient",
        description: currentStep.description || "",
        ingredients: [{ name, amount: num, unit: stepUnit }]
      };
    }

    else if (stepType === "description") {
      if (!currentStep.description) {
        setMessage("Dodaj opis.");
        return;
      }

      newStep = {
        type: "description",
        description: currentStep.description
      };
    }

    setSteps(prev => [...prev, newStep]);

    setStepType("");
    setCurrentStep({
      action: "",
      description: "",
      temperature: "",
      bladeSpeed: "",
      duration: "",
      ingredients: []
    });
    setStepSelectedCategory("");
    setStepIngredients([]);
    setStepSelectedIngredient("");
    setStepCustomIngredient("");
    setStepQuantity("");
    setStepUnit("g");
    setMessage("");
  };

  const handleEditStep = (index) => {
    const stepToEdit = steps[index];
    setCurrentStep({
      action: stepToEdit.action || "",
      description: stepToEdit.description || "",
      temperature: stepToEdit.temperature ? stepToEdit.temperature.toString() : "",
      bladeSpeed: stepToEdit.bladeSpeed ? stepToEdit.bladeSpeed.toString() : "",
      duration: stepToEdit.duration ? (stepToEdit.duration / 60).toString() : "",
      ingredients: [...(stepToEdit.ingredients || [])],
    });
    setStepType(stepToEdit.type || "");
    
    handleRemoveStep(index);
  };

  const handleRemoveStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    [newSteps[index], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[index]];
    setSteps(newSteps);
  };

  const moveStepUp = (index) => moveStep(index, -1);
  const moveStepDown = (index) => moveStep(index, 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("Musisz być zalogowany, aby edytować przepis.");
      return;
    }

    if (steps.length === 0) {
      setMessage("Dodaj przynajmniej jeden krok przygotowania.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("steps", JSON.stringify(steps));
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        body: formData,
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Błąd parsowania JSON:", parseErr);
      }
      
      if (response.ok) {
        setMessage(data.message || "Przepis zaktualizowany!");
        setTimeout(() => navigate(`/recipe/${id}`), 1500);
      } else {
        setMessage(data.message || "Błąd podczas aktualizacji przepisu.");
      }
    } catch (err) {
      console.error("Błąd:", err);
      setMessage("Błąd połączenia z serwerem.");
    }
  };

  return (
    <main className="container my-5">
      <h1 className="mb-4">Edytuj przepis</h1>
      {message && (
        <div className={`alert ${message.includes("Błąd") ? "alert-danger" : "alert-success"}`} role="alert">
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

        <h2 className="mt-4 mb-3">Dodaj krok przygotowania</h2>

        {/* Wybór typu kroku */}
        <div className="mb-3">
          <label className="form-label">Typ kroku</label>
          <select
            className="form-select"
            value={stepType}
            onChange={(e) => {
              setStepType(e.target.value);
              setCurrentStep({
                action: "",
                description: "",
                temperature: "",
                bladeSpeed: "",
                duration: "",
                ingredients: [],
              });
            }}
          >
            <option value="">Wybierz typ kroku</option>
            <option value="action">Akcyjny</option>
            <option value="ingredient">Składnikowy</option>
            <option value="description">Opisowy</option>
          </select>
        </div>

        {stepType === "action" && (
          <>
            <div className="mb-3">
              <label htmlFor="stepAction" className="form-label">
                Czynność
              </label>
              <select
                className="form-select"
                id="stepAction"
                value={currentStep.action}
                onChange={(e) =>
                  setCurrentStep((prev) => ({ ...prev, action: e.target.value }))
                }
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
                id="stepDescription"
                className="form-control"
                rows="3"
                value={currentStep.description}
                onChange={(e) =>
                  setCurrentStep((prev) => ({ ...prev, description: e.target.value }))
                }
              ></textarea>
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label htmlFor="temperature" className="form-label">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  id="temperature"
                  className="form-control"
                  value={currentStep.temperature}
                  onChange={(e) =>
                    setCurrentStep((prev) => ({ ...prev, temperature: e.target.value }))
                  }
                  min="0"
                  max="300"
                  placeholder="np. 100"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="bladeSpeed" className="form-label">
                  Prędkość noża (0-10)
                </label>
                <input
                  type="number"
                  id="bladeSpeed"
                  className="form-control"
                  value={currentStep.bladeSpeed}
                  onChange={(e) =>
                    setCurrentStep((prev) => ({ ...prev, bladeSpeed: e.target.value }))
                  }
                  min="0"
                  max="10"
                  placeholder="np. 5"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="duration" className="form-label">
                  Czas trwania (min)
                </label>
                <input
                  type="number"
                  id="duration"
                  className="form-control"
                  value={currentStep.duration}
                  onChange={(e) =>
                    setCurrentStep((prev) => ({ ...prev, duration: e.target.value }))
                  }
                  min="1"
                  placeholder="np. 10"
                />
              </div>
            </div>
          </>
        )}

        {stepType === "ingredient" && (
          <>
            <div className="mb-3">
              <label className="form-label">Opis kroku (opcjonalnie)</label>
              <input
                type="text"
                className="form-control"
                value={currentStep.description}
                onChange={(e) =>
                  setCurrentStep((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label htmlFor="ingredientCategory" className="form-label">
                  Kategoria składnika
                </label>
                <select
                  id="ingredientCategory"
                  className="form-select"
                  value={stepSelectedCategory}
                  onChange={(e) => {
                    const categoryName = e.target.value;
                    setStepSelectedCategory(categoryName);
                    const category = categories.find((c) => c.name === categoryName);
                    setStepIngredients(category ? category.items : []);
                    setStepSelectedIngredient("");
                  }}
                >
                  <option value="">Wybierz kategorię</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label htmlFor="ingredientName" className="form-label">
                  Składnik
                </label>
                <select
                  id="ingredientName"
                  className="form-select"
                  value={stepSelectedIngredient}
                  onChange={(e) => {
                    setStepSelectedIngredient(e.target.value);
                    setStepCustomIngredient("");
                  }}
                  disabled={!stepSelectedCategory}
                >
                  <option value="">Wybierz składnik</option>
                  {stepIngredients.map((ing) => (
                    <option key={ing._id || ing.name} value={ing.name}>
                      {ing}
                    </option>
                  ))}
                </select>
                <div className="form-text">Lub wpisz własny składnik:</div>
                <input
                  type="text"
                  className="form-control mt-1"
                  placeholder="Własny składnik"
                  value={stepCustomIngredient}
                  onChange={(e) => {
                    setStepCustomIngredient(e.target.value);
                    setStepSelectedIngredient("");
                  }}
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="ingredientQuantity" className="form-label">
                  Ilość
                </label>
                <input
                  type="number"
                  id="ingredientQuantity"
                  className="form-control"
                  value={stepQuantity}
                  onChange={(e) => setStepQuantity(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="ingredientUnit" className="form-label">
                  Jednostka
                </label>
                <select
                  id="ingredientUnit"
                  className="form-select"
                  value={stepUnit}
                  onChange={(e) => setStepUnit(e.target.value)}
                >
                  {allowedUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {stepType === "description" && (
          <>
            <div className="mb-3">
              <label className="form-label">Opis kroku</label>
              <textarea
                className="form-control"
                rows="3"
                value={currentStep.description}
                onChange={(e) =>
                  setCurrentStep((prev) => ({ ...prev, description: e.target.value }))
                }
              ></textarea>
            </div>
          </>
        )}

        <button
          type="button"
          className="btn btn-primary mb-4"
          onClick={handleAddStep}
        >
          Dodaj krok
        </button>

        {/* Lista składników kroku */}
        {currentStep.ingredients.length > 0 && (
          <div className="mb-3">
            <h4>Składniki kroku:</h4>
            <ul className="list-group">
              {currentStep.ingredients.map((ing, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {ing.name} - {ing.amount} {ing.unit}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveStepIngredient(idx)}
                  >
                    Usuń
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lista wszystkich kroków */}
        {steps.length > 0 && (
          <>
            <h2 className="mb-3">Lista kroków przygotowania</h2>
            <ul className="list-group mb-4">
              {steps.map((step, index) => (
                <li key={index} className="list-group-item d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>
                      {index + 1}.{" "}
                      {step.type === "action" && `${step.action} - ${step.description}`}
                      {step.type === "ingredient" && `${step.description} (dodano składnik)`}
                      {step.type === "description" && `${step.description}`}
                    </strong>
                    <div className="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveStep(index)}
                      >
                        Usuń
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => moveStepUp(index)}
                        disabled={index === 0}
                      >
                        Przesuń w górę
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => moveStepDown(index)}
                        disabled={index === steps.length - 1}
                      >
                        Przesuń w dół
                      </button>
                    </div>
                  </div>

                  {/* Dodatkowe informacje dla kroku akcyjnego */}
                  {step.type === "action" && (
                    <div>
                      {step.temperature !== null && (
                        <small>Temperatura: {step.temperature} °C</small>
                      )}
                      {step.bladeSpeed !== null && (
                        <small className="ms-3">Prędkość noża: {step.bladeSpeed}</small>
                      )}
                      {step.duration !== null && (
                        <small className="ms-3">
                          Czas: {Math.round(step.duration / 60)} minut
                        </small>
                      )}
                    </div>
                  )}

                  {/* Składniki wyłącznie dla kroku ingredient */}
                  {step.type === "ingredient" && step.ingredients && (
                    <div className="mt-2">
                      <strong>Składniki:</strong>
                      <ul>
                        {step.ingredients.map((ing, i) => (
                          <li key={i}>
                            {ing.name} - {ing.amount} {ing.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
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
            <i className="bi bi-image me-2"></i> Zmień obrazek przepisu
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
        <button type="submit" className="btn btn-primary w-100">
          Zapisz zmiany
        </button>
      </form>
    </main>
  );
}

export default EditRecipe;