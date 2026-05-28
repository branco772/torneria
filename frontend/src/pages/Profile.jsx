import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import api from "../api/api";
import toast from "react-hot-toast";

function Profile() {
  const { user, setUser, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.username || "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    confirm: "",
  });

  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    setForm({ name: user?.username || "" });
  }, [user]);

  // 🌙 DARK MODE
  const toggleDarkMode = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");

    localStorage.setItem(
      "theme",
      html.classList.contains("dark") ? "dark" : "light"
    );
  };

  // 💾 GUARDAR PERFIL
  const handleSaveProfile = async () => {
    const username = form.name.trim();

    if (!username) {
      toast.error("Nombre requerido");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.put("/users/me", { username });

      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
      }

      if (res.data.user) {
        setUser(res.data.user);
      }

      toast.success(res.data.message || "Perfil actualizado");
    } catch (error) {
      toast.error(error.response?.data?.detail || "No se pudo actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  // 🔐 CAMBIAR PASSWORD
  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error("Completa todos los campos");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwords.new.length < 8) {
      toast.error("Mínimo 8 caracteres");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put("/users/change-password", {
        current: passwords.current,
        new: passwords.new,
      });

      toast.success(res.data.message || "Contraseña actualizada");

      setPasswords({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "No se pudo cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreateUser = async () => {
    const username = newUser.username.trim();

    if (!username || !newUser.password || !newUser.confirm) {
      toast.error("Completa todos los campos");
      return;
    }

    if (newUser.password !== newUser.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newUser.password.length < 8) {
      toast.error("Mínimo 8 caracteres");
      return;
    }

    try {
      setCreatingUser(true);
      await api.post("/register", {
        username,
        password: newUser.password,
      });

      toast.success("Usuario creado");
      setNewUser({
        username: "",
        password: "",
        confirm: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "No se pudo crear el usuario");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Ingresa tu contraseña");
      return;
    }

    const confirmed = window.confirm("Esta acción eliminará tu cuenta. ¿Quieres continuar?");
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      const res = await api.delete("/users/me", {
        data: { password: deletePassword },
      });

      toast.success(res.data.message || "Cuenta eliminada");
      logout();
    } catch (error) {
      toast.error(error.response?.data?.detail || "No se pudo eliminar la cuenta");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-blue-500 text-white flex items-center justify-center rounded-full text-2xl font-bold">
          {user?.username?.charAt(0).toUpperCase()}
        </div>

        <h1 className="mt-3 text-xl font-semibold text-gray-800 dark:text-white">
          {user?.username}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Perfil de usuario
        </p>
      </div>

      {/* INFO PERSONAL */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-4">

        <h2 className="font-semibold text-gray-700 dark:text-gray-300">
          Información personal
        </h2>

        <div className="space-y-3">

          <input
            placeholder="Username"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />

        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {savingProfile ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* SEGURIDAD */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-4">

        <h2 className="font-semibold text-gray-700 dark:text-gray-300">
          Seguridad
        </h2>

        <div className="space-y-3">

          <input
            type="password"
            placeholder="Contraseña actual"
            value={passwords.current}
            onChange={(e) =>
              setPasswords({ ...passwords, current: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={passwords.new}
            onChange={(e) =>
              setPasswords({ ...passwords, new: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={passwords.confirm}
            onChange={(e) =>
              setPasswords({ ...passwords, confirm: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />

        </div>

        <button
          onClick={handleChangePassword}
          disabled={savingPassword}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          {savingPassword ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </div>

      {/* PREFERENCIAS */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-4">

        <h2 className="font-semibold text-gray-700 dark:text-gray-300">
          Preferencias
        </h2>

        <button
          onClick={toggleDarkMode}
          className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-lg"
        >
          🌙 Cambiar tema
        </button>

      </div>

      {user?.is_admin && (
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-4">

        <h2 className="font-semibold text-gray-700 dark:text-gray-300">
          Crear usuario
        </h2>

        <div className="space-y-3">
          <input
            placeholder="Username"
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={newUser.confirm}
            onChange={(e) =>
              setNewUser({ ...newUser, confirm: e.target.value })
            }
            className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
          />
        </div>

        <button
          onClick={handleCreateUser}
          disabled={creatingUser}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg"
        >
          {creatingUser ? "Creando..." : "Crear usuario"}
        </button>

      </div>
      )}

      {/* ZONA DE RIESGO */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-red-100 dark:border-red-900 space-y-4">

        <h2 className="font-semibold text-red-600 dark:text-red-400">
          Eliminar cuenta
        </h2>

        <input
          type="password"
          placeholder="Contraseña actual"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
        />

        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg"
        >
          {deletingAccount ? "Eliminando..." : "Eliminar cuenta"}
        </button>

      </div>

    </div>
  );
}

export default Profile;
