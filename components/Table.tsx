import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface TableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  searchable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
}

export function Table<T extends { id?: string | number }>({
  headers,
  data,
  renderRow,
  searchable = true,
  pagination = true,
  itemsPerPage = 10
}: TableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  /* SEARCH */
  const filteredData = useMemo(() => {
    if (!search) return data;

    return data.filter(item =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  /* SORT */
  const sortedData = useMemo(() => {
    if (sortIndex === null) return filteredData;

    return [...filteredData].sort((a: any, b: any) => {
      const aVal = Object.values(a)[sortIndex];
      const bVal = Object.values(b)[sortIndex];

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortIndex, sortAsc]);

  /* PAGINATION */
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (index: number) => {
    if (sortIndex === index) {
      setSortAsc(!sortAsc);
    } else {
      setSortIndex(index);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">

      {/* SEARCH */}
      {searchable && (
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-3 py-2 border rounded-xl text-sm w-full"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {header}
                    {sortIndex === i &&
                      (sortAsc
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id ?? index}
                  className="hover:bg-slate-50 transition"
                >
                  {renderRow(item, index)}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === i + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-white"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
