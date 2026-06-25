export function nombreEstado(estado) {
  switch (estado) {
    case "BORRADOR":
      return "Borrador";

    case "PEND_APROB_N1":
      return "Pendiente de aprobación – Nivel 1";

    case "PEND_APROB_N2":
      return "Pendiente de aprobación – Nivel 2";

    case "APROBADO":
      return "Aprobado";

    case "RECHAZADO":
      return "Rechazado";

    case "FINALIZADO":
      return "Finalizado";

    default:
      return estado ?? "-";
  }
}
