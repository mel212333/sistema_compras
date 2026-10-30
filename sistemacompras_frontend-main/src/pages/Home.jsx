import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { getUserRole, roleLabels } from "../utils/roles";

const roleCopy = {
  ADMIN: "Vista general del sistema, usuarios, compras y seguimiento de requerimientos.",
  USER: "Crea requerimientos, consulta su avance y revisa lo que tenes en borrador.",
  APROBADOR_N1: "Revisa solicitudes pendientes de primera aprobacion y el historial del circuito.",
  APROBADOR_N2: "Revisa solicitudes pendientes de segunda aprobacion antes de pasar a Compras.",
  COMPRAS: "Cotiza, compara presupuestos, adjudica proveedores y asigna ordenes de compra.",
  DEPOSITO: "Consulta requerimientos vinculados a deposito y recepcion de materiales.",
};

const stateLabels = {
  BORRADOR: "Borradores",
  PEND_APROB_N1: "Pend. aprobacion N1",
  PEND_APROB_N2: "Pend. aprobacion N2",
  APROBADO: "En Compras",
  FINALIZADO: "OC asignada",
  RECHAZADO: "Rechazados",
};

const stateClass = {
  BORRADOR: "bg-slate-100 text-slate-700 border-slate-200",
  PEND_APROB_N1: "bg-amber-50 text-amber-800 border-amber-200",
  PEND_APROB_N2: "bg-orange-50 text-orange-800 border-orange-200",
  APROBADO: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FINALIZADO: "bg-indigo-50 text-indigo-800 border-indigo-200",
  RECHAZADO: "bg-rose-50 text-rose-800 border-rose-200",
};

const visibleStatesByRole = {
  ADMIN: ["BORRADOR", "PEND_APROB_N1", "PEND_APROB_N2", "APROBADO", "FINALIZADO"],
  USER: ["BORRADOR", "PEND_APROB_N1", "PEND_APROB_N2", "APROBADO", "FINALIZADO"],
  APROBADOR_N1: ["PEND_APROB_N1", "PEND_APROB_N2", "APROBADO", "FINALIZADO"],
  APROBADOR_N2: ["PEND_APROB_N2", "APROBADO", "FINALIZADO"],
  COMPRAS: ["APROBADO", "FINALIZADO"],
  DEPOSITO: ["FINALIZADO"],
};

function countByState(reqs) {
  return reqs.reduce((acc, req) => {
    acc[req.estado] = (acc[req.estado] || 0) + 1;
    return acc;
  }, {});
}

function actionSet(role) {
  const base = [
    {
      label: "Ver requerimientos",
      to: "/requerimientos",
      description: "Abrir la grilla general y consultar estados.",
      primary: true,
    },
  ];

  if (role === "ADMIN") {
    return [
      ...base,
      { label: "Administrar usuarios", to: "/usuarios", description: "Alta, edicion y baja de usuarios." },
      { label: "Compras", to: "/compras", description: "Acceso directo al area de compras." },
    ];
  }

  if (role === "COMPRAS") {
    return [
      ...base,
      { label: "Bandeja Compras", to: "/compras", description: "Ver aprobados y continuar presupuestos." },
    ];
  }

  if (role === "DEPOSITO") {
    return [
      ...base,
      { label: "Seguimiento Deposito", to: "/deposito", description: "Controlar compras con OC asignada." },
    ];
  }

  if (role === "USER") {
    return [
      ...base,
      { label: "Nuevo requerimiento", to: "/requerimientos", description: "Crear una solicitud normal o express." },
    ];
  }

  return base;
}

