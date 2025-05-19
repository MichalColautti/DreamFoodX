import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";

function EditRecipe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [unauthorized, setUnauthorized] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image: null });
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [customIngredient, setCustomIngredient] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ingredientList, setIngredientList] = useState([]);

  const [steps, setSteps] = useState([]);
  const [currentStepAction, setCurrentStepAction] = useState("");
  const [currentStepDescription, setCurrentStepDescription] = useState("");
  const [temperature, setTemperature] = useState("");
  const [bladeSpeed, setBladeSpeed] = useState("");
  const [duration, setDuration] = useState("");

  const allowedUnits = ["g", "ml", "l"];

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchCategories();
      fetchRecipe();
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

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`/api/recipes/${id}`);
      if (!res.ok) throw new Error("Nie znaleziono przepisu");
      const data = await res.json();

      if (data.author !== user.username) {
        setUnauthorized(true);
        return;
      }

      setForm({
        title: data.title || "",
        description: data.description || "",
        image: null,
      });

      setPreview(data.imageUrl || "");

      setIngredientList(
        (data.ingredients || []).map((ing) => ({
          name: ing.name,
          quantity: ing.amount + (ing.unit || ""),
        }))
      );

      setSteps(data.steps || []);
    } catch (err) {
      console.error(err);
      setMessage("Błąd ładowania przepisu.");
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
    const qty = quantity.trim().toLowerCase();

    if (!name) return setMessage("Proszę wybrać lub wpisać składnik.");

    const qtyPattern = /^(\d+(\.\d+)?)(g|ml|l)?$/;
    if (!qtyPattern.test(qty)) {
      return setMessage(`Gramatura musi mieć format liczba + opcjonalna jednostka (${allowedUnits.join(", ")})`);
    }

    if (ingredientList.some((ing) => ing.name === name)) {
      return setMessage("Ten składnik już został dodany.");
    }

    setIngredientList([...ingredientList, { name, quantity: qty }]);
    setSelectedIngredient("");
    setCustomIngredient("");
    setQuantity("");
    setMessage("");
  };

  const handleAddStep = () => {
    if (!currentStepAction || !currentStepDescription.trim()) {
      return setMessage("Uzupełnij czynność i opis kroku.");
    }

    if (bladeSpeed) {
      const speed = parseInt(bladeSpeed);
      if (speed < 1 || speed > 10) {
        return setMessage("Prędkość noża musi być od 1 do 10.");
      }
    }

    setSteps([
      ...steps,
      {
        action: currentStepAction,
        description: currentStepDescription.trim(),
        temperature: temperature ? parseInt(temperature) : null,
        bladeSpeed: bladeSpeed ? parseInt(bladeSpeed) : null,
        duration: duration ? parseInt(duration) : null,
      },
    ]);

    setCurrentStepAction("");
    setCurrentStepDescription("");
    setTemperature("");
    setBladeSpeed("");
    setDuration("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) return setMessage("Musisz być zalogowany.");

    if (ingredientList.length === 0) return setMessage("Dodaj przynajmniej jeden składnik.");
    if (steps.length === 0) return setMessage("Dodaj przynajmniej jeden krok.");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);

    const parsedIngredients = ingredientList.map((ing) => {
      const match = ing.quantity.match(/^(\d+(?:\.\d+)?)([a-zA-Z]*)$/);
      return {
        name: ing.name,
        amount: match ? parseFloat(match[1]) : 0,
        unit: match && match[2] ? match[2] : null,
      };
    });

    formData.append("ingredients", JSON.stringify(parsedIngredients));
    formData.append("steps", JSON.stringify(steps));
    if (form.image) formData.append("image", form.image);

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "Przepis zaktualizowany!");
        setTimeout(() => navigate(`/recipe/${id}`), 1000);
      } else {
        setMessage(data.message || "Błąd podczas aktualizacji przepisu.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Błąd połączenia z serwerem.");
    }
  };

  if (unauthorized) {
    return (
      <main style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
        <h1>Brak dostępu</h1>
        <p style={{ color: "red" }}>
          Nie masz uprawnień do edycji tego przepisu.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h1>Edytuj przepis</h1>
      {message && <p style={{ color: "red" }}>{message}</p>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          name="title"
          placeholder="Tytuł przepisu"
          value={form.title}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <textarea
          name="description"
          placeholder="Opis przepisu"
          value={form.description}
          onChange={handleChange}
          rows={4}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        {/* Składniki */}
        <h2>Składniki</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <select
            onChange={(e) => {
              const categoryName = e.target.value;
              setSelectedCategory(categoryName);
              const category = categories.find((c) => c.name === categoryName);
              setIngredients(category ? category.items : []);
              setSelectedIngredient("");
            }}
            value={selectedCategory}
            style={{ flex: 1 }}
          >
            <option value="">Wybierz kategorię</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Wybierz składnik</option>
            {ingredients.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Własny składnik"
            value={customIngredient}
            onChange={(e) => setCustomIngredient(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            placeholder="Gramatura (np. 200g)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={handleAddIngredient}>
            Dodaj składnik
          </button>
        </div>

        {ingredientList.map((ing, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
            <input
              type="text"
              value={ing.name}
              onChange={(e) => {
                const newList = [...ingredientList];
                newList[idx].name = e.target.value;
                setIngredientList(newList);
              }}
              style={{ flex: 2 }}
            />
            <input
              type="text"
              value={ing.quantity}
              onChange={(e) => {
                const newList = [...ingredientList];
                newList[idx].quantity = e.target.value;
                setIngredientList(newList);
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() =>
                setIngredientList(ingredientList.filter((_, i) => i !== idx))
              }
              style={{
                backgroundColor: "#ff4d4d",
                color: "#fff",
                border: "none",
                padding: "4px 10px",
                borderRadius: 4,
              }}
            >
              Usuń
            </button>
          </div>
        ))}

        {/* Kroki */}
        <h2>Kroki przygotowania</h2>
        <select
          value={currentStepAction}
          onChange={(e) => setCurrentStepAction(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 5 }}
        >
          <option value="">Wybierz czynność</option>
          <option value="siekanie">Siekanie</option>
          <option value="mieszanie">Mieszanie</option>
          <option value="gotowanie">Gotowanie</option>
          <option value="pieczenie">Pieczenie</option>
          <option value="smażenie">Smażenie</option>
        </select>
        <textarea
          placeholder="Opis czynności"
          value={currentStepDescription}
          onChange={(e) => setCurrentStepDescription(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="number"
            placeholder="Temperatura (°C)"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            placeholder="Prędkość noża (1–10)"
            value={bladeSpeed}
            onChange={(e) => setBladeSpeed(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            placeholder="Czas (s)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <button type="button" onClick={handleAddStep} style={{ marginBottom: 20 }}>
          Dodaj krok
        </button>

        <ol>
          {steps.map((step, idx) => (
            <li key={idx} style={{ marginBottom: 10 }}>
              <strong>{step.action}</strong>: {step.description}
              {step.temperature !== null && ` | Temp: ${step.temperature}°C`}
              {step.bladeSpeed !== null && ` | Prędkość: ${step.bladeSpeed}`}
              {step.duration !== null && ` | Czas: ${step.duration}s`}
              <br />
              <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                <button
                    type="button"
                    onClick={() => moveStep(idx, -1)}
                    className="small-button"
                    disabled={idx === 0}
                >
                    ↑
                </button>
                <button
                    type="button"
                    onClick={() => moveStep(idx, 1)}
                    className="small-button"
                    disabled={idx === steps.length - 1}
                >
                    ↓
                </button>
              </div>
            </li>
          ))}
        </ol>

        {/* Zdjęcie */}
        <h2>Zdjęcie</h2>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          style={{ marginBottom: 10 }}
        />
        {preview && (
          <div style={{ marginBottom: 20 }}>
            <img
              src={preview}
              alt="Podgląd"
              style={{ maxWidth: "100%", height: "auto", borderRadius: 10 }}
            />
          </div>
        )}

        <button type="submit" style={{ padding: "10px 20px", fontSize: 16 }}>
          Zapisz zmiany
        </button>
      </form>
    </main>
  );

  function moveStep(index, direction) {
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setSteps(updated);
  }
}

export default EditRecipe;
