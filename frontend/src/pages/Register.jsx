import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Hasła się nie zgadzają.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        login(form.username);
        navigate("/");
      }
    } catch (error) {
      setMessage("Błąd połączenia z backendem.");
    }
  };

  return (
    // Apply Bootstrap classes for centering and background
    <main
      className="d-flex flex-column align-items-center justify-content-center bg-light py-5"
      style={{ minHeight: "70vh" }} // Consistent height with Login
    >
      {/* Consistent heading styling */}
      <h1 className="text-3xl font-bold text-center mb-4">Rejestracja</h1>
      {/* Consistent message styling */}
      {message && <p className="mb-3 text-center text-danger">{message}</p>}

      {/* Form container styling for card-like appearance */}
      <form
        onSubmit={handleSubmit}
        className="p-4 shadow bg-white rounded"
        style={{ maxWidth: "400px", width: "100%" }} // Consistent width
      >
        {/* Username input */}
        <div className="mb-3">
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="nazwa użytkownika"
            className="form-control"
          />
        </div>

        {/* Email input */}
        <div className="mb-3">
          {" "}
          {/* Consistent margin-bottom */}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="email"
            className="form-control"
          />
        </div>

        {/* Password input */}
        <div className="mb-3">
          {" "}
          {/* Consistent margin-bottom */}
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="hasło"
            className="form-control"
          />
        </div>

        {/* Confirm Password input */}
        <div className="mb-3">
          {" "}
          {/* Consistent margin-bottom */}
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="powtórz hasło"
            className="form-control"
          />
        </div>

        {/* Show Password checkbox */}
        <div className="form-check mb-0">
          {" "}
          {/* Consistent margin-bottom and Bootstrap styling */}
          <input
            id="showPassword"
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="form-check-input"
          />
          <label
            htmlFor="showPassword"
            className="form-check-label text-secondary"
          >
            Pokaż hasło
          </label>
        </div>

        {/* Register button */}
        <button
          type="submit"
          className="btn button w-100" // Consistent button styling
        >
          Zarejestruj się
        </button>
      </form>
    </main>
  );
}

export default Register;
