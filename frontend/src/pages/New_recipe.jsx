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

  const allowedUnits = ["g", "ml", "l","szt"];

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

    if (ingredientList.some((ing) => ing.name === name)) {
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

  const moveStepUp = (index) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const moveStepDown = (index) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index + 1], newSteps[index]] = [newSteps[index], newSteps[index + 1]];
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

        if (!data.title || !data.description || !Array.isArray(data.ingredients) || !Array.isArray(data.steps)) {
          setMessage("Nieprawidłowy format pliku JSON.");
          return;
        }

        setForm({ title: data.title, description: data.description, image: null });
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
    <main style={styles.main}>
      <h1 style={styles.title}>Dodaj przepis</h1>
      {message && <p style={styles.message}>{message}</p>}
      <form onSubmit={handleSubmit} encType="multipart/form-data" style={styles.form}>
        <input
          name="title"
          placeholder="Tytuł przepisu"
          value={form.title}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <textarea
          name="description"
          placeholder="Opis przepisu"
          value={form.description}
          onChange={handleChange}
          rows={4}
          style={styles.textarea}
        />

        <h2 style={styles.sectionTitle}>Składniki</h2>
        <div style={styles.row}>
          <select
            onChange={(e) => {
              const categoryName = e.target.value;
              setSelectedCategory(categoryName);
              const category = categories.find((c) => c.name === categoryName);
              setIngredients(category ? category.items : []);
            }}
            value={selectedCategory}
            style={styles.select}
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
            style={styles.select}
          >
            <option value="">Wybierz produkt</option>
            {ingredients.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.row}>
          <input
            type="text"
            placeholder="Własny składnik"
            value={customIngredient}
            onChange={(e) => setCustomIngredient(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Ilość"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={styles.inputSmall}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={styles.select}
          >
            {allowedUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleAddIngredient} style={styles.button}>
            Dodaj składnik
          </button>
        </div>

        <ul style={styles.list}>
          {ingredientList.map((ing, idx) => (
            <li key={idx} style={styles.listItem}>
              {ing.name} - {ing.amount}{ing.unit}
            </li>
          ))}
        </ul>

        <h2 style={styles.sectionTitle}>Kroki przygotowania</h2>
        <div style={styles.row}>
          <select
            value={currentStepAction}
            onChange={(e) => setCurrentStepAction(e.target.value)}
            style={{ ...styles.select, flex: 1 }}
          >
            <option value="">Wybierz czynność</option>
            <option value="siekanie">Siekanie</option>
            <option value="mieszanie">Mieszanie</option>
            <option value="gotowanie">Gotowanie</option>
            <option value="pieczenie">Pieczenie</option>
            <option value="smażenie">Smażenie</option>
          </select>
        </div>

        <textarea
          placeholder="Opis czynności"
          value={currentStepDescription}
          onChange={(e) => setCurrentStepDescription(e.target.value)}
          rows={3}
          style={{ ...styles.textarea, marginTop: 8 }}
        />

        <div style={styles.row}>
          <input
            type="number"
            placeholder="Temperatura (°C)"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            min={0}
            style={styles.inputSmall}
          />
          <input
            type="number"
            placeholder="Prędkość noża (0–10)"
            value={bladeSpeed}
            onChange={(e) => setBladeSpeed(e.target.value)}
            min={0}
            max={10}
            style={styles.inputSmall}
          />
          <input
            type="number"
            placeholder="Czas (min)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
            style={styles.inputSmall}
          />
          <button type="button" onClick={handleAddStep} style={styles.button}>
            Dodaj krok
          </button>
        </div>

        <ol style={styles.stepsList}>
          {steps.map((step, idx) => (
            <li key={idx} style={styles.stepItem}>
              <strong>{step.action}</strong>: {step.description}
              {step.temperature !== null && ` | Temp: ${step.temperature}°C`}
              {step.bladeSpeed !== null && ` | Prędkość: ${step.bladeSpeed}`}
              {step.duration !== null && ` | Czas: ${Math.round(step.duration / 60)} min`}
              <div style={{ marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => moveStepUp(idx)}
                  disabled={idx === 0}
                  style={styles.smallButton}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStepDown(idx)}
                  disabled={idx === steps.length - 1}
                  style={styles.smallButton}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>

        <h2 style={styles.sectionTitle}>Zdjęcie</h2>
        <input
          id="image-upload"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          required
          style={{ marginBottom: 12 }}
        />
        {preview && (
          <div>
            <img
              src={preview}
              alt="Podgląd"
              style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: 8 }}
            />
          </div>
        )}

        <button type="submit" style={{ ...styles.button, marginTop: 20 }}>
          Dodaj
        </button>
        <input
          type="file"
          accept="application/json"
          onChange={handleImportFromJson}
          style={{ marginTop: 10, marginBottom: 10 }}
        />
      </form>
    </main>
  );
}

const styles = {
  main: {
    maxWidth: 800,
    margin: "20px auto",
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#fff",
    borderRadius: 10,
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  message: {
    color: "red",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  inputSmall: {
    padding: 8,
    marginRight: 10,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ccc",
    width: 120,
  },
  textarea: {
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginBottom: 12,
    resize: "vertical",
  },
  select: {
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginRight: 10,
    minWidth: 160,
  },
  button: {
    padding: "10px 18px",
    fontSize: 16,
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  smallButton: {
    padding: "4px 8px",
    fontSize: 14,
    marginRight: 6,
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    color: "#444",
    borderBottom: "1px solid #ddd",
    paddingBottom: 6,
  },
  list: {
    listStyle: "disc inside",
    marginBottom: 20,
    paddingLeft: 0,
    color: "#555",
  },
  listItem: {
    marginBottom: 6,
  },
  stepsList: {
    paddingLeft: 20,
    marginBottom: 20,
    color: "#555",
  },
  stepItem: {
    marginBottom: 12,
  },
};

export default AddRecipe;
