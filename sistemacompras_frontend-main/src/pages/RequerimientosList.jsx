import { useCallback, useEffect, useRef, useState, Fragment } from "react";
import { apiRequest } from "../services/api";
import { apiAssetUrl } from "../services/config";
import { nombreEstado } from "../utils/estadoNombre";
import { formatFecha } from "../utils/formatDate";
import NuevoRequerimiento from "./NuevoRequerimiento";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CotizacionesModal from "../components/CotizacionesModal";
import AsignarOcModal from "../components/AsignarOcModal";
import { can, getUserRole, sameSector, userSectorId } from "../utils/roles";

const estadoBadge = (estado) => {
  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";

  switch (estado) {
    case "OC_ASIGNADA":
      return `${base} bg-indigo-100 text-indigo-800 border-indigo-200`;
    case "COTIZADO":
      return `${base} bg-cyan-100 text-cyan-800 border-cyan-200`;
    case "APROBADO":
      return `${base} bg-green-100 text-green-800 border-green-200`;
    case "RECHAZADO":
      return `${base} bg-red-100 text-red-800 border-red-200`;
    case "FINALIZADO":
      return `${base} bg-blue-100 text-blue-800 border-blue-200`;
    case "BORRADOR":
      return `${base} bg-gray-100 text-gray-700 border-gray-200`;
    case "PEND_APROB_N1":
      return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
    case "PEND_APROB_N2":
      return `${base} bg-orange-100 text-orange-800 border-orange-200`;
    default:
      return `${base} bg-slate-100 text-slate-700 border-slate-200`;
  }
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const presupuestosDe = (r) =>
  asArray(r?.presupuestos || r?.cotizaciones || r?.presupuestos_cargados);

const ordenesCompraDe = (r) =>
  asArray(r?.ordenes_compra || r?.ordenesCompra || r?.ordenes || r?.ocs);

const codigosOcDe = (ordenesCompra, req = null) => {
  const codigos = [
    ...asArray(ordenesCompra).map((oc) => oc?.codigo_oc || oc?.codigo || oc?.numero || oc?.id),
    req?.codigo_oc,
    req?.oc_asignada,
  ];

  return [...new Set(codigos.filter(Boolean).map(String))];
};

const tienePresupuestos = (r) =>
  presupuestosDe(r).length > 0 ||
  Number(r?.presupuestos_count || r?.cantidad_presupuestos || 0) > 0 ||
  Boolean(r?.cotizado);

const tieneOcAsignada = (r) =>
  r?.estado === "FINALIZADO" ||
  ordenesCompraDe(r).length > 0 ||
  Boolean(r?.codigo_oc || r?.oc_asignada);

const uniqueCount = (values) => new Set(values.filter(Boolean).map(String)).size;

const estadoVisible = (r) => {
  if (tieneOcAsignada(r)) return { estado: "OC_ASIGNADA", label: "OC asignada" };
  if (tienePresupuestos(r)) return { estado: "COTIZADO", label: "Cotizado" };
  if (r?.es_express && r?.estado === "BORRADOR") {
    return { estado: "APROBADO", label: "Express a Compras" };
  }
  return { estado: r.estado, label: nombreEstado(r.estado) };
};

const filaClass = (estado, abierta) => {
  const base = "border-t align-top transition-colors";
  if (abierta) return `${base} bg-slate-100`;

  switch (estado) {
    case "OC_ASIGNADA":
      return `${base} bg-slate-50 hover:bg-slate-100`;
    case "COTIZADO":
      return `${base} bg-sky-50/40 hover:bg-sky-50`;
    case "APROBADO":
      return `${base} bg-emerald-50/40 hover:bg-emerald-50`;
    case "RECHAZADO":
      return `${base} bg-rose-50/40 hover:bg-rose-50`;
    case "PEND_APROB_N1":
    case "PEND_APROB_N2":
      return `${base} bg-stone-50 hover:bg-stone-100`;
    default:
      return `${base} bg-white hover:bg-slate-50`;
  }
};

const archivoPresupuestoHref = (p) => {
  const url = p?.pdf_url || p?.archivo_url || p?.url || p?.archivo || null;
  return apiAssetUrl(url);
};

const normalizarHref = (url) => {
  return apiAssetUrl(url);
};

const archivoPrincipalHref = (r) =>
  normalizarHref(
    r?.archivo_url ||
    r?.archivo ||
    r?.pdf_url ||
    r?.url ||
    r?.documento_url ||
    r?.documentacion_url ||
    r?.documentacion_express_url ||
    r?.documentacionExpressUrl ||
    r?.archivo_documentacion_url ||
    r?.archivo_express_url ||
    r?.url_documentacion
  );

const archivosRequerimiento = (r) => {
  const archivos = [];
  const principalHref = archivoPrincipalHref(r);

  if (principalHref) {
    archivos.push({
      id: "archivo-principal",
      nombre: r?.archivo_nombre || r?.nombre_archivo || "Archivo del requerimiento",
      href: principalHref,
    });
  }

  asArray(
    r?.archivos ||
    r?.adjuntos ||
    r?.documentos ||
    r?.documentaciones ||
    r?.archivos_requerimiento
  ).forEach((archivo, index) => {
    const href = normalizarHref(
      archivo?.url ||
      archivo?.archivo_url ||
      archivo?.pdf_url ||
      archivo?.path ||
      archivo?.ruta
    );

    if (href) {
      archivos.push({
        id: archivo.id || `adjunto-${index}`,
        nombre: archivo.nombre || archivo.filename || archivo.originalname || `Archivo ${index + 1}`,
        href,
      });
    }
  });

  return archivos;
};

const estadoOrden = {
  BORRADOR: 0,
  PEND_APROB_N1: 1,
  PEND_APROB_N2: 2,
  APROBADO: 3,
  COTIZADO: 4,
  OC_ASIGNADA: 5,
  FINALIZADO: 5,
  RECHAZADO: 99,
};

const primerFecha = (values) => {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0]?.toISOString() || null;
};

