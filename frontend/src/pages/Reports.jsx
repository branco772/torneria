import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers3,
  PieChart as PieChartIcon,
  RefreshCcw,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "../api/api";
import toast from "react-hot-toast";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const categoryLabels = {
  merienda: "Merienda",
  material: "Material",
  otros: "Otros",
};

const expenseColors = {
  merienda: "#f59e0b",
  material: "#3b82f6",
  otros: "#64748b",
};

const chartPalette = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#14b8a6"];

function Reports() {
  const today = new Date();
  const [filters, setFilters] = useState({
    startDate: firstDayOfMonth(today),
    endDate: formatDate(today),
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    compare: true,
    category: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [jobs, setJobs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [jobsSearch, setJobsSearch] = useState("");
  const [expenseSort, setExpenseSort] = useState({ key: "date", direction: "desc" });
  const [jobSort, setJobSort] = useState({ key: "profit", direction: "desc" });
  const [expensePage, setExpensePage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    setError("");

    try {
      const [jobsRes, expensesRes, paymentsRes] = await Promise.all([
        api.get("/jobs"),
        api.get("/expenses"),
        api.get("/payments"),
      ]);

      setJobs(jobsRes.data);
      setExpenses(expensesRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      setError("No se pudieron cargar los reportes.");
      toast.error(err.response?.data?.detail || "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(
    () => buildReportData(jobs, expenses, payments, appliedFilters),
    [jobs, expenses, payments, appliedFilters]
  );

  const previousData = useMemo(() => {
    const previousFilters = getPreviousPeriod(appliedFilters);
    return buildReportData(jobs, expenses, payments, previousFilters);
  }, [jobs, expenses, payments, appliedFilters]);

  const kpis = useMemo(
    () => buildKpis(filteredData, previousData),
    [filteredData, previousData]
  );

  const filteredExpenseRows = useMemo(() => {
    const search = expenseSearch.toLowerCase();
    const rows = filteredData.expenses.filter((expense) => {
      const text = `${expense.description} ${expense.category}`.toLowerCase();
      return text.includes(search);
    });

    return sortRows(rows, expenseSort, {
      date: (row) => dateValue(row.created_at),
      description: (row) => row.description || "",
      category: (row) => categoryLabels[row.category] || row.category || "",
      quantity: (row) => Number(row.quantity || 0),
      unit_price: (row) => Number(row.unit_price || 0),
      total: (row) => Number(row.amount || 0),
    });
  }, [filteredData.expenses, expenseSearch, expenseSort]);

  const profitableJobs = useMemo(() => {
    const search = jobsSearch.toLowerCase();
    return sortRows(
      filteredData.profitableJobs.filter((job) =>
        `${job.description} ${job.client}`.toLowerCase().includes(search)
      ),
      jobSort,
      {
        job: (row) => row.description || "",
        client: (row) => row.client || "",
        income: (row) => row.income,
        expenses: (row) => row.expenses,
        profit: (row) => row.profit,
      }
    );
  }, [filteredData.profitableJobs, jobsSearch, jobSort]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setExpensePage(1);
    setJobsPage(1);
  };

  const syncMonthRange = (month, year) => {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);

    setFilters((current) => ({
      ...current,
      month: Number(month),
      year: Number(year),
      startDate: formatDate(start),
      endDate: formatDate(end),
    }));
  };

  const handleExport = async (type) => {
    setExportOpen(false);

    if (type === "pdf") {
      await exportReportToPdf(filteredData, kpis, appliedFilters);
      return;
    }

    const workbookRows = buildExportRows(filteredData, kpis);
    const extension = type === "excel" ? "xls" : "csv";
    const separator = type === "excel" ? "\t" : ",";
    const mime =
      type === "excel"
        ? "application/vnd.ms-excel;charset=utf-8;"
        : "text/csv;charset=utf-8;";

    downloadTableFile(workbookRows, `reportes-torneria-morales.${extension}`, separator, mime);
  };

  if (loading) {
    return <ReportsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-6 text-red-100">
        <h1 className="text-xl font-semibold">Reportes</h1>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <button
          onClick={fetchReportsData}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition hover:bg-red-500"
        >
          <RefreshCcw size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div id="reports-dashboard" className="theme-aware-page space-y-5 bg-slate-950/95 text-slate-100 print:bg-white print:text-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Reportes</h1>
          <p className="text-sm text-slate-400">Análisis y estadísticas del negocio</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-right shadow-lg">
          <p className="text-xs uppercase text-slate-500">Tornería MORALES</p>
          <p className="text-sm text-slate-300">{new Date().toLocaleDateString("es-BO")}</p>
        </div>
      </div>

      <FiltersPanel
        filters={filters}
        setFilters={setFilters}
        syncMonthRange={syncMonthRange}
        applyFilters={applyFilters}
        exportOpen={exportOpen}
        setExportOpen={setExportOpen}
        handleExport={handleExport}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} compare={appliedFilters.compare} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Ingresos vs Gastos" icon={TrendingUp}>
          <LineChart data={filteredData.dailyFinancials}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip content={<MoneyTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="income" name="Ingresos" stroke="#22c55e" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Ganancia mensual" icon={BarChart3}>
          <BarChart data={filteredData.monthlyProfit}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip content={<MoneyTooltip />} />
            <Bar dataKey="profit" name="Ganancia" radius={[8, 8, 0, 0]}>
              {filteredData.monthlyProfit.map((item, index) => (
                <Cell key={item.month} fill={item.profit >= 0 ? chartPalette[index % chartPalette.length] : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Gastos por categoría" icon={PieChartIcon}>
          {filteredData.expensesByCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <PieChart>
              <Pie
                data={filteredData.expensesByCategory}
                dataKey="total"
                nameKey="categoryLabel"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={4}
              >
                {filteredData.expensesByCategory.map((entry) => (
                  <Cell key={entry.category} fill={expenseColors[entry.category] || "#64748b"} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
              <Legend />
            </PieChart>
          )}
        </ChartCard>

        <ChartCard title="Actividad semanal" icon={CalendarDays}>
          <AreaChart data={filteredData.weeklyActivity}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip content={<PlainTooltip />} />
            <Area type="monotone" dataKey="jobs" name="Trabajos" stroke="#3b82f6" fill="url(#activityGradient)" strokeWidth={3} />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Top clientes por ingresos" icon={Wallet}>
          <BarChart data={filteredData.topClients} layout="vertical">
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={96} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip content={<MoneyTooltip />} />
            <Bar dataKey="total" name="Ingresos" fill="#3b82f6" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Distribución de tipos de trabajo" icon={Layers3}>
          {filteredData.jobTypes.length === 0 ? (
            <EmptyChart />
          ) : (
            <PieChart>
              <Pie data={filteredData.jobTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}>
                {filteredData.jobTypes.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip content={<PlainTooltip />} />
              <Legend />
            </PieChart>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportTable
          title="Reporte de gastos"
          search={expenseSearch}
          setSearch={setExpenseSearch}
          page={expensePage}
          setPage={setExpensePage}
          rows={filteredExpenseRows}
          itemsPerPage={itemsPerPage}
          sortConfig={expenseSort}
          setSortConfig={setExpenseSort}
          columns={[
            { key: "date", label: "Fecha", render: (row) => formatDisplayDate(row.created_at) },
            { key: "description", label: "Descripción", render: (row) => row.description },
            { key: "category", label: "Categoría", render: (row) => categoryLabels[row.category] || row.category },
            { key: "quantity", label: "Cantidad", render: (row) => row.quantity },
            { key: "unit_price", label: "P. Unitario", render: (row) => `Bs ${money(row.unit_price)}` },
            { key: "total", label: "Total", render: (row) => <span className="text-red-400">Bs {money(row.amount)}</span> },
          ]}
        />

        <ReportTable
          title="Trabajos más rentables"
          search={jobsSearch}
          setSearch={setJobsSearch}
          page={jobsPage}
          setPage={setJobsPage}
          rows={profitableJobs}
          itemsPerPage={itemsPerPage}
          sortConfig={jobSort}
          setSortConfig={setJobSort}
          columns={[
            { key: "job", label: "Trabajo", render: (row) => row.description },
            { key: "client", label: "Cliente", render: (row) => row.client },
            { key: "income", label: "Ingreso", render: (row) => `Bs ${money(row.income)}` },
            { key: "expenses", label: "Gastos", render: (row) => `Bs ${money(row.expenses)}` },
            {
              key: "profit",
              label: "Ganancia",
              render: (row) => (
                <span className={row.profit >= 0 ? "text-green-400" : "text-red-400"}>
                  Bs {money(row.profit)}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function FiltersPanel({
  filters,
  setFilters,
  syncMonthRange,
  applyFilters,
  exportOpen,
  setExportOpen,
  handleExport,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 shadow-xl shadow-slate-950/30 backdrop-blur">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-8">
        <Field label="Fecha inicial" className="xl:col-span-1">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="report-input"
          />
        </Field>
        <Field label="Fecha final" className="xl:col-span-1">
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="report-input"
          />
        </Field>
        <Field label="Mes">
          <select
            value={filters.month}
            onChange={(e) => syncMonthRange(e.target.value, filters.year)}
            className="report-input"
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Año">
          <select
            value={filters.year}
            onChange={(e) => syncMonthRange(filters.month, e.target.value)}
            className="report-input"
          >
            {[2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="report-input"
          >
            <option value="all">Todas</option>
            <option value="material">Material</option>
            <option value="merienda">Merienda</option>
            <option value="otros">Otros</option>
          </select>
        </Field>
        <Field label="Comparar">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={filters.compare}
              onChange={(e) => setFilters({ ...filters, compare: e.target.checked })}
              className="h-4 w-4 accent-blue-500"
            />
            Período previo
          </label>
        </Field>
        <div className="flex items-end gap-2 xl:col-span-2">
          <button
            onClick={applyFilters}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Filter size={16} />
            Aplicar filtros
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-4 text-sm font-semibold text-slate-100 transition hover:border-blue-500 hover:text-blue-200"
            >
              <Download size={16} />
              Exportar
              <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                <ExportButton icon={FileText} label="PDF" onClick={() => handleExport("pdf")} />
                <ExportButton icon={FileSpreadsheet} label="Excel" onClick={() => handleExport("excel")} />
                <ExportButton icon={FileText} label="CSV" onClick={() => handleExport("csv")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, valueType = "money", displayValue, icon: Icon, tone, trend, trendLabel, compare }) {
  const animatedValue = useAnimatedNumber(value, valueType);
  const positive = trend >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  const color = {
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  }[tone];

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl border p-2 ${color}`}>
          <Icon size={18} />
        </div>
        {compare && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
              positive ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"
            }`}
          >
            <TrendIcon size={13} />
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs uppercase text-slate-500">{title}</p>
      <h2 className="mt-1 truncate text-2xl font-semibold text-white">{displayValue || animatedValue}</h2>
      <p className="mt-2 text-xs text-slate-400">{trendLabel}</p>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20 transition duration-200 hover:border-blue-500/30">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Icon size={17} className="text-blue-400" />
          {title}
        </h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ReportTable({
  title,
  columns,
  rows,
  search,
  setSearch,
  page,
  setPage,
  itemsPerPage,
  sortConfig,
  setSortConfig,
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const paginatedRows = rows.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar..."
            className="h-9 rounded-lg border border-slate-700 bg-slate-950/70 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="p-3 text-left">
                  <button
                    onClick={() => handleSort(column.key)}
                    className="inline-flex items-center gap-1 transition hover:text-blue-300"
                  >
                    {column.label}
                    <span className={sortConfig.key === column.key ? "text-blue-400" : "text-slate-600"}>
                      {sortConfig.key === column.key && sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-500">
                  Sin datos para mostrar
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => (
                <tr key={`${title}-${index}`} className="border-t border-slate-800 transition hover:bg-slate-800/60">
                  {columns.map((column) => (
                    <td key={column.key} className="p-3 text-slate-300">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 p-3 text-sm text-slate-400">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-700 px-3 py-1 transition hover:border-blue-500 hover:text-blue-300"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-lg border border-slate-700 px-3 py-1 transition hover:border-blue-500 hover:text-blue-300"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function ExportButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function ReportsSkeleton() {
  return (
    <div className="theme-aware-page space-y-5 bg-slate-950/95">
      <div className="h-16 animate-pulse rounded-2xl bg-slate-800" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
      Sin datos en este período
    </div>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-sm shadow-xl">
      {label && <p className="mb-1 font-semibold text-slate-200">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color || item.payload?.fill }}>
          {item.name}: Bs {money(item.value)}
        </p>
      ))}
    </div>
  );
}

function PlainTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-sm shadow-xl">
      {label && <p className="mb-1 font-semibold text-slate-200">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey} className="text-blue-300">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

function buildReportData(jobs, expenses, payments, filters) {
  const inPeriod = (item) => isBetweenDates(item.created_at, filters.startDate, filters.endDate);
  const periodJobs = jobs.filter(inPeriod);
  const periodPayments = payments.filter(inPeriod);
  const periodExpenses = expenses.filter(
    (expense) => inPeriod(expense) && (filters.category === "all" || expense.category === filters.category)
  );

  const totalIncome = periodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalExpenses = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const completedJobs = periodJobs.filter((job) => job.status === "paid").length;
  const averageJobValue = periodJobs.length
    ? periodJobs.reduce((sum, job) => sum + Number(job.total || 0), 0) / periodJobs.length
    : 0;
  const mostUsedExpenseCategory = topCategory(periodExpenses);

  const dailyFinancials = groupDailyFinancials(periodPayments, periodExpenses);
  const monthlyProfit = groupMonthlyProfit(payments, expenses, Number(filters.year));
  const expensesByCategory = groupExpensesByCategory(periodExpenses);
  const weeklyActivity = groupWeeklyActivity(periodJobs);
  const topClients = groupTopClients(periodJobs);
  const jobTypes = groupJobTypes(periodJobs);
  const profitableJobs = buildProfitableJobs(periodJobs, periodExpenses);

  return {
    jobs: periodJobs,
    expenses: periodExpenses,
    payments: periodPayments,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    completedJobs,
    averageJobValue,
    mostUsedExpenseCategory,
    dailyFinancials,
    monthlyProfit,
    expensesByCategory,
    weeklyActivity,
    topClients,
    jobTypes,
    profitableJobs,
  };
}

function buildKpis(current, previous) {
  return [
    {
      title: "Total ingresos",
      value: current.totalIncome,
      valueType: "money",
      icon: TrendingUp,
      tone: "green",
      trend: percentChange(current.totalIncome, previous.totalIncome),
      trendLabel: "Pagos recibidos en el período",
    },
    {
      title: "Total gastos",
      value: current.totalExpenses,
      valueType: "money",
      icon: Wallet,
      tone: "red",
      trend: percentChange(current.totalExpenses, previous.totalExpenses),
      trendLabel: "Egresos operativos registrados",
    },
    {
      title: "Ganancia neta",
      value: current.netProfit,
      valueType: "money",
      icon: BarChart3,
      tone: current.netProfit >= 0 ? "blue" : "red",
      trend: percentChange(current.netProfit, previous.netProfit),
      trendLabel: "Ingresos menos gastos",
    },
    {
      title: "Trabajos completos",
      value: current.completedJobs,
      valueType: "number",
      icon: BriefcaseBusiness,
      tone: "orange",
      trend: percentChange(current.completedJobs, previous.completedJobs),
      trendLabel: "Trabajos con estado pagado",
    },
    {
      title: "Valor promedio",
      value: current.averageJobValue,
      valueType: "money",
      icon: Layers3,
      tone: "blue",
      trend: percentChange(current.averageJobValue, previous.averageJobValue),
      trendLabel: "Promedio por trabajo",
    },
    {
      title: "Categoría frecuente",
      value: current.mostUsedExpenseCategory.total,
      displayValue: current.mostUsedExpenseCategory.label,
      icon: PieChartIcon,
      tone: "orange",
      trend: percentChange(current.mostUsedExpenseCategory.total, previous.mostUsedExpenseCategory.total),
      trendLabel: current.mostUsedExpenseCategory.label,
    },
  ];
}

function groupDailyFinancials(payments, expenses) {
  const days = new Map();

  payments.forEach((payment) => {
    const key = formatDate(new Date(payment.created_at));
    const day = days.get(key) || { label: shortDate(key), income: 0, expenses: 0 };
    day.income += Number(payment.amount || 0);
    days.set(key, day);
  });

  expenses.forEach((expense) => {
    const key = formatDate(new Date(expense.created_at));
    const day = days.get(key) || { label: shortDate(key), income: 0, expenses: 0 };
    day.expenses += Number(expense.amount || 0);
    days.set(key, day);
  });

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

function groupMonthlyProfit(payments, expenses, year) {
  return months.map((month, index) => {
    const monthNumber = index + 1;
    const income = payments
      .filter((payment) => sameMonth(payment.created_at, monthNumber, year))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const expenseTotal = expenses
      .filter((expense) => sameMonth(expense.created_at, monthNumber, year))
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return { month: month.slice(0, 3), profit: income - expenseTotal };
  });
}

function groupExpensesByCategory(expenses) {
  const grouped = new Map();

  expenses.forEach((expense) => {
    const category = expense.category || "otros";
    grouped.set(category, (grouped.get(category) || 0) + Number(expense.amount || 0));
  });

  return [...grouped.entries()].map(([category, total]) => ({
    category,
    categoryLabel: categoryLabels[category] || category,
    total,
  }));
}

function groupWeeklyActivity(jobs) {
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const data = labels.map((day) => ({ day, jobs: 0 }));

  jobs.forEach((job) => {
    const day = new Date(job.created_at).getDay();
    data[day].jobs += 1;
  });

  return data;
}

function groupTopClients(jobs) {
  const grouped = new Map();

  jobs.forEach((job) => {
    const name = job.client?.name || "Sin cliente";
    grouped.set(name, (grouped.get(name) || 0) + Number(job.total || 0));
  });

  return [...grouped.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

function groupJobTypes(jobs) {
  const grouped = new Map();

  jobs.forEach((job) => {
    const name = getJobType(job.description);
    grouped.set(name, (grouped.get(name) || 0) + 1);
  });

  return [...grouped.entries()].map(([name, value]) => ({ name, value }));
}

function buildProfitableJobs(jobs, expenses) {
  return jobs
    .map((job) => {
      const income = Number(job.total || 0);
      const jobExpenses = expenses
        .filter((expense) => Number(expense.job_id) === Number(job.id))
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      return {
        description: job.description,
        client: job.client?.name || "-",
        income,
        expenses: jobExpenses,
        profit: income - jobExpenses,
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 20);
}

function topCategory(expenses) {
  const grouped = groupExpensesByCategory(expenses).sort((a, b) => b.total - a.total);
  const top = grouped[0];

  if (!top) {
    return { label: "Sin gastos registrados", total: 0 };
  }

  return { label: top.categoryLabel, total: top.total };
}

function sortRows(rows, sortConfig, getters) {
  return [...rows].sort((a, b) => {
    const aValue = getters[sortConfig.key]?.(a) ?? "";
    const bValue = getters[sortConfig.key]?.(b) ?? "";

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    return sortConfig.direction === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
}

function buildExportRows(data, kpis) {
  const rows = [
    ["Tornería MORALES"],
    ["Fecha", new Date().toLocaleDateString("es-BO")],
    [],
    ["KPIs"],
    ...kpis.map((kpi) => [kpi.title, typeof kpi.value === "number" ? money(kpi.value) : kpi.value, kpi.trendLabel]),
    [],
    ["Gastos"],
    ["Fecha", "Descripción", "Categoría", "Cantidad", "Precio unitario", "Total"],
    ...data.expenses.map((expense) => [
      formatDisplayDate(expense.created_at),
      expense.description,
      categoryLabels[expense.category] || expense.category,
      expense.quantity,
      money(expense.unit_price),
      money(expense.amount),
    ]),
    [],
    ["Trabajos rentables"],
    ["Trabajo", "Cliente", "Ingreso", "Gastos del trabajo", "Ganancia"],
    ...data.profitableJobs.map((job) => [
      job.description,
      job.client,
      money(job.income),
      money(job.expenses),
      money(job.profit),
    ]),
  ];

  return rows;
}

function downloadTableFile(rows, filename, separator, mime) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return separator === "," ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(separator)
    )
    .join("\n");

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportReportToPdf(data, kpis, filters) {
  const element = document.getElementById("reports-dashboard");

  if (!element) {
    toast.error("No se encontró el dashboard para exportar");
    return;
  }

  const toastId = toast.loading("Generando PDF...");

  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 48, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text("Tornería MORALES", margin, 18);
    pdf.setFontSize(12);
    pdf.text("Reporte de análisis y estadísticas del negocio", margin, 28);
    pdf.setFontSize(9);
    pdf.text(`Generado: ${new Date().toLocaleDateString("es-BO")}`, margin, 38);
    pdf.text(`Período: ${filters.startDate} a ${filters.endDate}`, pageWidth - margin, 38, {
      align: "right",
    });

    let y = 58;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(12);
    pdf.text("Resumen ejecutivo", margin, y);
    y += 8;

    kpis.forEach((kpi, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * (contentWidth / 2);
      const cardY = y + row * 20;

      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, cardY, contentWidth / 2 - 4, 15, 2, 2, "FD");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(kpi.title, x + 4, cardY + 5);
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(kpi.displayValue || `Bs ${money(kpi.value)}`, x + 4, cardY + 11);
    });

    y += 66;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#020617",
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    let remainingHeight = imgHeight;
    let sourceY = 0;
    const availableFirstPage = pageHeight - y - margin;
    const pxPerMm = canvas.height / imgHeight;

    const addSlice = (targetY, targetHeightMm) => {
      const sliceHeightPx = Math.min(remainingHeight, targetHeightMm) * pxPerMm;
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const context = sliceCanvas.getContext("2d");

      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHeightMm = sliceHeightPx / pxPerMm;
      pdf.addImage(sliceData, "PNG", margin, targetY, contentWidth, sliceHeightMm);
      sourceY += sliceHeightPx;
      remainingHeight -= sliceHeightMm;
    };

    addSlice(y, availableFirstPage);

    while (remainingHeight > 1) {
      pdf.addPage();
      addSlice(margin, pageHeight - margin * 2);
    }

    pdf.save(`reportes-torneria-morales-${filters.startDate}-${filters.endDate}.pdf`);
    toast.success("PDF generado correctamente", { id: toastId });
  } catch (error) {
    console.error(error);
    toast.error("No se pudo generar el PDF", { id: toastId });
  }
}

function useAnimatedNumber(value, type = "money") {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const numericValue = Number(value || 0);
    const start = display;
    const diff = numericValue - start;
    const startedAt = performance.now();
    const duration = 500;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setDisplay(start + diff * progress);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  if (type === "number") {
    return Math.round(display).toLocaleString("es-BO");
  }

  return `Bs ${money(display)}`;
}

function getPreviousPeriod(filters) {
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days + 1);

  return {
    ...filters,
    startDate: formatDate(previousStart),
    endDate: formatDate(previousEnd),
  };
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function isBetweenDates(value, startDate, endDate) {
  if (!value) return false;
  const date = new Date(value);
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  return date >= start && date <= end;
}

function sameMonth(value, month, year) {
  if (!value) return false;
  const date = new Date(value);
  return date.getMonth() + 1 === Number(month) && date.getFullYear() === Number(year);
}

function dateValue(value) {
  return value ? new Date(value).getTime() : 0;
}

function getJobType(description = "") {
  const text = description.toLowerCase();
  if (text.includes("sold")) return "Soldadura";
  if (text.includes("torno")) return "Torno";
  if (text.includes("fresa")) return "Fresado";
  if (text.includes("rect")) return "Rectificado";
  if (text.includes("pieza")) return "Piezas";
  return "General";
}

function firstDayOfMonth(date) {
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  return value ? new Date(value).toLocaleDateString("es-BO") : "-";
}

function shortDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
  });
}

function money(value) {
  return Number(value || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default Reports;
