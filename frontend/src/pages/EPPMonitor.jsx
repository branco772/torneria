import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  HardHat,
  Image,
  Radio,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Video,
  VideoOff,
} from "lucide-react";
import api from "../api/api";

const apiBaseUrl = api.defaults.baseURL?.replace(/\/$/, "") || "http://localhost:8000";

function EPPMonitor() {
  const [evidence, setEvidence] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    detections: 0,
    violations: 0,
    evidence_count: 0,
    compliance: 0,
    risk: "Bajo",
  });
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMonitorData = async () => {
    try {
      const [evidenceRes, statsRes, eventsRes, statusRes] = await Promise.all([
        api.get("/epp/evidence"),
        api.get("/epp/stats"),
        api.get("/epp/events", { params: { limit: 20 } }),
        api.get("/epp/status"),
      ]);

      setEvidence(evidenceRes.data);
      setStats(statsRes.data);
      setEvents(eventsRes.data);
      setCameraOn(Boolean(statusRes.data?.camera_on));
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudo sincronizar el módulo EPP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      setCameraOn(false);
      api.post("/epp/stop").catch(() => undefined);
    };
  }, []);

  const handleCameraToggle = async () => {
    if (cameraBusy) return;

    setCameraBusy(true);

    try {
      if (cameraOn) {
        setCameraOn(false);
        await api.post("/epp/stop");
      } else {
        await api.post("/epp/start");
        setCameraOn(true);
      }

      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado de la cámara EPP.");
      setCameraOn(false);
    } finally {
      setCameraBusy(false);
    }
  };

  const recentViolations = useMemo(
    () =>
      (events.length ? events : evidence).slice(0, 5).map((item) => ({
        ...item,
        label: getEventLabel(item.event_type || item.filename),
        time: item.created_at ? new Date(item.created_at).toLocaleString("es-BO") : getEvidenceTime(item.filename),
      })),
    [events, evidence]
  );

  const risk = getRiskProfile(stats.risk, stats.compliance);
  const compliance = Number(stats.compliance || 0);
  const violationRate = stats.detections
    ? (Number(stats.violations || 0) / Number(stats.detections || 1)) * 100
    : 0;

  if (loading) {
    return <EppSkeleton />;
  }

  return (
    <div className="theme-aware-page space-y-5 rounded-2xl bg-slate-950/95 p-4 text-slate-100 shadow-xl shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-300">
            <ShieldCheck size={15} />
            Seguridad industrial
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white">
            Monitoreo de EPP
          </h1>
          <p className="text-sm text-slate-400">
            Supervisión visual de cumplimiento de equipos de protección personal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill cameraOn={cameraOn} />
          <button
            onClick={fetchMonitorData}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-200"
          >
            <RefreshCcw size={16} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <CameraPanel cameraOn={cameraOn} cameraBusy={cameraBusy} onToggleCamera={handleCameraToggle} />
        <SafetySummary
          stats={stats}
          risk={risk}
          compliance={compliance}
          violationRate={violationRate}
          lastUpdate={lastUpdate}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Detecciones"
          value={stats.detections}
          subtitle="Frames analizados"
          icon={Eye}
          tone="blue"
        />
        <MetricCard
          title="Infracciones"
          value={stats.violations}
          subtitle={`${violationRate.toFixed(1)}% de frames analizados`}
          icon={ShieldAlert}
          tone="red"
        />
        <MetricCard
          title="Cumplimiento"
          value={`${compliance}%`}
          subtitle="Uso correcto detectado"
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          title="Nivel de riesgo"
          value={risk.label}
          subtitle={risk.description}
          icon={AlertTriangle}
          tone={risk.tone}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.35fr]">
        <ViolationsPanel violations={recentViolations} />
        <EvidenceGallery
          evidence={evidence}
          selectedEvidence={selectedEvidence}
          setSelectedEvidence={setSelectedEvidence}
        />
      </div>

      {selectedEvidence && (
        <EvidenceModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      )}
    </div>
  );
}