const historialPorEstado = (historial) => {
  const map = {};
  asArray(historial).forEach((h) => {
    const estado = h.estado_nuevo;
    if (!estado || map[estado]) return;
    map[estado] = h;
  });
  return map;
};

const timelineSteps = (req, presupuestos, ordenesCompra) => {
  const historial = historialPorEstado(req?.historial);
  const estadoActual = ordenesCompraDe({ ordenes_compra: ordenesCompra }).length > 0
    ? "FINALIZADO"
    : estadoVisible(req).estado;
  const currentRank = estadoOrden[estadoActual] ?? estadoOrden[req?.estado] ?? 0;
  const rechazado = req?.estado === "RECHAZADO";
  const esExpress = Boolean(req?.es_express);

  const base = esExpress
    ? [
        { key: "BORRADOR", title: "Creado", hint: "Solicitud express registrada", date: req?.fecha_creacion || req?.createdAt },
        {
          key: "APROBADO",
          title: "En Compras",
          hint: "Ingreso directo por circuito express",
          date: req?.fecha_envio || historial.APROBADO?.fecha,
        },
      ]
    : [
        { key: "BORRADOR", title: "Creado", hint: "Solicitud registrada", date: req?.fecha_creacion || req?.createdAt },
        {
          key: "PEND_APROB_N1",
          title: "En aprobacion N1",
          hint: "Esperando primera aprobacion",
          date: req?.fecha_envio || historial.PEND_APROB_N1?.fecha,
        },
        {
          key: "PEND_APROB_N2",
          title: "En aprobacion N2",
          hint: "Esperando segunda aprobacion",
          date: req?.fecha_aprob_n1 || historial.PEND_APROB_N2?.fecha,
        },
        {
          key: "APROBADO",
          title: "En Compras",
          hint: "Aprobado para cotizar",
          date: req?.fecha_aprob_n2 || historial.APROBADO?.fecha,
        },
      ];

  const presupuestoFecha = primerFecha(
    presupuestos.map((p) => p.createdAt || p.createdat || p.fecha || p.updatedAt || p.updatedat)
  );
  const ocFecha = primerFecha(
    ordenesCompra.map((oc) => oc.createdAt || oc.createdat || oc.fecha || oc.updatedAt || oc.updatedat)
  );
  const codigosOc = codigosOcDe(ordenesCompra, req);

  const steps = [
    ...base,
    {
      key: "COTIZADO",
      title: "Cotizado",
      hint: "Compras cargo presupuestos",
      date: presupuestoFecha,
    },
    {
      key: "FINALIZADO",
      title: "OC asignada",
      hint: codigosOc.length > 0 ? `OC: ${codigosOc.join(", ")}` : "Orden de compra cargada",
      date: ocFecha || historial.FINALIZADO?.fecha,
    },
  ];

  if (rechazado) {
    steps.push({
      key: "RECHAZADO",
      title: "Rechazado",
      hint: req?.motivo_rechazo || historial.RECHAZADO?.motivo || "Solicitud rechazada",
      date: req?.fecha_rechazo || historial.RECHAZADO?.fecha,
      rejected: true,
    });
  }

  return steps.map((step) => {
    const rank = estadoOrden[step.key] ?? 0;
    const done = Boolean(step.date) || (!rechazado && rank <= currentRank);
    const current = !rechazado && rank === currentRank;
    return { ...step, done, current };
  });
};

