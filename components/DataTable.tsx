import React from 'react';
import type { CSVRow } from '../types';

interface DataTableProps {
  headers: string[];
  data: CSVRow[];
}

const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
  if (!headers.length || !data) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50 shadow-lg">
       <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-800 transition-colors duration-200">
                  {headers.map((header) => (
                    <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {String(row[header])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="text-center py-10 text-gray-500">
                  No results match your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;