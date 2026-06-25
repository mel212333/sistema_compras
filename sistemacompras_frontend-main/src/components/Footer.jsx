import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 text-center py-4 border-t border-gray-800 dark:border-gray-700 select-none">
      <p className="text-sm">
        &copy; {new Date().getFullYear()}
        <span className="text-gray-300 dark:text-gray-100 font-medium">
          Compras
        </span>
        . Todos los derechos reservados.
      </p>
    </footer>
  );
}
