import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

function Payments() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const availableJobs = jobs.filter((j) => j.status !== "paid");

  const [form, setForm] = useState({
    job_id: "",
    amount: "",
    method: "cash",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch {
      toast.error("Error al cargar trabajos");
    }
  };

  const handleSelectJob = (id) => {
    const job = jobs.find((j) => j.id == id);

    if (job?.status === "paid") {
      toast.error("Este trabajo ya está pagado");
      return;
    }

    setSelectedJob(job);
    setForm({ ...form, job_id: id });
  };

  const totalPaid = selectedJob?.payments
    ? selectedJob.payments.reduce((acc, p) => acc + Number(p.amount), 0)
    : 0;

  const pending = selectedJob
    ? Number(selectedJob.total) - totalPaid
    : 0;

  const handleSubmit = async () => {
    if (!form.job_id) return toast.error("Selecciona un trabajo");

    if (!form.amount || form.amount <= 0)
      return toast.error("Monto inválido");

    if (Number(form.amount) > pending)
      return toast.error("Excede lo pendiente");

    setLoading(true);

    try {
      await api.post("/payments", form);

      toast.success("Pago registrado 💰");

      setForm({ job_id: "", amount: "", method: "cash" });
      setSelectedJob(null);

      fetchJobs();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

    {/* HEADER */}
    <div className="space-y-1">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
        Pagos
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Registro de pagos
      </p>
    </div>

    {/* SELECT */}
    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
      <select
        value={form.job_id}
        onChange={(e) => handleSelectJob(e.target.value)}
        className="w-full border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleccionar trabajo</option>
        {availableJobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.description} - Bs {j.total}
          </option>
        ))}
      </select>
    </div>

    {/* PANEL INFO */}
    {selectedJob && (
      <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-3">

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Cliente: <b>{selectedJob.client?.name}</b>
        </p>

        {/* CARDS FINANCIERAS */}
        <div className="grid grid-cols-3 gap-3 text-sm">

          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-gray-500">Total</p>
            <p className="font-semibold">Bs {selectedJob.total}</p>
          </div>

          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-center">
            <p className="text-green-500">Pagado</p>
            <p className="font-semibold">Bs {totalPaid}</p>
          </div>

          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center">
            <p className="text-red-500">Restante</p>
            <p className="font-semibold">Bs {pending}</p>
          </div>

        </div>

        {/* BARRA PROGRESO 🔥 */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{
              width: `${(totalPaid / selectedJob.total) * 100}%`
            }}
          />
          <p className="text-xs text-gray-400 text-center">
  {Math.round((totalPaid / selectedJob.total) * 100)}% pagado
</p>
        </div>

        <StatusBadge status={selectedJob.status} />
        {/* HISTORIAL DE PAGOS */}
        {selectedJob && selectedJob.payments?.length > 0 && (
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-3">

            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Historial de pagos
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">

              {selectedJob.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm"
                >

                  <div className="flex flex-col">
                    <span className="font-medium">
                      Bs {p.amount}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {p.method === "cash" ? "💵 Efectivo" : "📱 QR"}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>

                </div>
              ))}

            </div>
          </div>
        )}

      </div>
    )}

    {/* FORM */}
    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow border border-gray-100 dark:border-gray-700">

      <div className="flex flex-col md:flex-row gap-3 items-center">

        <input
          type="number"
          placeholder="Monto"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: Number(e.target.value) })
          }
          className="flex-1 w-full md:max-w-xs border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={form.method}
          onChange={(e) =>
            setForm({ ...form, method: e.target.value })
          }
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2 rounded-lg"
        >
          <option value="cash">💵 Efectivo</option>
          <option value="qr">📱 QR</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading || !selectedJob}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition whitespace-nowrap disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Registrar"}
        </button>

      </div>
    </div>

  </div>
  );
}

/* BADGE */
function StatusBadge({ status }) {
  const styles = {
    pending: "bg-red-900/30 text-red-400",
    credit: "bg-yellow-900/30 text-yellow-400",
    paid: "bg-green-900/30 text-green-400",
  };

  const labels = {
    pending: "Pendiente",
    credit: "Crédito",
    paid: "Pagado",
  };

  return (
    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default Payments;