
import React from 'react';

interface TableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, data, renderRow }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
};
