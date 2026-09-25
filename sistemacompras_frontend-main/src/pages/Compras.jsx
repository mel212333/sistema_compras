import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import CotizacionesModal from "../components/CotizacionesModal";
import AsignarOcModal from "../components/AsignarOcModal";
import { can, getUserRole } from "../utils/roles";

const asArray = (value) => (Array.isArray(value) ? value : []);

const presupuestosDe = (r) =>
  asArray(r?.presupuestos || r?.cotizaciones || r?.presupuestos_cargados);

const ordenesCompraDe = (r) =>
  asArray(r?.ordenes_compra || r?.ordenesCompra || r?.ordenes || r?.ocs);

const tienePresupuestos = (r) =>
  presupuestosDe(r).length > 0 ||
  Number(r?.presupuestos_count || r?.cantidad_presupuestos || 0) > 0 ||
  Boolean(r?.cotizado);

const tieneOcAsignada = (r) =>
  r?.estado === "FINALIZADO" ||
  ordenesCompraDe(r).length > 0 ||
  Boolean(r?.codigo_oc || r?.oc_asignada);

const uniqueCount = (values) => new Set(values.filter(Boolean).map(String)).size;

const etapaConfig = {
  todos: {
    label: "Todos",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  para_cotizar: {
    label: "Para cotizar",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  cotizado: {
    label: "Cotizados",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  asignar_oc: {
    label: "Listos para OC",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  finalizado: {
    label: "OC asignada",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const etapaPrioridad = {
  para_cotizar: 0,
  cotizado: 1,
  asignar_oc: 2,
  finalizado: 3,
};

function fechaOrden(req) {
  return new Date(req?.fecha_creacion || req?.createdAt || req?.updatedAt || 0).getTime() || 0;
}

function etapaDe(req, cotizacion) {
  const detalleReq = cotizacion?.requerimiento;
  const vista = { ...req, ...(detalleReq || {}) };
  const presupuestos = presupuestosDe(vista);
  const adjudicaciones = asArray(cotizacion?.adjudicaciones);
  const items = asArray(vista.items);
  const itemsAdjudicados = uniqueCount(adjudicaciones.map((a) => a.id_requerimiento_item));

  if (tieneOcAsignada(vista)) return "finalizado";
  if (tienePresupuestos(vista) && items.length > 0 && itemsAdjudicados >= items.length) return "asignar_oc";
  if (tienePresupuestos(vista)) return "cotizado";
  return "para_cotizar";
}

function detalleCompra(req, cotizacion) {
  const detalleReq = cotizacion?.requerimiento;
  const vista = { ...req, ...(detalleReq || {}) };
  const presupuestos = presupuestosDe(vista);
  const adjudicaciones = asArray(cotizacion?.adjudicaciones);
  const items = asArray(vista.items);
  const itemsAdjudicados = uniqueCount(adjudicaciones.map((a) => a.id_requerimiento_item));
  const etapa = etapaDe(req, cotizacion);

  return {
    vista,
    presupuestos,
    items,
    itemsAdjudicados,
    etapa,
    etiqueta: etapaConfig[etapa]?.label || etapa,
    progreso: items.length > 0 ? `${itemsAdjudicados}/${items.length}` : "-",
  };
}

export default function Compras() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [reqs, setReqs] = useState([]);
  const [cotizacionesPorId, setCotizacionesPorId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cotOpen, setCotOpen] = useState(false);
  const [cotReqId, setCotReqId] = useState(null);
  const [ocReqId, setOcReqId] = useState(null);

  const rol = getUserRole(user);
  const puedeUsarCompras = can(user, "gestionarCotizaciones");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = rol === "COMPRAS" ? "/requerimientos/para-compras" : "/requerimientos";
      const data = await apiRequest(endpoint);
      const listaBase = Array.isArray(data) ? data : [];
      const lista = listaBase.filter(
        (req) =>
          ["APROBADO", "FINALIZADO"].includes(req?.estado) ||
          tienePresupuestos(req) ||
          tieneOcAsignada(req)
      );
      setReqs(lista);

      const resultados = await Promise.allSettled(
        lista.map(async (req) => ({
          id: req.id,
          cotizacion: await apiRequest(`/requerimientos/${req.id}/cotizaciones`),
        }))
      );

      const next = {};
      resultados.forEach((res) => {
        if (res.status === "fulfilled") next[res.value.id] = res.value.cotizacion;
      });
      setCotizacionesPorId(next);
    } catch (err) {
      setReqs([]);
      setCotizacionesPorId({});
      setError(err?.message || "No se pudo cargar la bandeja de Compras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeUsarCompras) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeUsarCompras]);

  const filas = useMemo(
    () =>
      reqs.map((req) => ({
        req,
        ...detalleCompra(req, cotizacionesPorId[req.id]),
      })),
    [reqs, cotizacionesPorId]
  );

  const contadores = useMemo(() => {
    const base = { todos: filas.length, para_cotizar: 0, cotizado: 0, asignar_oc: 0, finalizado: 0 };
    filas.forEach((fila) => {
      base[fila.etapa] = (base[fila.etapa] || 0) + 1;
    });
    return base;
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas
      .filter(({ req, vista, etapa }) => {
        if (filtro !== "todos" && etapa !== filtro) return false;
        if (!q) return true;
        return [
          req.id,
          vista.descripcion,
          vista.sector?.nombre,
          vista.usuario?.sector?.nombre,
          vista.planta,
          vista.centro_costo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const prioridad = (etapaPrioridad[a.etapa] ?? 99) - (etapaPrioridad[b.etapa] ?? 99);
        if (prioridad !== 0) return prioridad;
        return fechaOrden(b.vista) - fechaOrden(a.vista) || Number(b.req.id) - Number(a.req.id);
      });
  }, [filas, filtro, busqueda]);

  const abrirCotizacion = (id) => {
    setCotReqId(id);
    setCotOpen(true);
  };

  if (!puedeUsarCompras) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="rounded border bg-white p-6 text-slate-700">
          Solo ADMIN o COMPRAS puede acceder a esta bandeja.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Bandeja operativa</div>
            <h2 className="text-3xl font-bold text-slate-950">Compras</h2>
            <p className="mt-1 text-sm text-slate-600">
              Misma informacion de requerimientos, organizada por trabajo pendiente de compras.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/requerimientos" className="rounded border bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Lista general
            </Link>
            <button
              type="button"
              onClick={cargar}
              className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900"
            >
              Recargar
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Para cotizar</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{loading ? "-" : contadores.para_cotizar}</div>
            <div className="mt-1 text-sm text-slate-500">Aprobados sin presupuesto</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Cotizados</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{loading ? "-" : contadores.cotizado}</div>
            <div className="mt-1 text-sm text-slate-500">Con presupuestos cargados</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Listos para OC</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{loading ? "-" : contadores.asignar_oc}</div>
            <div className="mt-1 text-sm text-slate-500">Adjudicacion completa</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">OC asignada</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{loading ? "-" : contadores.finalizado}</div>
            <div className="mt-1 text-sm text-slate-500">Finalizados</div>
          </div>
        </section>

        <section className="rounded border bg-white">
          <div className="flex flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.entries(etapaConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFiltro(key)}
                  className={`rounded border px-3 py-2 text-sm font-medium transition ${
                    filtro === key
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cfg.label} ({contadores[key] || 0})
                </button>
              ))}
            </div>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm lg:w-80"
              placeholder="Buscar por descripcion, sector, planta..."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="w-20 p-3 text-left">ID</th>
                  <th className="w-28 p-3 text-center">Tipo</th>
                  <th className="p-3 text-left">Descripcion</th>
                  <th className="w-40 p-3 text-left">Sector</th>
                  <th className="w-40 p-3 text-center">Etapa</th>
                  <th className="w-36 p-3 text-center">Adjudicado</th>
                  <th className="w-72 p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Cargando bandeja...</td>
                  </tr>
                )}

                {!loading && filasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay requerimientos en esta vista.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filasFiltradas.map(({ req, vista, presupuestos, etapa, etiqueta, progreso }) => (
                    <tr
                      key={req.id}
                      className="cursor-pointer border-t bg-white align-top hover:bg-slate-50"
                      onClick={() => navigate(`/requerimientos/${req.id}/comparativa`)}
                      title="Abrir comparativa"
                    >
                      <td className="p-3 font-medium text-slate-800">{req.id}</td>
                      <td className="p-3 text-center">
                        {vista.es_express ? (
                          <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Express
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-950">{vista.descripcion}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {presupuestos.length} presupuesto{presupuestos.length === 1 ? "" : "s"} cargado{presupuestos.length === 1 ? "" : "s"}
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">{vista.sector?.nombre || vista.usuario?.sector?.nombre || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${etapaConfig[etapa]?.badge}`}>
                          {etiqueta}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium text-slate-800">{progreso}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/requerimientos/${req.id}/comparativa`);
                            }}
                            className="rounded border bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Comparativa
                          </button>
                          {etapa !== "finalizado" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirCotizacion(req.id);
                              }}
                              className="rounded bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-900"
                            >
                              Cotizar
                            </button>
                          )}
                          {etapa === "asignar_oc" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOcReqId(req.id);
                              }}
                              className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                            >
                              Asignar OC
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <CotizacionesModal
        open={cotOpen}
        requerimientoId={cotReqId}
        onClose={() => {
          setCotOpen(false);
          setCotReqId(null);
          cargar();
        }}
      />
      <AsignarOcModal
        open={Boolean(ocReqId)}
        requerimientoId={ocReqId}
        onClose={(result) => {
          setOcReqId(null);
          if (result?.ocAsignada) cargar();
        }}
      />
    </div>
  );
}
