import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-6">Logowanie</h1>
      {message && <p className="mb-4 text-center text-red-500">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="email"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        <br />

        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          placeholder="hasło"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

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

        <button type="submit" className="button">
          Zaloguj się
        </button>
      </form>
    </main>
  );
}

export default Login;
