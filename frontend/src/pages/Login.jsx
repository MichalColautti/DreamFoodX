import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // Don't forget to import Bootstrap CSS

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.username);
        setMessage("Zalogowano pomyślnie");
        navigate("/");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Błąd połączenia z backendem.");
    }
  };

  return (
    <main
      className="d-flex flex-column align-items-center justify-content-center  bg-light"
      style={{ minHeight: "70vh" }}
    >
      {/* Increased margin-bottom for the heading using mb-4 */}
      <h1 className="text-3xl font-bold text-center mb-4">Logowanie</h1>
      {/* Increased margin-bottom for message using mb-3 */}
      {message && <p className="mb-3 text-center text-danger">{message}</p>}

      {/* Used Bootstrap's form-group for better input grouping and added padding with p-4 and shadow */}
      {/* Used Bootstrap's w-100 (width 100%) and max-width classes for form width */}
      <form
        onSubmit={handleSubmit}
        className="p-4 shadow bg-white rounded"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        {/* Added mb-3 for margin-bottom between form elements */}
        <div className="mb-3">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="email"
            className="form-control" // Bootstrap's input styling
          />
        </div>

        <div className="mb-3">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="hasło"
            className="form-control" // Bootstrap's input styling
          />
        </div>

        <div className="form-check mb-0">
          {" "}
          {/* Bootstrap's form-check for checkbox */}
          <input
            id="showPassword"
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="form-check-input" // Bootstrap's checkbox styling
          />
          <label
            htmlFor="showPassword"
            className="form-check-label text-secondary"
          >
            Pokaż hasło
          </label>
        </div>

        {/* Used Bootstrap's btn and btn-warning for the button styling */}
        <button type="submit" className="btn  w-100 button ">
          Zaloguj się
        </button>
      </form>
    </main>
  );
}

export default Login;