function CameraPanel({ cameraOn, cameraBusy, onToggleCamera }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Camera size={17} className="text-blue-400" />
            Cámara principal
          </h2>
          <p className="text-xs text-slate-500">Stream de inspección con detección IA</p>
        </div>

        <button
          onClick={onToggleCamera}
          disabled={cameraBusy}
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition ${
            cameraOn ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {cameraOn ? <VideoOff size={16} /> : <Video size={16} />}
          {cameraBusy ? "Cambiando..." : cameraOn ? "Apagar cámara" : "Encender cámara"}
        </button>
      </div>

      <div className="relative bg-slate-950">
        {cameraOn ? (
          <img
            src={`${apiBaseUrl}/epp/video`}
            alt="Stream de monitoreo EPP"
            className="h-[460px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[460px] flex-col items-center justify-center gap-3 text-slate-500">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <VideoOff size={36} />
            </div>
            <p className="text-sm">Cámara apagada</p>
          </div>
        )}

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <span className={`h-2 w-2 rounded-full ${cameraOn ? "animate-pulse bg-red-500" : "bg-slate-500"}`} />
          {cameraOn ? "EN VIVO" : "STANDBY"}
        </div>

        <div className="absolute bottom-4 left-4 rounded-xl bg-black/55 px-3 py-2 text-xs text-slate-200 backdrop-blur">
          Modelo YOLO · inspección EPP
        </div>
      </div>
    </div>
  );
}

