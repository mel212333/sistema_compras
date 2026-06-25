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

  const role = getUserRole(user);
  const roleName = roleLabels[role] || role;

  useEffect(() => {
    const endpoint = role === "COMPRAS" ? "/requerimientos/para-compras" : "/requerimientos";
    setLoading(true);
    apiRequest(endpoint)
      .then((data) => setReqs(Array.isArray(data) ? data : []))
      .catch(() => setReqs([]))
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
    <div className="min-h-full bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Inicio</div>
                <h2 className="mt-1 text-3xl font-semibold text-slate-950">
                  Hola, {user?.name || user?.nombre || "Usuario"}
                </h2>
                <p className="mt-2 max-w-3xl text-slate-600">
                  {roleCopy[role] || "Gestiona tus tareas dentro del sistema de compras."}
                </p>
              </div>
              <div className="rounded border bg-slate-50 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-900">{roleName}</div>
                <div className="text-slate-500">Sector: {user?.sector?.nombre || "Sin sector"}</div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex min-h-[104px] items-center justify-between gap-4 rounded border bg-white p-5">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">Pendiente principal</div>
                <div className="mt-2 text-sm text-slate-500">
                  {role === "COMPRAS" ? "Aprobados para cotizar" : "Requieren atencion"}
                </div>
              </div>
              <div className="shrink-0 text-4xl font-semibold leading-none text-slate-950">{loading ? "-" : pendientesClave}</div>
            </div>
            <div className="flex min-h-[104px] items-center justify-between gap-4 rounded border bg-white p-5">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">Total visible</div>
                <div className="mt-2 text-sm text-slate-500">Segun tu rol y permisos</div>
              </div>
              <div className="shrink-0 text-4xl font-semibold leading-none text-slate-950">{loading ? "-" : reqs.length}</div>
            </div>
            <div className="flex min-h-[104px] items-center justify-between gap-4 rounded border bg-white p-5">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">Finalizados</div>
                <div className="mt-2 text-sm text-slate-500">Con OC asignada</div>
              </div>
              <div className="shrink-0 text-4xl font-semibold leading-none text-slate-950">{loading ? "-" : counters.FINALIZADO || 0}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded border bg-white">
              <div className="border-b px-5 py-4">
                <div className="font-semibold text-slate-900">Resumen por estado</div>
                <div className="text-sm text-slate-500">Vista adaptada a tu rol</div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {states.map((state) => (
                  <Link
                    key={state}
                    to="/requerimientos"
                    className={`rounded border p-4 transition hover:shadow-sm ${stateClass[state] || "bg-white"}`}
                  >
                    <div className="text-sm font-semibold">{stateLabels[state] || state}</div>
                    <div className="mt-2 text-2xl font-semibold">{loading ? "-" : counters[state] || 0}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded border bg-white">
              <div className="border-b px-5 py-4">
                <div className="font-semibold text-slate-900">Accesos rapidos</div>
                <div className="text-sm text-slate-500">Atajos recomendados</div>
              </div>
              <div className="space-y-3 p-5">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={`block rounded border p-4 transition hover:shadow-sm ${
                      action.primary ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800"
                    }`}
                  >
                    <div className="font-semibold">{action.label}</div>
                    <div className={`mt-1 text-sm ${action.primary ? "text-slate-300" : "text-slate-500"}`}>
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
