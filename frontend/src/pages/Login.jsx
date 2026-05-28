import { useState, useEffect } from "react";
import api from "../api/api";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/login", {
        username: form.username,
        password: form.password,
      });

      await login(response.data.access_token);

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">

        {/* 🔥 HEADER */}
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Bienvenido
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Ingresa a tu cuenta
        </p>

        {location.state?.message && (
          <p className="bg-green-50 text-green-700 text-sm text-center rounded-lg px-3 py-2 mb-4">
            {location.state.message}
          </p>
        )}

        {/* 🔥 FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">
              Usuario
            </label>
            <input
              type="text"
              name="username"
              placeholder="ej: admin"
              value={form.username}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 🔥 ERROR */}
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          {/* 🔥 BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;