function SafetySummary({ stats, risk, compliance, violationRate, lastUpdate }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <HardHat size={17} className="text-orange-400" />
            Resumen de seguridad
          </h2>
          <p className="mt-1 text-xs text-slate-500">Indicadores actualizados en tiempo real</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${risk.badge}`}>
          Riesgo {risk.label}
        </span>
      </div>

      <div className="mt-6 flex justify-center">
        <ComplianceGauge value={compliance} risk={risk} />
      </div>

      <div className="mt-6 space-y-4">
        <ProgressRow label="Cumplimiento EPP" value={compliance} color="bg-green-500" />
        <ProgressRow label="Tasa de infracción" value={violationRate} color="bg-red-500" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniStat label="Detecciones" value={stats.detections} />
        <MiniStat label="Evidencias" value={stats.evidence_count ?? stats.violations} />
      </div>

      <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
        <Clock3 size={14} />
        Última actualización: {lastUpdate ? lastUpdate.toLocaleTimeString("es-BO") : "-"}
      </p>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, tone }) {
  const styles = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/10 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40">
      <div className={`inline-flex rounded-xl border p-2 ${styles[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xs uppercase text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-semibold text-white">{value}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

function ViolationsPanel({ violations }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <AlertTriangle size={17} className="text-red-400" />
          Eventos recientes
        </h2>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {violations.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {violations.length === 0 ? (
          <EmptyState icon={ShieldCheck} text="No hay infracciones recientes registradas." />
        ) : (
          violations.map((item) => (
            <div
              key={item.id ?? item.filename}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 transition hover:border-red-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">
                  Evidencia
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EvidenceGallery({ evidence, selectedEvidence, setSelectedEvidence }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Image size={17} className="text-blue-400" />
            Evidencias recientes
          </h2>
          <p className="text-xs text-slate-500">Capturas generadas por detecciones de incumplimiento</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {evidence.length} archivos
        </span>
      </div>

      {evidence.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Image} text="Todavía no hay evidencias guardadas." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evidence.map((item) => (
            <button
              key={item.filename}
              onClick={() => setSelectedEvidence(item)}
              className={`group overflow-hidden rounded-xl border bg-slate-950/50 text-left transition hover:-translate-y-0.5 hover:border-blue-500/50 ${
                selectedEvidence?.filename === item.filename ? "border-blue-500" : "border-slate-800"
              }`}
            >
              <div className="relative">
                <img
                  src={`${apiBaseUrl}${item.url}`}
                  alt={item.filename}
                  className="h-36 w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Ver evidencia
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-slate-200">
                  {getEventLabel(item.event_type || item.filename)}
                </p>
                <p className="text-xs text-slate-500">
                  {item.created_at ? new Date(item.created_at).toLocaleString("es-BO") : getEvidenceTime(item.filename)}
                </p>
                {item.confidence !== null && item.confidence !== undefined && (
                  <p className="mt-1 text-xs text-blue-300">Confianza {Number(item.confidence).toFixed(1)}%</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceModal({ evidence, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {getEventLabel(evidence.event_type || evidence.filename)}
            </h3>
            <p className="text-xs text-slate-500">{evidence.filename}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 transition hover:border-blue-500"
          >
            Cerrar
          </button>
        </div>
        <img
          src={`${apiBaseUrl}${evidence.url}`}
          alt={evidence.filename}
          className="max-h-[75vh] w-full object-contain"
        />
      </div>
    </div>
  );
}

function ComplianceGauge({ value, risk }) {
  const clamped = Math.max(0, Math.min(Number(value || 0), 100));

  return (
    <div
      className="grid h-44 w-44 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${risk.color} ${clamped * 3.6}deg, #1e293b 0deg)`,
      }}
    >
      <div className="grid h-32 w-32 place-items-center rounded-full bg-slate-900">
        <div className="text-center">
          <p className="text-3xl font-semibold text-white">{clamped}%</p>
          <p className="text-xs text-slate-500">cumplimiento</p>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, color }) {
  const width = Math.max(0, Math.min(Number(value || 0), 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-slate-100">{width.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ cameraOn }) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200">
      <Radio size={16} className={cameraOn ? "text-red-400" : "text-slate-500"} />
      {cameraOn ? "Monitoreando" : "Cámara inactiva"}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-center text-sm text-slate-500">
      <Icon size={28} className="mb-2" />
      {text}
    </div>
  );
}

function EppSkeleton() {
  return (
    <div className="theme-aware-page space-y-5 rounded-2xl bg-slate-950/95 p-4">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="h-[540px] animate-pulse rounded-2xl bg-slate-800" />
        <div className="h-[540px] animate-pulse rounded-2xl bg-slate-800" />
      </div>
    </div>
  );
}

function getRiskProfile(risk, compliance) {
  const normalized = String(risk || "").toLowerCase();

  if (normalized.includes("alto") || compliance < 60) {
    return {
      label: "Alto",
      tone: "red",
      color: "#ef4444",
      badge: "bg-red-500/10 text-red-300",
      description: "Requiere atención inmediata",
    };
  }

  if (normalized.includes("medio") || compliance < 85) {
    return {
      label: "Medio",
      tone: "orange",
      color: "#f59e0b",
      badge: "bg-orange-500/10 text-orange-300",
      description: "Monitoreo preventivo activo",
    };
  }

  return {
    label: "Bajo",
    tone: "green",
    color: "#22c55e",
    badge: "bg-green-500/10 text-green-300",
    description: "Condición operativa estable",
  };
}

function getEventLabel(value = "") {
  const eventType = String(value);
  const labels = {
    no_glasses: "Sin lentes de seguridad",
    no_safety_glasses: "Sin lentes de seguridad",
    no_helmet: "Sin casco",
    no_gloves: "Sin guantes",
    no_vest: "Sin chaleco",
  };

  const match = Object.keys(labels).find((key) => eventType.startsWith(key));

  if (match) return labels[match];

  const raw = eventType.replace(/\.(jpg|jpeg|png)$/i, "").replace(/_\d{8}_\d{6}.*/, "");

  return raw ? raw.replace(/-/g, " ").replace(/_/g, " ") : "Incumplimiento EPP";
}

function getEvidenceTime(filename = "") {
  const match = filename.match(/(\d{8})_(\d{6})/);

  if (!match) return "Fecha no disponible";

  const [, date, time] = match;
  const parsed = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)) - 1,
    Number(date.slice(6, 8)),
    Number(time.slice(0, 2)),
    Number(time.slice(2, 4)),
    Number(time.slice(4, 6))
  );

  return parsed.toLocaleString("es-BO");
}

export default EPPMonitor;