const timelineStepStatus = (step) => {
  if (step.date) return formatFecha(step.date);
  if (step.current) return "En curso";
  if (step.done) return "Completado";
  return "Pendiente";
};

const REFRESH_INTERVAL_MS = 5000;

const filtrosMovimiento = [
  { value: "activos", label: "Activos" },
  { value: "sin_movimiento", label: "Sin movimiento" },
  { value: "todos", label: "Todos" },
];

export default function RequerimientosList() {
  const [reqs, setReqs] = useState([]);
  const [open, setOpen] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [detallePorId, setDetallePorId] = useState({});
  const [cotizacionesPorId, setCotizacionesPorId] = useState({});
  const [ordenesPorId, setOrdenesPorId] = useState({});
  const detallePorIdRef = useRef({});
  const cotizacionesPorIdRef = useRef({});
  const ordenesPorIdRef = useRef({});
  const [detalleLoadingId, setDetalleLoadingId] = useState(null);
  const [visorPorId, setVisorPorId] = useState({});
  const [filtroMovimiento, setFiltroMovimiento] = useState("activos");

  const [editOpen, setEditOpen] = useState(false);
  const [editReq, setEditReq] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [cotOpen, setCotOpen] = useState(false);
  const [cotReqId, setCotReqId] = useState(null);
  const [ocReqId, setOcReqId] = useState(null);

  const rol = user ? getUserRole(user) : null;

  const esAdmin = rol === "ADMIN";
  const esCompras = rol === "COMPRAS";
  const puedeCrearRequerimiento = user && can(user, "crearRequerimiento");
  const puedeGestionarCotizaciones = user && can(user, "gestionarCotizaciones");

  useEffect(() => {
    detallePorIdRef.current = detallePorId;
    cotizacionesPorIdRef.current = cotizacionesPorId;
    ordenesPorIdRef.current = ordenesPorId;
  }, [cotizacionesPorId, detallePorId, ordenesPorId]);

  const precargarDetallesCompra = useCallback(async (lista) => {
    if (!Array.isArray(lista) || !(esCompras || esAdmin)) return;

    const candidatos = lista.filter(
      (r) =>
        ["APROBADO", "FINALIZADO"].includes(r.estado) &&
        (!detallePorIdRef.current[r.id] || !cotizacionesPorIdRef.current[r.id] || !ordenesPorIdRef.current[r.id]) &&
        (!tienePresupuestos(r) || !tieneOcAsignada(r))
    );

    if (candidatos.length === 0) return;

    const resultados = await Promise.allSettled(
      candidatos.map(async (r) => {
        const [detalleRes, cotizacionesRes, ordenesRes] = await Promise.allSettled([
          apiRequest(`/requerimientos/${r.id}`),
          apiRequest(`/requerimientos/${r.id}/cotizaciones`),
          apiRequest(`/ordenes-compra/requerimiento/${r.id}`),
        ]);

        return {
          id: r.id,
          detalle: detalleRes.status === "fulfilled" ? detalleRes.value : null,
          cotizaciones: cotizacionesRes.status === "fulfilled" ? cotizacionesRes.value : null,
          ordenes: ordenesRes.status === "fulfilled" ? ordenesRes.value?.codigos || [] : null,
        };
      })
    );

    const detalles = {};
    const cotizaciones = {};
    const ordenes = {};
    resultados.forEach((res) => {
      if (res.status === "fulfilled") {
        if (res.value.detalle) detalles[res.value.id] = res.value.detalle;
        if (res.value.cotizaciones) cotizaciones[res.value.id] = res.value.cotizaciones;
        if (res.value.ordenes) ordenes[res.value.id] = res.value.ordenes;
      }
    });

    if (Object.keys(detalles).length > 0) {
      setDetallePorId((prev) => ({ ...prev, ...detalles }));
    }
    if (Object.keys(cotizaciones).length > 0) {
      setCotizacionesPorId((prev) => ({ ...prev, ...cotizaciones }));
    }
    if (Object.keys(ordenes).length > 0) {
      setOrdenesPorId((prev) => ({ ...prev, ...ordenes }));
    }
  }, [esAdmin, esCompras]);

  const refrescarDetalle = useCallback(async (id, { force = false, setLoading = false } = {}) => {
    if (!id) return;
    if (!force && detallePorIdRef.current[id] && cotizacionesPorIdRef.current[id] && ordenesPorIdRef.current[id]) return;

    if (setLoading) setDetalleLoadingId(id);
    try {
      const [detalleRes, cotizacionesRes, ordenesRes] = await Promise.allSettled([
        !force && detallePorIdRef.current[id]
          ? Promise.resolve(detallePorIdRef.current[id])
          : apiRequest(`/requerimientos/${id}`),
        !force && cotizacionesPorIdRef.current[id]
          ? Promise.resolve(cotizacionesPorIdRef.current[id])
          : apiRequest(`/requerimientos/${id}/cotizaciones`),
        !force && ordenesPorIdRef.current[id]
          ? Promise.resolve({ codigos: ordenesPorIdRef.current[id] })
          : apiRequest(`/ordenes-compra/requerimiento/${id}`),
      ]);

      if (detalleRes.status === "fulfilled") {
        setDetallePorId((prev) => ({ ...prev, [id]: detalleRes.value }));
      }
      if (cotizacionesRes.status === "fulfilled") {
        setCotizacionesPorId((prev) => ({ ...prev, [id]: cotizacionesRes.value }));
      }
      if (ordenesRes.status === "fulfilled") {
        setOrdenesPorId((prev) => ({ ...prev, [id]: ordenesRes.value?.codigos || [] }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (setLoading) setDetalleLoadingId(null);
    }
  }, []);

  const cargarRequerimientos = useCallback(async ({ refrescarDetalleAbierto = false } = {}) => {
    if (!user) return;

    const baseEndpoint = esCompras
      ? "/requerimientos/para-compras"
      : "/requerimientos";
    const endpoint = `${baseEndpoint}?movimiento=${filtroMovimiento}`;

    try {
      const data = await apiRequest(endpoint);
      const lista = Array.isArray(data) ? data : [];
      setReqs(lista);
      precargarDetallesCompra(lista);
      if (refrescarDetalleAbierto && abierto) {
        refrescarDetalle(abierto, { force: true });
      }
    } catch (e) {
      console.error("ERROR API:", e);
    }
  }, [abierto, esCompras, filtroMovimiento, precargarDetallesCompra, refrescarDetalle, user]);


  useEffect(() => {
    cargarRequerimientos();
  }, [cargarRequerimientos]);

  useEffect(() => {
    if (!user || open || editOpen || cotOpen || ocReqId) return undefined;

    const intervalId = window.setInterval(() => {
      cargarRequerimientos({ refrescarDetalleAbierto: Boolean(abierto) });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [abierto, cargarRequerimientos, cotOpen, editOpen, ocReqId, open, user]);


  const abrirEditar = async (r) => {
    try {
      const detalle = await apiRequest(`/requerimientos/${r.id}`);
      setEditReq(detalle);
      setEditOpen(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar el requerimiento para editar");
    }
  };

  const toggleDetalle = async (r) => {
    if (abierto === r.id) {
      setAbierto(null);
      setVisorPorId((prev) => {
        const next = { ...prev };
        delete next[r.id];
        return next;
      });
      return;
    }

    setAbierto(r.id);

    refrescarDetalle(r.id, { setLoading: true });
  };

  const imprimirRequerimiento = async (r) => {
    if (abierto !== r.id) {
      setAbierto(r.id);
    }

    await refrescarDetalle(r.id, { force: true, setLoading: true });
    window.setTimeout(() => {
      const area = document.querySelector(`[data-print-requerimiento-id="${r.id}"]`);
      if (!area) {
        window.print();
        return;
      }

      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        alert("El navegador bloqueo la ventana de impresion. Habilita ventanas emergentes para imprimir.");
        return;
      }

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join("\n");

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Requerimiento ${r.id}</title>
            ${styles}
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              body { background: #fff; color: #0f172a; font-family: Arial, sans-serif; }
              button, iframe { display: none !important; }
              a { color: #0f172a !important; text-decoration: none !important; }
              section, .rounded, li { break-inside: avoid; }
              .requerimiento-print-area { padding: 0 !important; }
            </style>
          </head>
          <body>
            <main class="requerimiento-print-area">${area.innerHTML}</main>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }, 100);
  };

  if (!user) return <div className="p-10">Cargando usuario...</div>;

  const reqsFiltrados = reqs.filter((r) => {
    if (rol === "ADMIN") return true;
    if (rol === "USER") return r.id_usuario === user.id;
    if (rol === "COMPRAS") return true;
    if (rol === "APROBADOR_N1") {
      return r.estado === "PEND_APROB_N1" &&
        (!userSectorId(user) || sameSector(user, r));
    }
    if (rol === "APROBADOR_N2") {
      return r.estado === "PEND_APROB_N2" &&
        (!userSectorId(user) || sameSector(user, r));
    }

    return false;
  });


  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 bg-white border rounded hover:bg-gray-50"
          >
            ← Volver
          </button>


          <h2 className="text-3xl font-bold">Requerimientos</h2>
        </div>



        {puedeCrearRequerimiento && (
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900"
          >
            + Nuevo Requerimiento
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <div className="text-sm font-semibold text-slate-900">Vista de requerimientos</div>
          <div className="text-xs text-slate-500">Los activos ocultan automaticamente los que llevan 14 dias sin movimiento.</div>
        </div>
        <div className="inline-flex rounded border border-slate-300 bg-slate-50 p-1">
          {filtrosMovimiento.map((filtro) => (
            <button
              key={filtro.value}
              type="button"
              onClick={() => setFiltroMovimiento(filtro.value)}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                filtroMovimiento === filtro.value
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL NUEVO */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-[min(980px,100%)] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">
                Nuevo requerimiento
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded hover:bg-slate-100 text-xl leading-none text-gray-500 hover:text-slate-900"
              >
                x
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-50">
              <NuevoRequerimiento
                onClose={(result) => {
                  setOpen(false);
                  cargarRequerimientos();
                  if (result?.esExpress && result?.requerimiento?.id) {
                    setCotReqId(result.requerimiento.id);
                    setCotOpen(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      <CotizacionesModal
        open={cotOpen}
        requerimientoId={cotReqId}
        onClose={() => {
          setCotOpen(false);
          setCotReqId(null);
          cargarRequerimientos({ refrescarDetalleAbierto: Boolean(abierto) });
        }}
      />
      <AsignarOcModal
        open={Boolean(ocReqId)}
        requerimientoId={ocReqId}
        onClose={(result) => {
          if (result?.ocAsignada && ocReqId) {
            setOrdenesPorId((prev) => ({ ...prev, [ocReqId]: asArray(result.codigos) }));
          }
          setOcReqId(null);
          cargarRequerimientos({ refrescarDetalleAbierto: Boolean(abierto) });
        }}
      />


      {/* MODAL EDITAR */}
      {editOpen && editReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-[min(980px,100%)] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">
                Editar requerimiento #{editReq.id}
              </h2>

              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditReq(null);
                }}
                className="h-9 w-9 rounded hover:bg-slate-100 text-xl leading-none text-gray-500 hover:text-slate-900"
              >
                x
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-50">
              <NuevoRequerimiento
                modo="edit"
                initialData={editReq}
                onClose={(result) => {
                  setEditOpen(false);
                  setEditReq(null);
                  cargarRequerimientos();
                  if (result?.esExpress && (result?.requerimiento?.id || editReq?.id)) {
                    setCotReqId(result?.requerimiento?.id || editReq.id);
                    setCotOpen(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div className="bg-white mt-6 rounded shadow">
        <table className="w-full table-fixed">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 w-20 text-left">ID</th>
              <th className="p-3 w-28 text-center">Tipo</th>
              <th className="p-3 text-left">Descripcion</th>
              <th className="p-3 w-40 text-left">Sector</th>
              <th className="p-3 w-64 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {reqsFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-500">
                  No hay requerimientos para este usuario
                </td>
              </tr>
            )}

            {reqsFiltrados.map((r) => {
              const detalle = detallePorId[r.id];
              const cotizaciones = cotizacionesPorId[r.id];
              const reqCotizacion = cotizaciones?.requerimiento;
              const ordenesExternas = asArray(ordenesPorId[r.id]);
              const reqBase = { ...r, ...(detalle || {}), ...(reqCotizacion || {}) };
              const ordenesCompra = [...ordenesCompraDe(reqBase), ...ordenesExternas];
              const codigosOc = codigosOcDe(ordenesCompra, reqBase);
              const ultimaOc = codigosOc[codigosOc.length - 1] || null;
              const reqVista = { ...reqBase, ordenes_compra: ordenesCompra };
              const estadoMostrado = estadoVisible(reqVista);
              const presupuestos = presupuestosDe(reqCotizacion || reqVista);
              const itemsCotizacion = asArray(reqCotizacion?.items || reqVista.items);
              const adjudicaciones = asArray(cotizaciones?.adjudicaciones);
              const itemsAdjudicados = uniqueCount(adjudicaciones.map((a) => a.id_requerimiento_item));
              const adjudicacionCompleta =
                presupuestos.length > 0 &&
                itemsCotizacion.length > 0 &&
                itemsAdjudicados >= itemsCotizacion.length;
              const archivos = archivosRequerimiento(reqVista);
              const visor = visorPorId[r.id];
              const puedeVerComparativa =
                puedeGestionarCotizaciones || can(user, "seguimientoDeposito");
              const puedeEditar =
                can(user, "editarBorrador") && r.estado === "BORRADOR" && !reqVista.es_express;

              const puedeEnviar =
                can(user, "enviarAprobacion") &&
                r.estado === "BORRADOR" &&
                !reqVista.es_express;

              const puedeAccionarN1 =
                can(user, "aprobarN1") &&
                (esAdmin || !userSectorId(user) || sameSector(user, reqVista)) &&
                r.estado === "PEND_APROB_N1";

              const puedeAccionarN2 =
                can(user, "aprobarN2") && r.estado === "PEND_APROB_N2";

              const esExpressAprobado = r.es_express && r.estado === "APROBADO";
              return (

                <Fragment key={r.id}>
                  <tr
                    className={`${filaClass(estadoMostrado.estado, abierto === r.id)} requerimiento-summary-row cursor-pointer`}
                    onClick={() => {
                      if (puedeVerComparativa) {
                        navigate(`/requerimientos/${r.id}/comparativa`);
                      } else {
                        toggleDetalle(r);
                      }
                    }}
                    title={puedeVerComparativa ? "Abrir comparativa de precios" : "Ver detalle"}
                  >
                    {/* ID */}
                    <td className="p-3 w-20 text-left">{r.id}</td>

                    {/* Tipo */}
                    <td className="p-3 w-28 text-center">
                      {r.es_express ? (
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          Express
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Descripcion */}
                    <td className="p-3 text-left break-words">
                      <div className="space-y-2">
                        <div>{r.descripcion}</div>
                        {ultimaOc && (
                          <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            OC: {ultimaOc}
                          </div>
                        )}
                        <span className={estadoBadge(estadoMostrado.estado)}>
                          {estadoMostrado.label}
                        </span>
                        {r.sin_movimiento && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            {r.dias_sin_movimiento} dias sin movimiento
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="p-3 w-40 text-left text-sm text-slate-700 break-words">
                      {r.sector?.nombre || r.usuario?.sector?.nombre || "-"}
                    </td>

                    {/* Acciones */}
                    <td className="p-3 w-64">
                      <div className="flex flex-wrap justify-end items-center gap-2">
                        <button
                          className="px-3 py-1.5 rounded border bg-white text-sm text-slate-700 hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDetalle(r);
                          }}
                        >
                          {abierto === r.id ? "Ocultar" : "Ver"}
                        </button>

                        <button
                          type="button"
                          title="Imprimir requerimiento"
                          aria-label={`Imprimir requerimiento ${r.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            imprimirRequerimiento(r);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M6 9V2h12v7" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M6 14h12v8H6z" />
                          </svg>
                        </button>


                        {/* Editar */}
                        {puedeEditar && (
                          <button
                            title="Editar"
                            className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded text-sm hover:bg-slate-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirEditar(r);
                            }}
                          >
                            Editar
                          </button>
                        )}
                        {puedeGestionarCotizaciones && r.estado !== "FINALIZADO" && (
                          <button
                            className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCotReqId(r.id);
                              setCotOpen(true);
                            }}
                          >
                            Cotizar
                          </button>
                        )}
                        {puedeGestionarCotizaciones && r.estado !== "FINALIZADO" && (
                          <button
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                            disabled={!adjudicacionCompleta}
                            title={
                              adjudicacionCompleta
                                ? "Asignar OC"
                                : "Primero adjudica todos los items en la comparativa"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!adjudicacionCompleta) return;
                              setOcReqId(r.id);
                            }}
                          >
                            Asignar OC
                          </button>
                        )}

                        {/* Enviar */}
                        {puedeEnviar && (
                          <button
                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              apiRequest(`/requerimientos/${r.id}/enviar`, "POST")
                                .then(cargarRequerimientos)
                                .catch(console.error);
                            }}
                          >
                            Enviar
                          </button>
                        )}

                        {/* N1 */}
                        {puedeAccionarN1 && (
                          <>
                            <button
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                apiRequest(`/requerimientos/${r.id}/aprobar-n1`, "POST")
                                  .then(cargarRequerimientos)
                                  .catch(console.error);
                              }}
                            >
                              Aprobar
                            </button>

                            <button
                              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                apiRequest(`/requerimientos/${r.id}/rechazar`, "POST", {
                                  motivo: "Rechazado por N1",
                                })
                                  .then(cargarRequerimientos)
                                  .catch(console.error);
                              }}
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        {/* N2 */}
                        {puedeAccionarN2 && (
                          <>
                            <button
                              className="bg-green-700 text-white px-3 py-1.5 rounded text-sm hover:bg-green-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                apiRequest(`/requerimientos/${r.id}/aprobar-n2`, "POST")
                                  .then(cargarRequerimientos)
                                  .catch(console.error);
                              }}
                            >
                              Aprobar
                            </button>

                            <button
                              className="bg-red-700 text-white px-3 py-1.5 rounded text-sm hover:bg-red-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                apiRequest(`/requerimientos/${r.id}/rechazar`, "POST", {
                                  motivo: "Rechazado por N2",
                                })
                                  .then(cargarRequerimientos)
                                  .catch(console.error);
                              }}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {abierto === r.id && (
                    <tr className="requerimiento-print-row">
                      <td colSpan="5" className="bg-slate-50 border-t border-slate-200">
                        <div
                          className="requerimiento-print-area p-5 space-y-5"
                          data-print-requerimiento-id={r.id}
                        >
                          {detalleLoadingId === r.id && (
                            <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                              Cargando detalle...
                            </div>
                          )}

                          <div className="rounded border border-slate-200 bg-white px-4 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold uppercase text-slate-500">
                                  Requerimiento #{r.id}
                                </div>
                                <h3 className="mt-1 text-xl font-bold text-slate-950">
                                  {reqVista.descripcion || "Sin descripcion"}
                                </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {reqVista.es_express ? (
                                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                    Express
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    Normal
                                  </span>
                                )}
                                <span className={estadoBadge(estadoMostrado.estado)}>
                                  {estadoMostrado.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                            <div className="rounded border border-slate-200 bg-white px-3 py-2">
                              <div className="text-xs font-semibold uppercase text-slate-500">Sector</div>
                              <div className="mt-1 text-slate-900">
                                {reqVista.sector?.nombre || reqVista.usuario?.sector?.nombre || "-"}
                              </div>
                            </div>
                            <div className="rounded border border-slate-200 bg-white px-3 py-2">
                              <div className="text-xs font-semibold uppercase text-slate-500">Planta</div>
                              <div className="mt-1 text-slate-900">{reqVista.planta || "-"}</div>
                            </div>
                            <div className="rounded border border-slate-200 bg-white px-3 py-2">
                              <div className="text-xs font-semibold uppercase text-slate-500">Centro costo</div>
                              <div className="mt-1 text-slate-900">{reqVista.centro_costo || "-"}</div>
                            </div>
                            <div className="rounded border border-slate-200 bg-white px-3 py-2">
                              <div className="text-xs font-semibold uppercase text-slate-500">Almacen</div>
                              <div className="mt-1 text-slate-900">{reqVista.almacen || "-"}</div>
                            </div>
                          </div>

                          {reqVista.es_express && (
                            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                              <div className="font-semibold text-amber-900">Express directo a Compras</div>
                              <div className="mt-1 text-amber-900">
                                {reqVista.justificacion_express || "Sin justificacion cargada"}
                              </div>
                            </div>
                          )}

                          <HistorialVida
                            req={reqVista}
                            presupuestos={presupuestos}
                            ordenesCompra={ordenesCompra}
                          />

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <section className="rounded border border-slate-200 bg-white">
                              <div className="border-b border-slate-200 px-4 py-3">
                                <div className="text-sm font-semibold text-slate-900">Archivos del requerimiento</div>
                              </div>
                              <div className="p-4">
                                {archivos.length > 0 ? (
                                  <div className="space-y-2">
                                    {archivos.map((archivo) => (
                                      <div key={archivo.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                        <span className="font-medium text-slate-800">{archivo.nombre}</span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setVisorPorId((prev) => ({
                                                ...prev,
                                                [r.id]: { href: archivo.href, nombre: archivo.nombre },
                                              }))
                                            }
                                            className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                          >
                                            Ver
                                          </button>
                                          <a href={archivo.href} download className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900">Descargar</a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">Sin archivos cargados</div>
                                )}
                              </div>
                            </section>

                            <section className="rounded border border-slate-200 bg-white">
                              <div className="border-b border-slate-200 px-4 py-3">
                                <div className="text-sm font-semibold text-slate-900">Presupuestos</div>
                              </div>
                              <div className="p-4">
                                {presupuestos.length > 0 ? (
                                  <div className="space-y-2">
                                    {presupuestos.map((p) => {
                                      const href = archivoPresupuestoHref(p);
                                      const proveedor = p.proveedor?.nombre || p.proveedor_nombre || `Proveedor #${p.id_proveedor || p.id}`;

                                      return (
                                        <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                          <span className="font-medium text-slate-800">{proveedor}</span>
                                          {href ? (
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setVisorPorId((prev) => ({
                                                    ...prev,
                                                    [r.id]: { href, nombre: proveedor },
                                                  }))
                                                }
                                                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                              >
                                                Ver
                                              </button>
                                              <a href={href} download className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900">Descargar</a>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-slate-400">Sin archivo</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">Sin presupuestos cargados</div>
                                )}
                              </div>
                            </section>
                          </div>

                          {visor && (
                            <section className="rounded border border-slate-200 bg-white">
                              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">Vista previa</div>
                                  <div className="text-xs text-slate-500">{visor.nombre}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={visor.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Abrir
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVisorPorId((prev) => {
                                        const next = { ...prev };
                                        delete next[r.id];
                                        return next;
                                      })
                                    }
                                    className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900"
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              </div>
                              <div className="h-[520px] overflow-hidden bg-slate-100">
                                <iframe
                                  src={visor.href}
                                  title={`Vista previa ${visor.nombre}`}
                                  className="h-full w-full border-0"
                                />
                              </div>
                            </section>
                          )}

                          {ordenesCompra.length > 0 && (
                            <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm">
                              <span className="font-semibold text-slate-900">OC asignada: </span>
                              <span className="text-slate-700">
                                {ordenesCompra.map((oc) => oc.codigo_oc || oc.codigo || oc.numero || oc.id).filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}

                          <section className="rounded border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-4 py-3">
                              <div className="text-sm font-semibold text-slate-900">Items</div>
                            </div>
                            <ul className="divide-y divide-slate-100">
                              {reqVista.items?.map((i) => (
                                <li key={i.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                                  <span className="text-slate-900">{i.descripcion}</span>
                                  <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{i.cantidad} {i.unidad}</span>
                                </li>
                              ))}
                            </ul>
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
    </div>
  );
}

function HistorialVida({ req, presupuestos, ordenesCompra }) {
  const steps = timelineSteps(req, presupuestos, ordenesCompra);

  return (
    <section className="rounded border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Seguimiento del requerimiento</div>
        <div className="text-xs text-slate-500">Linea de vida desde la creacion hasta la OC.</div>
      </div>
      <div className="p-4">
        <div className="relative space-y-4 pl-7">
          <div className="absolute bottom-3 left-[13px] top-3 w-0.5 bg-slate-200" />
          {steps.map((step) => (
            <div key={step.key} className="relative">
              <span
                className={`absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                  step.rejected
                    ? "border-red-600 bg-red-500"
                    : step.done
                      ? "border-green-600 bg-green-500"
                      : step.current
                        ? "border-amber-500 bg-amber-300"
                        : "border-slate-300 bg-white"
                }`}
              />
              <div
                className={`rounded border px-3 py-2 text-sm ${
                  step.rejected
                    ? "border-red-200 bg-red-50"
                    : step.current
                      ? "border-amber-200 bg-amber-50"
                      : step.done
                        ? "border-green-100 bg-green-50/60"
                        : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900">{step.title}</div>
                  <div className="text-xs text-slate-500">{timelineStepStatus(step)}</div>
                </div>
                <div className="mt-1 text-xs text-slate-600">{step.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
