import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import ConfirmModal from "../components/Modal";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    description: "",
    quantity: 1,
    unit_price: 0,
    client_id: "",
    worker_id: "",
    status: "pending",
    payment_method: "",
  });

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [jobsRes, clientsRes, workersRes] = await Promise.all([
        api.get("/jobs"),
        api.get("/clients"),
        api.get("/workers"),
      ]);

      setJobs(jobsRes.data);
      setClients(clientsRes.data);
      setWorkers(workersRes.data);
    } catch {
      toast.error("Error al cargar datos");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 reset página al buscar
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "description") {
      value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    }

    setForm({ ...form, [name]: value });
  };

  const total = form.quantity * form.unit_price;

  const handleSubmit = async () => {

    if (!form.description.trim())
      return toast.error("Descripción obligatoria");

    if (form.quantity <= 0)
      return toast.error("Cantidad inválida");

    if (form.unit_price <= 0)
      return toast.error("Precio inválido");

    if (!form.client_id)
      return toast.error("Selecciona cliente");

    if (!form.worker_id)
      return toast.error("Selecciona trabajador");

    // 🔥 VALIDACIÓN ANTES DEL LOADING
    if (form.status === "paid" && !form.payment_method) {
      toast.error("Debe seleccionar método de pago");
      return;
    }

    // 🔥 RECIÉN AQUÍ
    setLoading(true);

    try {
      await api.post("/jobs", { ...form, total });

      toast.success("Trabajo creado ✅");

      setForm({
        description: "",
        quantity: 1,
        unit_price: 0,
        client_id: "",
        worker_id: "",
        status: "pending",
        payment_method: "",
      });

      fetchData();

    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Error al guardar"
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/jobs/${deleteId}`);
      toast.success("Trabajo eliminado 🗑️");
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar");
    }
  };

  // 🔥 búsqueda mejorada
  const filteredJobs = jobs.filter((job) => {
    const text = search.toLowerCase();

    return (
      job.description.toLowerCase().includes(text) ||
      (job.client?.name || "").toLowerCase().includes(text)
    );
  });

  const getJobSortValue = (job, key) => {
    const values = {
      id: job.id,
      description: job.description || "",
      quantity: Number(job.quantity || 0),
      client: job.client?.name || "",
      worker: job.worker?.name || "",
      date: job.created_at ? new Date(job.created_at.replace(" ", "T")).getTime() : 0,
      total: Number(job.total || 0),
      status: job.status || "",
    };

    return values[key] ?? "";
  };

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aValue = getJobSortValue(a, sortConfig.key);
    const bValue = getJobSortValue(b, sortConfig.key);

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

  const paginatedJobs = sortedJobs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
        Trabajos
      </h1>

      {/* FORM */}
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow border dark:border-gray-700 space-y-4">

      <div className="grid md:grid-cols-6 gap-4">

        {/* DESCRIPCIÓN */}
        <div className="col-span-2 flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Descripción
          </label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          />
        </div>

        {/* CANTIDAD */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          />
        </div>

        {/* PRECIO */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Precio Unitario
          </label>
          <input
            type="number"
            name="unit_price"
            value={form.unit_price}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          />
        </div>

        {/* CLIENTE */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Cliente
          </label>
          <select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          >
            <option value="">Seleccionar</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* TRABAJADOR */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Trabajador
          </label>
          <select
            name="worker_id"
            value={form.worker_id}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          >
            <option value="">Seleccionar</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* ESTADO */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Estado
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          >
            <option value="pending">Pendiente</option>
            <option value="credit">Crédito</option>
            <option value="paid">Pagado</option>
          </select>
        </div>

        {form.status === "paid" && (
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Método de Pago
          </label>
          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
          >
            <option value="">Seleccionar</option>
            <option value="cash">Efectivo</option>
            <option value="qr">QR</option>
          </select>
        </div>
      )}

      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-700 dark:text-gray-300">
          Total: <b className="text-blue-400">Bs {total}</b>
        </p>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>

    </div>

      {/* BUSCADOR */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Buscar por descripción o cliente..."
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
              <SortableHeader label="Descripción" sortKey="description" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Cantidad" sortKey="quantity" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Cliente" sortKey="client" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Trabajador" sortKey="worker" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Fecha" sortKey="date" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Total" sortKey="total" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Estado" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
          {paginatedJobs.map((j) => (
            <tr
              key={j.id}
              className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {/* ID */}
              <td className="p-3">{j.id}</td>

              {/* DESCRIPCIÓN */}
              <td className="p-3 font-medium">{j.description}</td>

              {/* CANTIDAD */}
              <td className="p-3">{j.quantity}</td>

              {/* CLIENTE */}
              <td className="p-3">{j.client?.name}</td>

              {/* TRABAJADOR */}
              <td className="p-3">{j.worker?.name || "-"}</td>

              {/* FECHA */}
              <td className="p-3">
                {j.created_at
                  ? new Date(j.created_at.replace(" ", "T"))
                      .toLocaleDateString("es-BO")
                  : "-"}
              </td>

              {/* TOTAL */}
              <td className="p-3 text-blue-600 dark:text-blue-400 font-semibold">
                Bs {j.total}
              </td>

              {/* ESTADO */}
              <td className="p-3">
                <StatusBadge status={j.status} />
              </td>

              {/* ACCIONES */}
              <td className="p-3">
                <button
                  onClick={() => setDeleteId(j.id)}
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
      <div className="flex justify-center items-center gap-3 text-gray-700 dark:text-gray-300">

        <button onClick={() => setPage((p) => Math.max(p - 1, 1))} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">
          ←
        </button>

        <span>Página {page}</span>

        <button
          onClick={() =>
            setPage((p) =>
              p < Math.ceil(filteredJobs.length / itemsPerPage)
                ? p + 1
                : p
            )
          }
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        >
          →
        </button>

      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        message="¿Eliminar trabajo?"
      />

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

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    credit: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  const labels = {
    pending: "Pendiente",
    credit: "Crédito",
    paid: "Pagado",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default Jobs;
