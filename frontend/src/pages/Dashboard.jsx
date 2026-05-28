import { useEffect, useMemo, useState } from "react";
import {
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
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Factory,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../auth/AuthContext";

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
  general: "General",
};

const jobColors = ["#ef4444", "#f59e0b", "#22c55e"];

function Dashboard() {
  const { user } = useAuth();
  const today = new Date();

  const [data, setData] = useState(null);
  const [incomeData, setIncomeData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const fetchAll = async () => {
    setLoading(true);
    setError("");

    try {
      const [dash, income, pred, expenses, clientsRes, workersRes, debtorsRes, alertsRes] =
        await Promise.all([
          api.get("/dashboard", { params: { month, year } }),
          api.get("/dashboard/income-by-day", { params: { month, year } }),
          api.get("/dashboard/predict"),
          api.get("/dashboard/expenses-by-category", { params: { month, year } }),
          api.get("/dashboard/top-clients", { params: { month, year } }),
          api.get("/dashboard/top-workers", { params: { month, year } }),
          api.get("/dashboard/debtors"),
          api.get("/dashboard/alerts"),
        ]);

      setData(dash.data);
      setIncomeData(income.data);
      setPrediction(pred.data.prediction);
      setExpenseCategories(expenses.data);
      setTopClients(clientsRes.data);
      setTopWorkers(workersRes.data);
      setDebtors(debtorsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user, month, year]);

  const financialData = useMemo(
    () => [
      { name: "Ingresos", value: Number(data?.income || 0), fill: "#22c55e" },
      { name: "Gastos", value: Number(data?.expenses_month || 0), fill: "#ef4444" },
      { name: "Pendiente", value: Number(data?.pending || 0), fill: "#f59e0b" },
    ],
    [data]
  );

  const jobsData = useMemo(
    () => [
      { name: "Pendientes", value: data?.jobs?.pending || 0 },
      { name: "Crédito", value: data?.jobs?.credit || 0 },
      { name: "Pagados", value: data?.jobs?.paid || 0 },
    ],
    [data]
  );

  const profit = Number(data?.profit || 0);
  const income = Number(data?.income || 0);
  const profitMargin = income ? (profit / income) * 100 : 0;
  const debtTotal = debtors.reduce((sum, debtor) => sum + Number(debtor.debt || 0), 0);
  const completedJobs = Number(data?.jobs?.paid || 0);
  const totalJobs =
    Number(data?.jobs?.pending || 0) + Number(data?.jobs?.credit || 0) + completedJobs;
  const completionRate = totalJobs ? (completedJobs / totalJobs) * 100 : 0;
  const operationalInsights = useMemo(() => buildOperationalInsights(alerts), [alerts]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-6 text-red-100">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <button
          onClick={fetchAll}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          <RefreshCcw size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="theme-aware-page space-y-5 rounded-2xl bg-slate-950/95 p-4 text-slate-100 shadow-xl shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-300">
            <Factory size={15} />
            Tornería MORALES
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white">
            Dashboard operativo
          </h1>
          <p className="text-sm text-slate-400">
            Estado rápido del negocio, caja, trabajos y alertas principales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
          >
            {months.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
          >
            {[2025, 2026, 2027].map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setMonth(today.getMonth() + 1);
              setYear(today.getFullYear());
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <CalendarDays size={16} />
            Este mes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <ExecutivePanel
          income={income}
          profit={profit}
          profitMargin={profitMargin}
          prediction={prediction}
          debtTotal={debtTotal}
          completionRate={completionRate}
        />
        <AlertsPanel insights={operationalInsights} totalAlerts={alerts.length} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Ingresos" value={data.income} icon={CircleDollarSign} tone="green" />
        <MetricCard title="Gastos hoy" value={data.expenses_today} icon={Wallet} tone="red" />
        <MetricCard title="Gastos mes" value={data.expenses_month} icon={CreditCard} tone="orange" />
        <MetricCard title="Ganancia" value={data.profit} icon={TrendingUp} tone={profit >= 0 ? "blue" : "red"} />
        <MetricCard title="Por cobrar" value={data.pending || 0} icon={Clock3} tone="yellow" />
        <MetricCard title="Predicción" value={prediction ?? 0} icon={Banknote} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Resumen financiero" subtitle="Ingresos, gastos y pendiente por cobrar">
          {financialData.every((item) => item.value === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {financialData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Ingresos por día" subtitle={`Movimiento de ${months[month - 1]}`}>
          {incomeData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeData.map((item) => ({ ...item, label: shortDate(item.date) }))}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip content={<MoneyTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Ingresos"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estado de trabajos" subtitle="Pendientes, crédito y pagados">
          {jobsData.every((item) => item.value === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={98}
                  paddingAngle={4}
                >
                  {jobsData.map((entry, index) => (
                    <Cell key={entry.name} fill={jobColors[index]} />
                  ))}
                </Pie>
                <Tooltip content={<PlainTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Gastos por categoría" subtitle="Distribución operativa del mes">
          {expenseCategories.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories.map((item) => ({
                    ...item,
                    label: categoryLabels[item.category] || item.category,
                  }))}
                  dataKey="total"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={98}
                  paddingAngle={4}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell
                      key={entry.category || index}
                      fill={["#3b82f6", "#f59e0b", "#64748b", "#22c55e"][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RankingCard
          title="Top clientes"
          icon={Users}
          data={topClients}
          empty="Sin clientes en este período"
          tone="blue"
        />
        <RankingCard
          title="Top trabajadores"
          icon={BriefcaseBusiness}
          data={topWorkers}
          empty="Sin trabajadores en este período"
          tone="green"
        />
        <DebtorsCard debtors={debtors} />
      </div>
    </div>
  );
}

function ExecutivePanel({ income, profit, profitMargin, prediction, debtTotal, completionRate }) {
  const healthyProfit = profit >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
      <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Vista ejecutiva</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Bs {money(income)}</h2>
          <p className="text-sm text-slate-400">Ingresos confirmados del período seleccionado</p>
        </div>
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            healthyProfit
              ? "border-green-500/20 bg-green-500/10 text-green-300"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          <span className="flex items-center gap-1 font-semibold">
            {healthyProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            Margen {profitMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Ganancia neta" value={`Bs ${money(profit)}`} tone={healthyProfit ? "green" : "red"} />
        <MiniStat label="Predicción" value={`Bs ${money(prediction || 0)}`} tone="blue" />
        <MiniStat label="Deuda clientes" value={`Bs ${money(debtTotal)}`} tone="orange" />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Avance de trabajos pagados</span>
          <span className="font-semibold text-slate-100">{completionRate.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ insights, totalAlerts }) {
  const hasCriticalInsights = insights.some((item) => item.count > 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <AlertTriangle size={17} className="text-orange-400" />
          Resumen crítico
        </h2>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {totalAlerts}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {!hasCriticalInsights ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
            Sin puntos críticos por ahora.
          </div>
        ) : (
          insights.map((item) => (
            <div
              key={item.type}
              className={`rounded-xl border bg-slate-950/50 p-3 text-sm transition ${item.border}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.badge}`}>
                  {item.count}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function buildOperationalInsights(alerts) {
  const highDebtCount = alerts.filter(
    (alert) => alert.type === "debt" && ["high", "medium"].includes(alert.level)
  ).length;
  const delayedJobsCount = alerts.filter((alert) => alert.type === "delay").length;
  const highExpenseCount = alerts.filter((alert) => alert.type === "expense").length;

  return [
    {
      type: "debt",
      count: highDebtCount,
      title: "Clientes con deuda alta",
      description: "Conviene priorizar llamadas o cobros antes de tomar más trabajos a crédito.",
      badge: highDebtCount > 0 ? "bg-red-500/10 text-red-300" : "bg-slate-800 text-slate-400",
      border: highDebtCount > 0 ? "border-red-500/30" : "border-slate-800",
    },
    {
      type: "delay",
      count: delayedJobsCount,
      title: "Trabajos atrasados",
      description: "Trabajos pendientes o a crédito que llevan varios días sin cerrarse.",
      badge: delayedJobsCount > 0 ? "bg-orange-500/10 text-orange-300" : "bg-slate-800 text-slate-400",
      border: delayedJobsCount > 0 ? "border-orange-500/30" : "border-slate-800",
    },
    {
      type: "expense",
      count: highExpenseCount,
      title: "Gastos elevados",
      description: "Se detectaron gastos por encima del umbral configurado.",
      badge: highExpenseCount > 0 ? "bg-blue-500/10 text-blue-300" : "bg-slate-800 text-slate-400",
      border: highExpenseCount > 0 ? "border-blue-500/30" : "border-slate-800",
    },
  ];
}

function MetricCard({ title, value, icon: Icon, tone }) {
  const colors = {
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    purple: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/10 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl border p-2 ${colors[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 text-xs uppercase text-slate-500">{title}</p>
      <h3 className="mt-1 text-xl font-semibold text-white">Bs {money(value)}</h3>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20 transition hover:border-blue-500/30">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-3 w-full" style={{ height: 285, minHeight: 285 }}>
        {children}
      </div>
    </div>
  );
}

function RankingCard({ title, icon: Icon, data, empty, tone }) {
  const max = Math.max(...data.map((item) => Number(item.total || 0)), 1);
  const barColor = tone === "green" ? "bg-green-500" : "bg-blue-500";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Icon size={17} className={tone === "green" ? "text-green-400" : "text-blue-400"} />
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {data.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-500">
            {empty}
          </p>
        ) : (
          data.map((item, index) => (
            <div key={`${item.name}-${index}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-300">{item.name}</span>
                <span className="font-semibold text-slate-100">Bs {money(item.total)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${(Number(item.total || 0) / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DebtorsCard({ debtors }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Clock3 size={17} className="text-orange-400" />
        Deudores principales
      </h3>
      <div className="mt-4 max-h-[260px] space-y-2 overflow-y-auto pr-1">
        {debtors.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-500">
            No hay deudas pendientes.
          </p>
        ) : (
          debtors.slice(0, 8).map((debtor) => (
            <div
              key={debtor.client_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm transition hover:border-orange-500/40"
            >
              <span className="truncate text-slate-300">{debtor.client}</span>
              <span className="font-semibold text-red-300">Bs {money(debtor.debt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const colors = {
    green: "text-green-300",
    red: "text-red-300",
    blue: "text-blue-300",
    orange: "text-orange-300",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="theme-aware-page space-y-5 rounded-2xl bg-slate-950/95 p-4">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
      Sin datos para este período
    </div>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-sm shadow-xl">
      {label && <p className="mb-1 font-semibold text-slate-200">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} style={{ color: item.color || item.payload?.fill }}>
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
        <p key={item.name} className="text-blue-300">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

function alertTone(level) {
  const tones = {
    high: "bg-red-500/10 text-red-300",
    medium: "bg-orange-500/10 text-orange-300",
    low: "bg-blue-500/10 text-blue-300",
  };

  return tones[level] || "bg-slate-800 text-slate-300";
}

function shortDate(value) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "2-digit",
      })
    : "-";
}

function money(value) {
  return Number(value || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default Dashboard;
