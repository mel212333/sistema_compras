export function formatFecha(fechaIso) {
  if (!fechaIso) return "-";

  const fecha = new Date(fechaIso);

  // fecha inválida → "-"
  if (isNaN(fecha)) return "-";

  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(".", "");
}
