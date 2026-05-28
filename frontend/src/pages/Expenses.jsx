import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import ConfirmModal from "../components/Modal";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const todayDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear());

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
  unit_price: "",
  category: "otros",
  job_id: "",
});
const total = Number(form.quantity || 0) * Number(form.unit_price || 0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const [expensesRes, jobsRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/jobs"),
      ]);

      setExpenses(expensesRes.data);
      setJobs(jobsRes.data);
    } catch {
      toast.error("Error al cargar gastos");
    }
  };

  const handleSubmit = async () => {
    if (!form.description.trim())
      return toast.error("Descripción obligatoria");

    if (!form.quantity || Number(form.quantity) <= 0)
      return toast.error("Cantidad inválida");

    if (!form.unit_price || Number(form.unit_price) <= 0)
      return toast.error("Precio inválido");

    setLoading(true);

    try {
      await api.post("/expenses", {
        ...form,
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
        job_id: form.job_id ? Number(form.job_id) : null,
      });

      toast.success("Gasto registrado 💸");
      setForm({ description: "", quantity: 1, unit_price: "", category: "otros", job_id: "" });
      fetchExpenses();
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast.success("Gasto eliminado 🗑️");
      setDeleteId(null);
      fetchExpenses();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const text = search.toLowerCase();

    return (
      e.description.toLowerCase().includes(text) ||
      (e.job?.description || "").toLowerCase().includes(text)
    );
  });

  const getExpenseSortValue = (expense, key) => {
    const values = {
      id: expense.id,
      description: expense.description || "",
      category: expense.category || "",
      job: expense.job?.description || "",
      quantity: Number(expense.quantity || 0),
      nit_price: Number(expense.unit_price || 0),
      amount: Number(expense.amount || 0),
      date: expense.created_at ? new Date(expense.created_at.replace(" ", "T")).getTime() : 0,
    };

    return values[key] ?? "";
  };

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const aValue = getExpenseSortValue(a, sortConfig.key);
    const bValue = getExpenseSortValue(b, sortConfig.key);

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

  const paginatedExpenses = sortedExpenses.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalExpenses = expenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0
  );

  const today = new Date().toDateString();

  const dailyExpenses = expenses
    .filter(
      (e) =>
        e.created_at &&
        new Date(e.created_at.replace(" ", "T")).toDateString() === today
    )
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const monthlyExpenses = expenses
    .filter((e) => {
      if (!e.created_at) return false;
      const d = new Date(e.created_at.replace(" ", "T"));

      return (
        d.getMonth() === Number(selectedMonth) &&
        d.getFullYear() === Number(selectedYear)
      );
    })
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Gastos
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Control de egresos del negocio
        </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedMonth}
          onChange={(e)=>setSelectedMonth(e.target.value)}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg px-3 py-1 text-sm shadow-sm"
        >
          {meses.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e)=>setSelectedYear(e.target.value)}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg px-3 py-1 text-sm shadow-sm"
        >
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="grid md:grid-cols-3 gap-4">

        <Card title="Gasto Hoy" value={dailyExpenses} color="red" />
        <Card title={`Gasto ${meses[selectedMonth]}`} value={monthlyExpenses} color="orange" />
        <Card title="Gasto Total" value={totalExpenses} color="gray" />

      </div>

      {/* FORM */}
<div className="max-w-4xl mx-auto">
  <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow border dark:border-gray-700 space-y-4">

    <div className="grid md:grid-cols-6 gap-4">

      {/* Descripción */}
      <div className="flex flex-col md:col-span-3">
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Descripción del gasto
        </label>
        <input
          value={form.description}
          onChange={(e)=>setForm({...form, description:e.target.value})}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
        />
      </div>

      {/* Cantidad */}
      <div className="flex flex-col md:col-span-1">
        <label className="text-xs text-gray-500 mb-1">
          Cantidad
        </label>
        <input
          type="number"
          value={form.quantity}
          onChange={(e)=>setForm({...form, quantity:e.target.value})}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
        />
      </div>

      {/* Precio */}
      <div className="flex flex-col md:col-span-2">
        <label className="text-xs text-gray-500 mb-1">
          Precio unitario
        </label>
        <input
          type="number"
          value={form.unit_price}
          onChange={(e)=>setForm({...form, unit_price:e.target.value})}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded px-3 py-2"
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col md:col-span-3">
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Categoría
        </label>
        <select
          value={form.category}
          onChange={(e)=>setForm({...form, category:e.target.value})}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
        >
          <option value="merienda">Merienda</option>
          <option value="material">Material</option>
          <option value="otros">Otros</option>
        </select>
      </div>

      {/* Trabajo asociado */}
      <div className="flex flex-col md:col-span-3">
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Trabajo asociado
        </label>
        <select
          value={form.job_id}
          onChange={(e)=>setForm({...form, job_id:e.target.value})}
          className="border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 rounded"
        >
          <option value="">Gasto general</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              #{job.id} - {job.description}
            </option>
          ))}
        </select>
      </div>

      {/* Total + botón */}
      <div className="flex items-center justify-between md:col-span-3 mt-2">
        <p className="text-gray-700 dark:text-gray-300 text-lg">
          Total: <b className="text-blue-400">Bs {Number(total).toFixed(2)}</b>
        </p>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>

    </div>

  </div>
</div>

      {/* BUSCADOR */}
      <div className="flex flex-wrap gap-3">

        <input
          placeholder="Buscar gasto..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
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
              <SortableHeader label="P. Unitario" sortKey="unit_price" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Total" sortKey="amount" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Categoría" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Trabajo" sortKey="job" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Fecha" sortKey="date" sortConfig={sortConfig} onSort={handleSort} />
              <th className="p-3 text-left">Acción</th>
            </tr>
          </thead>

          <tbody>
            {paginatedExpenses.map((e) => (
              <tr key={e.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">

                <td className="p-3">{e.id}</td>
                <td className="p-3 font-medium">{e.description}</td>
                <td className="p-3">{e.quantity}</td>

                <td className="p-3">Bs {e.unit_price}</td>

                <td className="p-3 text-red-600 dark:text-red-400 font-semibold">
                  Bs {e.amount}
                </td>
                <td className="p-3">{expenseCategoryLabel(e.category)}</td>

                <td className="p-3">
                  {e.job ? `#${e.job.id} - ${e.job.description}` : "General"}
                </td>

                <td className="p-3">
                  {e.created_at
                    ? new Date(e.created_at.replace(" ", "T"))
                        .toLocaleDateString("es-BO")
                    : "-"}
                </td>

                <td className="p-3">
                  <button
                    onClick={()=>setDeleteId(e.id)}
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
      <div className="flex justify-center gap-3 text-gray-700 dark:text-gray-300">
        <button onClick={()=>setPage(p=>Math.max(p-1,1))} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">←</button>
        <span>Página {page}</span>
        <button onClick={()=>setPage(p=>p+1)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">→</button>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={()=>setDeleteId(null)}
        onConfirm={confirmDelete}
        message="¿Eliminar gasto?"
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

function expenseCategoryLabel(category) {
  const labels = {
    merienda: "Merienda",
    material: "Material",
    otros: "Otros",
  };

  return labels[category] || category || "-";
}

/* CARD */
function Card({ title, value, color }) {
  const colors = {
    red: "text-red-400",
    orange: "text-orange-400",
    gray: "text-gray-300",
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className={`text-xl font-bold ${colors[color]}`}>
        Bs {value}
      </h2>
    </div>
  );
}

export default Expenses;
