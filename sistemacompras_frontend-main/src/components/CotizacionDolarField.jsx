import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CotizacionDolarField({ moneda, value, fecha, fuente, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/cotizaciones/dolar?casa=oficial");
      onChange({
        tipo_cambio: data.tipo_cambio ? String(data.tipo_cambio) : "",
        tipo_cambio_fecha: data.fecha || new Date().toISOString(),
        tipo_cambio_fuente: data.fuente || "DolarApi.com",
      });
    } catch (err) {
      setError(err?.message || "No se pudo obtener la cotizacion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moneda === "USD" && !value) {
      cargar();
    }
    if (moneda !== "USD" && (value || fecha || fuente)) {
      onChange({ tipo_cambio: "", tipo_cambio_fecha: "", tipo_cambio_fuente: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moneda]);

  if (moneda !== "USD") return null;

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700">Cotizacion USD</label>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="rounded border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr]">
        <input
          type="number"
          min="0"
          step="0.0001"
          value={value || ""}
          onChange={(e) => onChange({ tipo_cambio: e.target.value })}
          className="w-full rounded border px-3 py-2"
          placeholder="Venta oficial"
        />
        <div className="flex items-center text-xs text-slate-500">
          {fecha ? `${fuente || "Fuente externa"} - ${formatDate(fecha)}` : "Sin fecha de cotizacion"}
        </div>
      </div>

      {error && <div className="mt-2 text-xs font-medium text-rose-600">{error}</div>}
    </div>
  );
}
