export const CONDICIONES_PAGO = [
  { codigo: "7", descripcion: "10 DS. F.F." },
  { codigo: "1", descripcion: "15 DS. F.F." },
  { codigo: "2", descripcion: "15 DS.CHEQ.DIF.CONTRA O.C." },
  { codigo: "6", descripcion: "15 y 30 Ds. F.F." },
  { codigo: "9", descripcion: "20 DS. F.F." },
  { codigo: "3", descripcion: "30 DS. F.F." },
  { codigo: "4", descripcion: "30 DS.CH.DIF.CONTRA O.C." },
  { codigo: "15", descripcion: "30/60 DIAS F.F." },
  { codigo: "12", descripcion: "30/60/90 DIAS F.F." },
  { codigo: "11", descripcion: "30/60/90/120 DIAS F.F." },
  { codigo: "5", descripcion: "60 DS. F.F." },
  { codigo: "8", descripcion: "7 DS. F.F." },
  { codigo: "106", descripcion: "C/CH. DIF. 15/30 DIAS ADJ. O/C" },
  { codigo: "105", descripcion: "C/CH. DIF.30/45 DS. ADJ O/C" },
  { codigo: "107", descripcion: "C/CH.DIF.20/40/60 DIAS ADJ.O/C" },
  { codigo: "110", descripcion: "C/CHEQ DIF 45 ds" },
  { codigo: "14", descripcion: "C/CHEQ. DIFER. 30-60 ADJ. O.C." },
  { codigo: "111", descripcion: "C/CHEQ.DIFER.30 DS C/ENTREGA" },
  { codigo: "102", descripcion: "Ch/Dif 15 dias Adj. O/C" },
  { codigo: "100", descripcion: "Ch/Dif 20 dias Adj. O/C" },
  { codigo: "101", descripcion: "Ch/Dif 30 dias Adj. O/C" },
  { codigo: "103", descripcion: "Ch/Dif 30/60 dias Adj. O/C" },
  { codigo: "104", descripcion: "Ch/Dif 30/60/90 dias Adj. O/C" },
  { codigo: "16", descripcion: "CON CHEQUE DIFER. 30 DIAS F.F." },
  { codigo: "0", descripcion: "Contado" },
  { codigo: "108", descripcion: "CONTADO ANTICIPADO" },
  { codigo: "10", descripcion: "CONTADO C/TRANSF. BANCARIA" },
  { codigo: "13", descripcion: "CONTRA CERTIFICACIONES" },
  { codigo: "109", descripcion: "CUENTA CORRIENTE" },
  { codigo: "249", descripcion: "Segun Observaciones" },
];

export const DEFAULT_CONDICION_PAGO = "Contado";

export function condicionPagoValue(condicion) {
  return condicion.descripcion;
}
