import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import ConfirmModal from "../components/Modal";

function Clients() {
  const [clients, setClients] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const [selectedClient, setSelectedClient] = useState("");
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "name") {
      value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    }

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 8);
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Nombre obligatorio");
    if (!form.phone.trim()) return toast.error("Teléfono obligatorio");
    if (form.phone.length !== 8) return toast.error("Teléfono inválido");

    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, form);
        toast.success("Cliente actualizado ✅");
      } else {
        await api.post("/clients", form);
        toast.success("Cliente creado ✅");
      }

      setForm({ name: "", phone: "" });
      setEditingId(null);
      fetchClients();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setForm({
      name: client.name,
      phone: client.phone || "",
    });
    setEditingId(client.id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/clients/${deleteId}`);
      toast.success("Cliente eliminado 🗑️");
      setDeleteId(null);
      fetchClients();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const fetchStats = async (id) => {
    try {
      const res = await api.get(`/clients/${id}/stats`);
      setStats(res.data);
    } catch {
      toast.error("Error cargando estadísticas");
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const getClientSortValue = (client, key) => {
    const values = {
      id: client.id,
      name: client.name || "",
      phone: client.phone || "",
    };

    return values[key] ?? "";
  };

  const sortedClients = [...filteredClients].sort((a, b) => {
    const aValue = getClientSortValue(a, sortConfig.key);
    const bValue = getClientSortValue(b, sortConfig.key);

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    return sortConfig.direction === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const paginatedClients = sortedClients.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Clientes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestión de clientes
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow border dark:border-gray-700 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Nombre
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Teléfono
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="self-end bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingId ? "Actualizar" : "Agregar"}
          </button>

        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3">

        <input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
        />

      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow border dark:border-gray-700 overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <SortableHeader label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Nombre" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Teléfono" sortKey="phone" sortConfig={sortConfig} onSort={handleSort} />
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedClients.map((c) => (
              <tr
                key={c.id}
                className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${
                  selectedClient == c.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
                onClick={() => {
                  setSelectedClient(c.id);
                  fetchStats(c.id);
                }}
              >
                <td className="p-3">{c.id}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone || "-"}</td>

                <td className="p-3 space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(c);
                    }}
                    className="px-2 py-1 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 hover:opacity-80"
                  >
                    Editar
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(c.id);
                    }}
                    className="px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 hover:opacity-80"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center gap-2 text-gray-700 dark:text-gray-300">
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">←</button>
        <span>Página {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">→</button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">

          <Card title="Trabajos" value={stats.total_jobs} color="blue" />
          <Card title="Total" value={stats.total_amount} color="green" />
          <Card title="Pagado" value={stats.total_paid} color="yellow" />
          <Card title="Deuda" value={stats.debt} color="red" />

        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        message="¿Eliminar cliente?"
      />

      </div>
    </div>
  );
}

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  const icon = !isActive ? "↕" : sortConfig.direction === "asc" ? "↑" : "↓";

  return (
    <th className="p-3 text-left">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-semibold hover:text-blue-600 dark:hover:text-blue-300"
      >
        <span>{label}</span>
        <span className={isActive ? "text-blue-600 dark:text-blue-300" : "text-gray-400"}>
          {icon}
        </span>
      </button>
    </th>
  );
}

/* CARD REUTILIZABLE */
function Card({ title, value, color }) {
  const colors = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-400">{title}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>
        {title === "Trabajos" ? value : `Bs ${Number(value).toFixed(2)}`}
      </p>
    </div>
  );
}

export default Clients;
