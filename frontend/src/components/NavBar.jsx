import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";
import api from "../api/api";

function NavBar({ setOpen }) {
  const location = useLocation();
  const { user } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [openAlerts, setOpenAlerts] = useState(false);
  const [openUser, setOpenUser] = useState(false);

  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const visibleAlerts = alerts.slice(0, 6);

  // 🌙 DARK MODE
  const toggleDarkMode = () => {
    const html = document.documentElement;

    if (dark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setDark(!dark);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/dashboard/alerts");
      setAlerts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center justify-between">

      {/* IZQUIERDA */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="md:hidden text-xl"
        >
          ☰
        </button>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-4 relative">

        {/* 🔔 NOTIFICACIONES */}
        <div className="relative">
          <button
            onClick={() => setOpenAlerts(!openAlerts)}
            className="text-xl relative hover:scale-110 transition"
          >
            🔔

            {alerts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>

          {/* DROPDOWN ALERTS */}
          {openAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-3 z-50">

              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Notificaciones recientes
                </h3>
                <span className="text-xs text-gray-400">
                  {alerts.length}
                </span>
              </div>

              {alerts.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  Sin alertas
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {visibleAlerts.map((a, i) => (
                    <div
                      key={i}
                      className={`text-sm p-2 rounded-lg flex items-start gap-2
                        ${a.level === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                          a.level === "medium" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" :
                          "bg-blue-100 text-blue-600 dark:bg-blue-900/30"}`}
                    >
                      <span>⚠</span>
                      <span>{a.message}</span>
                    </div>
                  ))}
                  {alerts.length > visibleAlerts.length && (
                    <p className="px-1 pt-1 text-xs text-gray-400">
                      +{alerts.length - visibleAlerts.length} alertas más
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🌙 DARK MODE */}
        <button
          onClick={toggleDarkMode}
          className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded-lg hover:scale-105 transition"
        >
          {dark ? "☀️" : "🌙"}
        </button>

        {/* 👤 USUARIO */}
        <div className="relative">
          <div
            onClick={() => setOpenUser(!openUser)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition"
          >
            {/* Avatar */}
            <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center rounded-full text-sm font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>

            <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
              {user?.username}
            </span>
          </div>

          {/* DROPDOWN USER */}
          {openUser && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-2 z-50">

              <button
                onClick={() => window.location.href = "/profile"}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                👤 Perfil
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
              >
                🚪 Cerrar sesión
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default NavBar;
