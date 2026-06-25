import { useEffect, useMemo, useState } from "react";
import { useProviderRatings } from "../hooks/useProviderRatings";

export default function CalificacionesProveedores() {
  const { getRatings, deleteRating } = useProviderRatings();
  const [ratings, setRatings] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = () => {
      const data = getRatings();
      setRatings(data.sort((a, b) => new Date(b.fecha_calificacion) - new Date(a.fecha_calificacion)));
      setLoading(false);
    };
    cargar();
  }, [getRatings]);

  const proveedores = useMemo(() => {
    return [...new Map(ratings.map((r) => [r.proveedor_nombre, r])).keys()];
  }, [ratings]);

  const ratingsFiltrados = useMemo(() => {
    if (!filtroProveedor) return ratings;
    return ratings.filter((r) => r.proveedor_nombre === filtroProveedor);
  }, [ratings, filtroProveedor]);

  const promedios = useMemo(() => {
    const grupos = {};
    ratings.forEach((r) => {
      if (!grupos[r.proveedor_nombre]) {
        grupos[r.proveedor_nombre] = {
          general: [],
          precio: [],
          rapidez: [],
          calidad: [],
          count: 0,
        };
      }
      grupos[r.proveedor_nombre].general.push(r.calificacion_general);
      grupos[r.proveedor_nombre].precio.push(r.calificacion_precio);
      grupos[r.proveedor_nombre].rapidez.push(r.calificacion_rapidez);
      grupos[r.proveedor_nombre].calidad.push(r.calificacion_calidad);
      grupos[r.proveedor_nombre].count++;
    });

    const result = {};
    Object.entries(grupos).forEach(([proveedor, data]) => {
      result[proveedor] = {
        general: (data.general.reduce((a, b) => a + b, 0) / data.general.length).toFixed(1),
        precio: (data.precio.reduce((a, b) => a + b, 0) / data.precio.length).toFixed(1),
        rapidez: (data.rapidez.reduce((a, b) => a + b, 0) / data.rapidez.length).toFixed(1),
        calidad: (data.calidad.reduce((a, b) => a + b, 0) / data.calidad.length).toFixed(1),
        count: data.count,
      };
    });
    return result;
  }, [ratings]);

  const handleDelete = (id) => {
    if (window.confirm("¿Eliminar esta calificación?")) {
      deleteRating(id);
      setRatings(ratings.filter((r) => r.id !== id));
    }
  };

  const StarDisplay = ({ value }) => (
    <div className="flex items-center gap-1">
      <span className="text-lg">{"⭐".repeat(Math.round(value))}</span>
      <span className="text-xs font-semibold text-slate-600">{value}/5</span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="text-center text-slate-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">Evaluaciones</div>
          <h1 className="text-3xl font-bold text-slate-950">Calificaciones de Proveedores</h1>
          <p className="mt-1 text-sm text-slate-600">Total: {ratings.length} calificaciones</p>
        </div>

        {ratings.length === 0 ? (
          <div className="rounded border bg-white p-8 text-center text-slate-500">
            No hay calificaciones guardadas aún. Califica proveedores desde "Deposito" cuando recibas productos.
          </div>
        ) : (
          <>
            {/* Resumen por proveedor */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Promedio por Proveedor</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {proveedores.map((prov) => {
                  const avg = promedios[prov];
                  return (
                    <div key={prov} className="rounded border bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-900">{prov}</div>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">General:</span>
                              <span className="font-semibold">{avg.general}/5</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Precio:</span>
                              <span className="font-semibold">{avg.precio}/5</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Rapidez:</span>
                              <span className="font-semibold">{avg.rapidez}/5</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Calidad:</span>
                              <span className="font-semibold">{avg.calidad}/5</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">{avg.count} calificaciones</div>
                        </div>
                        <div className="text-3xl font-bold text-indigo-600">{avg.general}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Filtro y listado */}
            <section className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Filtrar por proveedor</label>
                  <select
                    value={filtroProveedor}
                    onChange={(e) => setFiltroProveedor(e.target.value)}
                    className="mt-1 w-full rounded border bg-white px-3 py-2"
                  >
                    <option value="">Todos</option>
                    {proveedores.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900">Todas las calificaciones</h2>
              <div className="space-y-2">
                {ratingsFiltrados.map((rating) => (
                  <div key={rating.id} className="rounded border bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{rating.proveedor_nombre}</div>
                            <div className="text-xs text-slate-500">
                              Req #{rating.requerimiento_id} • {new Date(rating.fecha_calificacion).toLocaleDateString("es-AR")}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(rating.id)}
                            className="rounded bg-red-50 px-3 py-1 text-xs text-red-600 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500">General</div>
                            <div className="mt-1 flex gap-1">
                              <span className="text-lg">{"⭐".repeat(rating.calificacion_general)}</span>
                              <span className="text-xs font-semibold text-slate-600">{rating.calificacion_general}/5</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500">Precio</div>
                            <div className="mt-1 flex gap-1">
                              <span className="text-lg">{"⭐".repeat(rating.calificacion_precio)}</span>
                              <span className="text-xs font-semibold text-slate-600">{rating.calificacion_precio}/5</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500">Rapidez</div>
                            <div className="mt-1 flex gap-1">
                              <span className="text-lg">{"⭐".repeat(rating.calificacion_rapidez)}</span>
                              <span className="text-xs font-semibold text-slate-600">{rating.calificacion_rapidez}/5</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500">Calidad</div>
                            <div className="mt-1 flex gap-1">
                              <span className="text-lg">{"⭐".repeat(rating.calificacion_calidad)}</span>
                              <span className="text-xs font-semibold text-slate-600">{rating.calificacion_calidad}/5</span>
                            </div>
                          </div>
                        </div>

                        {rating.observaciones && (
                          <div className="mt-3 rounded bg-slate-50 p-2 text-sm text-slate-700">
                            <div className="text-xs font-semibold text-slate-500">Observaciones</div>
                            <div className="mt-1">{rating.observaciones}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
