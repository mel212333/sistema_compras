import React from 'react';

export default function Table({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-700 bg-gray-900 text-gray-200 rounded">
        <thead className="bg-gray-800 text-gray-200">
          <tr>
            {columns.map(({ header, accessor }) => (
              <th
                key={accessor}
                className="px-4 py-3 border border-gray-700 text-left select-none font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                No hay datos para mostrar.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick && onRowClick(row)}
                className="cursor-pointer hover:bg-gray-800 transition-colors"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick && onRowClick(row);
                  }
                }}
                role="button"
              >
                {columns.map(({ accessor }) => (
                  <td
                    key={accessor}
                    className="border border-gray-700 px-4 py-3 whitespace-nowrap"
                  >
                    {row[accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
