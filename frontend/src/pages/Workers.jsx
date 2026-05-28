import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import ConfirmModal from "../components/Modal";

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workersRes, jobsRes] = await Promise.all([
        api.get("/workers"),
        api.get("/jobs"),
      ]);

      setWorkers(workersRes.data);
      setJobs(jobsRes.data);
    } catch {
      toast.error("Error al cargar datos");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim())
      return toast.error("El nombre es obligatorio");

    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/workers/${editingId}`, form);
        toast.success("Trabajador actualizado ✅");
      } else {
        await api.post("/workers", form);
        toast.success("Trabajador creado ✅");
      }

      setForm({ name: "" });
      setEditingId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (worker) => {
    setForm({ name: worker.name });
    setEditingId(worker.id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/workers/${deleteId}`);
      toast.success("Trabajador eliminado 🗑️");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const formatMoney = (value) => Number(value || 0).toFixed(2);
  const parseDate = (value) => value ? new Date(value.replace(" ", "T")) : null;
  const isToday = (value) => {
    const date = parseDate(value);
    if (!date) return false;

    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const workerPayments = workers.map((worker) => {
    const workerJobs = jobs.filter(
      (job) =>
        Number(job.worker?.id) === Number(worker.id) &&
        isToday(job.created_at)
    );
    const totalJobs = workerJobs.reduce(
      (acc, job) => acc + Number(job.total || 0),
      0
    );

    return {
      ...worker,
      jobsCount: workerJobs.length,
      totalJobs,
      paymentAmount: totalJobs * 0.30,
    };
  });

  const filteredWorkers = workerPayments.filter((worker) =>
    worker.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedWorkers = filteredWorkers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-6">

        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Trabajadores
        </h1>

        {/* FORM */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow border dark:border-gray-700 space-y-4">

          <div className="grid md:grid-cols-3 gap-4">

            <div className="flex flex-col md:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Nombre
              </label>
              <input
                value={form.name}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
                  setForm({ ...form, name: value });
                }}
                className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !form.name}
              className="self-end bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              {loading
                ? "Guardando..."
                : editingId
                ? "Actualizar"
                : "Agregar"}
            </button>

            {editingId && (
              <button
                onClick={() => {
                  setForm({ name: "" });
                  setEditingId(null);
                }}
                className="bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            )}

          </div>
        </div>

        {/* RESUMEN DE PAGOS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workerPayments.map((worker) => (
            <div
              key={worker.id}
              className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-400">Trabajador</p>
                  <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                    {worker.name}
                  </h2>
                </div>
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold">
                  {worker.jobsCount} trabajos hoy
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Total hoy</p>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    Bs {formatMoney(worker.totalJobs)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Pago 30%</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    Bs {formatMoney(worker.paymentAmount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BUSCADOR */}
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Buscar trabajador..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
          />
        </div>

        {/* TABLA */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow border dark:border-gray-700 overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Trabajos hoy</th>
                <th className="text-left p-3">Total hoy</th>
                <th className="text-left p-3">Pago 30%</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginatedWorkers.map((w) => (
                <tr
                  key={w.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {/* ID */}
                  <td className="px-3 py-2 text-xs text-gray-400">
                    #{w.id}
                  </td>

                  {/* NOMBRE */}
                  <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-white">
                    {w.name}
                  </td>

                  {/* TRABAJOS */}
                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {w.jobsCount}
                  </td>

                  {/* TOTAL TRABAJOS */}
                  <td className="px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Bs {formatMoney(w.totalJobs)}
                  </td>

                  {/* PAGO */}
                  <td className="px-3 py-2 text-sm font-semibold text-green-600 dark:text-green-400">
                    Bs {formatMoney(w.paymentAmount)}
                  </td>

                  {/* ACCIONES */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">

                      <button
                        onClick={() => handleEdit(w)}
                        className="px-2 py-1 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 hover:opacity-80"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => setDeleteId(w.id)}
                        className="px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 hover:opacity-80"
                      >
                        Eliminar
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex justify-center items-center gap-3 text-gray-700 dark:text-gray-300">

          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            ←
          </button>

          <span>Página {page}</span>

          <button
            onClick={() =>
              setPage((p) =>
                p < Math.ceil(filteredWorkers.length / itemsPerPage)
                  ? p + 1
                  : p
              )
            }
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            →
          </button>

        </div>

        {/* MODAL */}
        <ConfirmModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          message="¿Eliminar trabajador?"
        />

      </div>
    </div>
  );
}

export default Workers;
