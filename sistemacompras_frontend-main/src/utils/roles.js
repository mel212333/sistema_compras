export const ROLES = ["ADMIN", "USER", "APROBADOR_N1", "APROBADOR_N2", "COMPRAS", "DEPOSITO"];

export const roleLabels = {
  ADMIN: "Administrador",
  USER: "Solicitante",
  APROBADOR_N1: "Jefe de sector",
  APROBADOR_N2: "Aprobador segunda firma",
  COMPRAS: "Compras",
  DEPOSITO: "Deposito",
};

export const accessByRole = {
  ADMIN: ["Inicio", "Requerimientos", "Compras", "Deposito", "Usuarios", "Perfil"],
  USER: ["Inicio", "Requerimientos", "Perfil"],
  APROBADOR_N1: ["Inicio", "Requerimientos", "Perfil"],
  APROBADOR_N2: ["Inicio", "Requerimientos", "Perfil"],
  COMPRAS: ["Inicio", "Requerimientos", "Compras", "Perfil"],
  DEPOSITO: ["Inicio", "Requerimientos", "Deposito", "Perfil"],
};

export const navItems = [
  { label: "Inicio", to: "/", roles: ROLES },
  { label: "Requerimientos", to: "/requerimientos", roles: ROLES },
  { label: "Compras", to: "/compras", roles: ["ADMIN", "COMPRAS"] },
  { label: "Deposito", to: "/deposito", roles: ["ADMIN", "DEPOSITO"] },
  { label: "Calificaciones", to: "/calificaciones", roles: ["ADMIN", "COMPRAS", "DEPOSITO"] },
  { label: "Usuarios", to: "/usuarios", roles: ["ADMIN"] },
  { label: "Perfil", to: "/perfil", roles: ROLES },
];

export const routePermissions = [
  { pattern: "/", roles: ROLES },
  { pattern: "/requerimientos", roles: ROLES },
  { pattern: "/requerimientos/:id/comparativa", roles: ["ADMIN", "COMPRAS", "DEPOSITO"] },
  { pattern: "/compras", roles: ["ADMIN", "COMPRAS"] },
  { pattern: "/deposito", roles: ["ADMIN", "DEPOSITO"] },
  { pattern: "/calificaciones", roles: ["ADMIN", "COMPRAS", "DEPOSITO"] },
  { pattern: "/usuarios", roles: ["ADMIN"] },
  { pattern: "/perfil", roles: ROLES },
];

export const actionPermissions = {
  crearRequerimiento: ["ADMIN", "USER"],
  editarBorrador: ["ADMIN", "USER"],
  enviarAprobacion: ["ADMIN", "USER"],
  aprobarN1: ["ADMIN", "APROBADOR_N1"],
  aprobarN2: ["ADMIN", "APROBADOR_N2"],
  gestionarCotizaciones: ["ADMIN", "COMPRAS"],
  adjudicarComparativa: ["ADMIN", "COMPRAS"],
  asignarOC: ["ADMIN", "COMPRAS"],
  seguimientoDeposito: ["ADMIN", "DEPOSITO"],
  administrarUsuarios: ["ADMIN"],
};

export function getUserRole(user) {
  return user?.rol || user?.role || "USER";
}

export function normalizeUserRole(user) {
  if (!user) return user;
  const role = getUserRole(user);
  return { ...user, rol: role, role };
}

export function hasRole(user, allowedRoles) {
  return allowedRoles.includes(getUserRole(user));
}

export function can(user, action) {
  const allowedRoles = actionPermissions[action] || [];
  return hasRole(user, allowedRoles);
}

export function canAccessRoles(user, allowedRoles = ROLES) {
  return hasRole(user, allowedRoles);
}

export function canAccessPath(user, pathname) {
  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const permission = routePermissions.find(({ pattern }) => matchPathPattern(pattern, cleanPath));
  return permission ? canAccessRoles(user, permission.roles) : true;
}

export function userSectorId(user) {
  return user?.sector_id || user?.sectorId || user?.sector?.id || user?.sector?.id_sector || null;
}

export function requerimientoSectorId(requerimiento) {
  return (
    requerimiento?.sector_id ||
    requerimiento?.sectorId ||
    requerimiento?.id_sector ||
    requerimiento?.sector?.id ||
    requerimiento?.sector?.id_sector ||
    requerimiento?.usuario?.sector_id ||
    requerimiento?.usuario?.sectorId ||
    requerimiento?.usuario?.sector?.id ||
    requerimiento?.usuario?.sector?.id_sector ||
    null
  );
}

export function sameSector(user, requerimiento) {
  const userSector = userSectorId(user);
  const reqSector = requerimientoSectorId(requerimiento);
  return Boolean(userSector && reqSector && String(userSector) === String(reqSector));
}

function matchPathPattern(pattern, pathname) {
  const cleanPattern = pattern === "/" ? "/" : pattern.replace(/\/+$/, "");
  if (cleanPattern === pathname) return true;

  const patternParts = cleanPattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((part, index) => part.startsWith(":") || part === pathParts[index]);
}
