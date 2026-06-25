import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatFecha } from "../utils/formatDate";
import { nombreEstado } from "../utils/estadoNombre";
import { useAuthContext } from "../context/AuthContext";
import { getUserRole } from "../utils/roles";

export default function RequerimientoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const rol = getUserRole(user);
  const esAdmin = rol === "ADMIN";
  const esCompras = rol === "COMPRAS";
  const esSolicitante = rol === "USER";
  const esAprobador1 = rol === "APROBADOR_N1";
  const esAprobador2 = rol === "APROBADOR_N2";

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/requerimientos/${id}`);
      setReq(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const accion = async (endpoint, body = null) => {
    try {
      await apiRequest(`/requerimientos/${id}/${endpoint}`, "POST", body);
      await cargar();
    } catch (err) {
      alert(err.message);
    }
  };

  const guardarOC = async () => {
    try {
      await apiRequest("/ordenes-compra", "POST", { requerimientoId: req.id });
      alert("OC creada");
      await cargar();
    } catch (err) {
      alert(err.message || "No se pudo crear la OC");
    }
  };

  if (loading) return <p className="p-6 text-slate-500">Cargando...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!req) return <p className="p-6 text-slate-500">No se encontro el requerimiento.</p>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <button onClick={() => navigate(-1)} className="rounded border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Atras
        </button>

        <section className="rounded border bg-white p-6">
          <div className="text-xs font-semibold uppercase text-slate-500">Detalle de requerimiento</div>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">Requerimiento #{req.id}</h2>
          <p className="mt-3 text-slate-700">{req.descripcion}</p>

          <div className="mt-4">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {nombreEstado(req.estado)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {req.estado === "BORRADOR" && (esSolicitante || esAdmin) && (
              <button onClick={() => accion("enviar")} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Enviar
              </button>
            )}

            {req.estado === "PEND_APROB_N1" && (esAprobador1 || esAdmin) && (
              <>
                <button onClick={() => accion("aprobar-n1")} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                  Aprobar N1
                </button>
                <button onClick={() => accion("rechazar", { motivo: "Rechazado por N1" })} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                  Rechazar
                </button>
              </>
            )}

            {req.estado === "PEND_APROB_N2" && (esAprobador2 || esAdmin) && (
              <>
                <button onClick={() => accion("aprobar-n2")} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                  Aprobar N2
                </button>
                <button onClick={() => accion("rechazar", { motivo: "Rechazado por N2" })} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                  Rechazar
                </button>
              </>
            )}

            {req.estado === "APROBADO" && (esCompras || esAdmin) && (
              <button onClick={guardarOC} className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-900">
                Generar OC
              </button>
            )}
          </div>
        </section>

        <section className="rounded border bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Fechas</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Creado" value={formatFecha(req.fecha_creacion) || "-"} />
            <Info label="Enviado" value={formatFecha(req.fecha_envio) || "-"} />
            <Info label="Aprobado N1" value={formatFecha(req.fecha_aprob_n1) || "-"} />
            <Info label="Aprobado N2" value={formatFecha(req.fecha_aprob_n2) || "-"} />
            <Info label="Rechazado" value={formatFecha(req.fecha_rechazo) || "-"} />
          </div>
        </section>

        <section className="rounded border bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Items</h3>
          <div className="mt-3 divide-y divide-slate-100">
            {(req.items || []).length === 0 && <div className="py-3 text-sm text-slate-500">No tiene items.</div>}
            {(req.items || []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <div className="font-medium text-slate-900">{item.descripcion}</div>
                  {item.detalle && <div className="mt-1 text-slate-500">{item.detalle}</div>}
                </div>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {item.cantidad} {item.unidad}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-slate-900">{value}</div>
    </div>
  );
}