export default function Home() {
  const { user } = useAuthContext();
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = getUserRole(user);
  const roleName = roleLabels[role] || role;

  useEffect(() => {
    const endpoint = role === "COMPRAS" ? "/requerimientos/para-compras" : "/requerimientos";
    setLoading(true);
    setError("");
    apiRequest(endpoint)
      .then((data) => setReqs(Array.isArray(data) ? data : []))
      .catch(() => {
        setReqs([]);
        setError("No pudimos cargar el resumen. Podés consultar tus requerimientos desde los accesos rápidos.");
      })
      .finally(() => setLoading(false));
  }, [role]);

  const counters = useMemo(() => countByState(reqs), [reqs]);
  const states = visibleStatesByRole[role] || visibleStatesByRole.USER;
  const actions = actionSet(role);
  const pendientesClave = role === "COMPRAS"
    ? counters.APROBADO || 0
    : role === "APROBADOR_N1"
      ? counters.PEND_APROB_N1 || 0
      : role === "APROBADOR_N2"
        ? counters.PEND_APROB_N2 || 0
        : counters.BORRADOR || 0;

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section
            className="relative isolate overflow-hidden rounded-2xl bg-slate-950 bg-cover bg-center p-6 text-white shadow-lg sm:p-8 lg:p-10"
            style={{ backgroundImage: "linear-gradient(90deg, rgba(8, 25, 55, 0.94), rgba(8, 25, 55, 0.65)), url('/ingenio-rio-grande-login.webp')" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                  Ingenio Río Grande · Sistema de Compras
                </div>
                <h2 className="mt-5 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                  Hola, {user?.name || user?.nombre || "Usuario"}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
                  {roleCopy[role] || "Gestiona tus tareas dentro del sistema de compras."}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
                <div className="font-semibold text-white">{roleName}</div>
                <div className="mt-1 text-slate-200">Sector: {user?.sector?.nombre || "Sin sector"}</div>
              </div>
            </div>
            <Link to="/requerimientos" className="mt-7 inline-flex items-center gap-3 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300">
              Ir a requerimientos <span aria-hidden="true">→</span>
            </Link>
          </section>

          {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex min-h-[120px] items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">Pendiente principal</div>
                <div className="mt-2 text-sm text-slate-500">
                  {role === "COMPRAS" ? "Aprobados para cotizar" : "Requieren atencion"}
                </div>
              </div>
              <div className="shrink-0 text-4xl font-semibold leading-none tracking-tight text-indigo-700">{loading || error ? "—" : pendientesClave}</div>
            </div>
            <div className="flex min-h-[120px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">Total visible</div>
                <div className="mt-2 text-sm text-slate-500">Segun tu rol y permisos</div>
              </div>
              <div className="shrink-0 text-4xl font-semibold leading-none tracking-tight text-slate-900">{loading || error ? "—" : reqs.length}</div>
            </div>
            <div className="flex min-h-[120px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">Finalizados</div>
                <div className="mt-2 text-sm text-slate-500">Con OC asignada</div>
              </div>
              <div className="shrink-0 text-4xl font-semibold leading-none tracking-tight text-slate-900">{loading || error ? "—" : counters.FINALIZADO || 0}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5">
                <div className="font-semibold text-slate-900">Resumen por estado</div>
                <div className="text-sm text-slate-500">Vista adaptada a tu rol</div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {states.map((state) => (
                  <Link
                    key={state}
                    to="/requerimientos"
                    className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${stateClass[state] || "bg-white"}`}
                  >
                    <div className="text-sm font-semibold">{stateLabels[state] || state}</div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <span className="text-3xl font-semibold tracking-tight">{loading || error ? "—" : counters[state] || 0}</span>
                      <span aria-hidden="true" className="text-lg opacity-60">↗</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5">
                <div className="font-semibold text-slate-900">Accesos rápidos</div>
                <div className="text-sm text-slate-500">Tu espacio de trabajo</div>
              </div>
              <div className="space-y-3 p-5">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={`group block rounded-xl border p-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                      action.primary ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700" : "border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 font-semibold">{action.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></div>
                    <div className={`mt-1 text-sm leading-relaxed ${action.primary ? "text-indigo-100" : "text-slate-500"}`}>
                      {action.description}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
  );
}
