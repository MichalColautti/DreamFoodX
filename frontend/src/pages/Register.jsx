import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-6">Rejestracja</h1>
      {message && <p className="mb-4 text-center text-red-500">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-2">
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="username"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="mb-2">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="mb-2">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="hasło"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="mb-2">
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="powtórz hasło"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center">
          <input
            id="showPassword"
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="mr-2"
          />
          <label htmlFor="showPassword" className="text-sm text-gray-600">
            Pokaż hasło
          </label>
        </div>

        <button
          type="submit"
          className="button"
        >
          Zarejestruj się
        </button>
      </form>
    </main>
  );
}

export default Register;
