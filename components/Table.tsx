// components/Table.tsx

import React, { useMemo, useState, memo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileX,
} from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  searchable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  loading?: boolean;
  emptyText?: string;
  title?: string;
}

function Table<T extends { id?: string | number }>({
  columns,
  data,
  renderRow,
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
  loading = false,
  emptyText = "Chưa có dữ liệu",
  title = "",
}: TableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const processedData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lower)
        )
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, sortKey, direction]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const paginatedData = pagination
    ? processedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : processedData;

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {title && <h3 className="text-xl font-bold">{title}</h3>}

      {searchable && (
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-3 py-2 border rounded w-full"
          />
        </div>
      )}

      <div className="border rounded overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}

        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key &&
                      (direction === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr key={item.id ?? index}>
                  {renderRow(item, index)}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-slate-400"
                >
                  <FileX size={24} className="mx-auto mb-2" />
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-3 py-1">
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(Table) as typeof Table;
