import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import { can } from "../utils/roles";
import ProviderRatingModal from "../components/ProviderRatingModal";

const TRACKING_KEY = "deposito-seguimiento";
const RATINGS_KEY = "provider-ratings";

const asArray = (value) => (Array.isArray(value) ? value : []);

const ordenesCompraDe = (r) =>
  asArray(r?.ordenes_compra || r?.ordenesCompra || r?.ordenes || r?.ocs);

const tieneOcAsignada = (r) =>
  r?.estado === "FINALIZADO" ||
  ordenesCompraDe(r).length > 0 ||
  Boolean(r?.codigo_oc || r?.oc_asignada);

const estadoRecepcion = {
  pendiente: {
    label: "Pendiente",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  parcial: {
    label: "Parcial",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  recibido: {
    label: "Recibido",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

function loadTracking() {
  try {
    return JSON.parse(localStorage.getItem(TRACKING_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveTracking(data) {
  localStorage.setItem(TRACKING_KEY, JSON.stringify(data));
}

function ocLabel(req) {
  const ordenes = ordenesCompraDe(req)
    .map((oc) => oc.codigo_oc || oc.codigo || oc.numero || oc.id)
    .filter(Boolean);

  if (ordenes.length > 0) return ordenes.join(", ");
  return req.codigo_oc || "-";
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^#/, "");
}

export default function Deposito() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [reqs, setReqs] = useState([]);
  const [detallePorId, setDetallePorId] = useState({});
  const [ordenesPorId, setOrdenesPorId] = useState({});
  const [tracking, setTracking] = useState(() => loadTracking());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedReqForRating, setSelectedReqForRating] = useState(null);
  const [selectedProviderForRating, setSelectedProviderForRating] = useState(null);
  const [ratingSavingLoading, setRatingSavingLoading] = useState(false);

  const puedeUsarDeposito = can(user, "seguimientoDeposito");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/requerimientos");
      const lista = (Array.isArray(data) ? data : []).filter(tieneOcAsignada);
      setReqs(lista);

      const resultados = await Promise.allSettled(
        lista.map(async (req) => ({
          id: req.id,
          detalle: await apiRequest(`/requerimientos/${req.id}`),
          ordenes: await apiRequest(`/ordenes-compra/requerimiento/${req.id}`),
        }))
      );

      const next = {};
      const nextOrdenes = {};
      resultados.forEach((res) => {
        if (res.status === "fulfilled") {
          next[res.value.id] = res.value.detalle;
          nextOrdenes[res.value.id] = res.value.ordenes?.codigos || [];
        }
      });
      setDetallePorId(next);
      setOrdenesPorId(nextOrdenes);
    } catch (err) {
      setReqs([]);
      setDetallePorId({});
      setOrdenesPorId({});
      setError(err?.message || "No se pudo cargar el seguimiento de deposito");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeUsarDeposito) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeUsarDeposito]);

  const getDefaultRatingProvider = (fila) => {
    const providers = fila?.vista?.presupuestos || [];
    if (providers.length > 0) return providers[0];
    if (fila?.vista?.proveedor) return fila.vista.proveedor;
    if (fila?.req?.proveedor) return fila.req.proveedor;
    return null;
  };

  const actualizarTracking = (id, patch) => {
    // Si el nuevo estado es "recibido", abre el modal de calificación
    if (patch.estado === "recibido") {
      const fila = filas.find((f) => f.req.id === id);
      if (fila) {
        const defaultProvider = getDefaultRatingProvider(fila);
        setSelectedReqForRating(fila);
        setSelectedProviderForRating(defaultProvider);
        setIsRatingModalOpen(true);
      }
      return; // No actualiza el tracking hasta que se guarde la calificación
    }

    setTracking((prev) => {
      const next = {
        ...prev,
        [id]: {
          estado: "pendiente",
          observacion: "",
          fecha: "",
          ...(prev[id] || {}),
          ...patch,
          actualizado: new Date().toISOString(),
        },
      };
      saveTracking(next);
      return next;
    });
  };

  const handleSaveRating = async (ratingData) => {
    if (!selectedReqForRating) return;

    setRatingSavingLoading(true);
    try {
      const reqId = selectedReqForRating.req.id;
      const provider =
        selectedProviderForRating ||
        getDefaultRatingProvider(selectedReqForRating) ||
        null;
      const providerId = provider?.id || null;
      const providerName =
        provider?.proveedor?.nombre || provider?.proveedor_nombre || `Proveedor #${providerId}`;

      // Guardar la calificación en localStorage
      try {
        const ratings = JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");
        ratings.push({
          id: Date.now(),
          requerimiento_id: reqId,
          proveedor_id: providerId,
          proveedor_nombre: providerName,
          calificacion_general: ratingData.general,
          calificacion_precio: ratingData.precio,
          calificacion_rapidez: ratingData.rapidez,
          calificacion_calidad: ratingData.calidad,
          observaciones: ratingData.observaciones,
          fecha_calificacion: new Date().toISOString(),
        });
        localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
      } catch (err) {
        console.error("Error guardando en localStorage:", err);
      }

      // Actualizar el tracking a "recibido"
      setTracking((prev) => {
        const next = {
          ...prev,
          [reqId]: {
            estado: "pendiente",
            observacion: "",
            fecha: "",
            ...(prev[reqId] || {}),
            estado: "recibido",
            actualizado: new Date().toISOString(),
          },
        };
        saveTracking(next);
        return next;
      });

      // Cerrar el modal
      setIsRatingModalOpen(false);
      setSelectedReqForRating(null);
      setSelectedProviderForRating(null);
    } catch (err) {
      alert("Error al guardar la calificación: " + (err?.message || "Error desconocido"));
    } finally {
      setRatingSavingLoading(false);
    }
  };

  const filas = useMemo(
    () =>
      reqs.map((req) => {
        const detalle = detallePorId[req.id] || {};
        const ordenes = ordenesPorId[req.id] || [];
        const vista = { ...req, ...detalle, ordenes_compra: ordenes };
        const seguimiento = tracking[req.id] || { estado: "pendiente", observacion: "", fecha: "" };
        return { req, vista, seguimiento };
      }),
    [reqs, detallePorId, ordenesPorId, tracking]
  );

  const contadores = useMemo(() => {
    const base = { todos: filas.length, pendiente: 0, parcial: 0, recibido: 0 };
    filas.forEach(({ seguimiento }) => {
      const key = seguimiento.estado || "pendiente";
      base[key] = (base[key] || 0) + 1;
    });
    return base;
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    const q = normalizeSearch(busqueda);
    return filas.filter(({ req, vista, seguimiento }) => {
      if (filtro !== "todos" && (seguimiento.estado || "pendiente") !== filtro) return false;
      if (!q) return true;
      return [
        req.id,
        `req ${req.id}`,
        `req #${req.id}`,
        `requerimiento ${req.id}`,
        `requerimiento #${req.id}`,
        vista.descripcion,
        vista.sector?.nombre,
        vista.usuario?.sector?.nombre,
        vista.planta,
        vista.almacen,
        ocLabel(vista),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/#/g, "")
        .includes(q);
    });
  }, [filas, filtro, busqueda]);

  if (!puedeUsarDeposito) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="rounded border bg-white p-6 text-slate-700">
          Solo ADMIN o DEPOSITO puede acceder a este seguimiento.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Recepcion y seguimiento</div>
            <h2 className="text-3xl font-bold text-slate-950">Deposito</h2>
            <p className="mt-1 text-sm text-slate-600">
              Compras con OC asignada para controlar llegada, recepcion parcial o cierre en deposito.
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
          <Metric label="Total con OC" value={loading ? "-" : contadores.todos} hint="Disponibles para seguimiento" />
          <Metric label="Pendientes" value={loading ? "-" : contadores.pendiente} hint="Aun no recibidos" />
          <Metric label="Parciales" value={loading ? "-" : contadores.parcial} hint="Recepcion incompleta" />
          <Metric label="Recibidos" value={loading ? "-" : contadores.recibido} hint="Cerrados por deposito" />
        </section>

        <section className="rounded border bg-white">
          <div className="flex flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterButton active={filtro === "todos"} onClick={() => setFiltro("todos")}>
                Todos ({contadores.todos})
              </FilterButton>
              {Object.entries(estadoRecepcion).map(([key, cfg]) => (
                <FilterButton key={key} active={filtro === key} onClick={() => setFiltro(key)}>
                  {cfg.label} ({contadores[key] || 0})
                </FilterButton>
              ))}
            </div>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm lg:w-96"
              placeholder="Buscar por Req #, ID o numero de OC..."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="w-28 p-3 text-left">Requerimiento</th>
                  <th className="p-3 text-left">Descripcion</th>
                  <th className="w-56 p-3 text-left">OC asignada</th>
                  <th className="w-36 p-3 text-left">Sector</th>
                  <th className="w-36 p-3 text-left">Almacen</th>
                  <th className="w-40 p-3 text-center">Recepcion</th>
                  <th className="w-56 p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Cargando seguimiento...</td>
                  </tr>
                )}

                {!loading && filasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay compras con OC asignada en esta vista.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filasFiltradas.map(({ req, vista, seguimiento }) => {
                    const estado = seguimiento.estado || "pendiente";
                    const cfg = estadoRecepcion[estado] || estadoRecepcion.pendiente;
                    const items = asArray(vista.items);

                    return (
                      <Fragment key={req.id}>
                        <tr className="border-t bg-white align-top hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">Req #{req.id}</div>
                            <div className="text-xs text-slate-500">ID {req.id}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-950">{vista.descripcion}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              Planta: {vista.planta || "-"} - Centro costo: {vista.centro_costo || "-"}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-800">
                            <div className="flex flex-wrap gap-1">
                              {ocLabel(vista) === "-" ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                ocLabel(vista).split(",").map((oc) => (
                                  <span key={oc.trim()} className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
                                    {oc.trim()}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700">{vista.sector?.nombre || vista.usuario?.sector?.nombre || "-"}</td>
                          <td className="p-3 text-slate-700">{vista.almacen || "-"}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setAbierto((prev) => (prev === req.id ? null : req.id))}
                                className="rounded border bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                              >
                                {abierto === req.id ? "Ocultar" : "Ver"}
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/requerimientos/${req.id}/comparativa`)}
                                className="rounded bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-900"
                              >
                                Comparativa
                              </button>
                            </div>
                          </td>
                        </tr>

                        {abierto === req.id && (
                          <tr>
                            <td colSpan={7} className="border-t bg-slate-50 p-4">
                              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
                                <section className="rounded border bg-white">
                                  <div className="border-b px-4 py-3 font-semibold text-slate-900">Items a recibir</div>
                                  <div className="divide-y">
                                    {items.length > 0 ? (
                                      items.map((item) => (
                                        <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                          <div className="text-slate-900">{item.descripcion}</div>
                                          <div className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                            {item.cantidad} {item.unidad}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-4 py-4 text-slate-500">Sin items cargados.</div>
                                    )}
                                  </div>
                                </section>

                                <section className="rounded border bg-white p-4">
                                  <div className="font-semibold text-slate-900">Seguimiento de recepcion</div>
                                  <div className="mt-3 space-y-3">
                                    <div>
                                      <label className="text-xs font-semibold uppercase text-slate-500">Estado</label>
                                      <select
                                        value={estado}
                                        onChange={(e) => actualizarTracking(req.id, { estado: e.target.value })}
                                        className="mt-1 w-full rounded border bg-white px-3 py-2"
                                      >
                                        {Object.entries(estadoRecepcion).map(([key, value]) => (
                                          <option key={key} value={key}>{value.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase text-slate-500">Fecha estimada / real</label>
                                      <input
                                        type="date"
                                        value={seguimiento.fecha || ""}
                                        onChange={(e) => actualizarTracking(req.id, { fecha: e.target.value })}
                                        className="mt-1 w-full rounded border px-3 py-2"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase text-slate-500">Observacion</label>
                                      <textarea
                                        value={seguimiento.observacion || ""}
                                        onChange={(e) => actualizarTracking(req.id, { observacion: e.target.value })}
                                        className="mt-1 w-full rounded border px-3 py-2"
                                        rows={3}
                                        placeholder="Ej: llego parcial, falta remito, pendiente control..."
                                      />
                                    </div>
                                  </div>
                                </section>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ProviderRatingModal
        isOpen={isRatingModalOpen}
        providers={selectedReqForRating?.vista?.presupuestos || []}
        currentProvider={selectedProviderForRating || (selectedReqForRating?.vista?.presupuestos?.[0] || null)}
        onProviderChange={setSelectedProviderForRating}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedReqForRating(null);
          setSelectedProviderForRating(null);
        }}
        onSubmit={handleSaveRating}
        isLoading={ratingSavingLoading}
      />
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="rounded border bg-white p-4">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{hint}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-slate-800 bg-slate-800 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
