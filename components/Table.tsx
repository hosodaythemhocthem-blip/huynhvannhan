import React, {
  useMemo,
  useState,
  useCallback,
  useDeferredValue,
  memo,
} from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface TableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  searchable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  className?: string;
  emptyText?: string;
}

type SortState = {
  index: number | null;
  asc: boolean;
};

function safeValue(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.toLowerCase();
  if (value instanceof Date) return value.getTime();
  if (value === null || value === undefined) return "";
  return JSON.stringify(value).toLowerCase();
}

function InternalTable<T extends { id?: string | number }>({
  headers,
  data,
  renderRow,
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
  className = "",
  emptyText = "Không có dữ liệu",
}: TableProps<T>) {
  const [search, setSearch] = useState<string>("");
  const deferredSearch = useDeferredValue(search);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortState, setSortState] = useState<SortState>({
    index: null,
    asc: true,
  });

  /* ================= SEARCH ================= */

  const filteredData = useMemo(() => {
    if (!deferredSearch.trim()) return data;

    const lower = deferredSearch.toLowerCase();

    return data.filter((item) =>
      Object.values(item as Record<string, unknown>)
        .map((v) => safeValue(v).toString())
        .join(" ")
        .includes(lower)
    );
  }, [data, deferredSearch]);

  /* ================= SORT ================= */

  const sortedData = useMemo(() => {
    if (sortState.index === null) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = safeValue(
        Object.values(a as Record<string, unknown>)[sortState.index!]
      );
      const bVal = safeValue(
        Object.values(b as Record<string, unknown>)[sortState.index!]
      );

      if (aVal < bVal) return sortState.asc ? -1 : 1;
      if (aVal > bVal) return sortState.asc ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortState]);

  /* ================= PAGINATION ================= */

  const totalPages = useMemo(() => {
    return pagination
      ? Math.max(1, Math.ceil(sortedData.length / itemsPerPage))
      : 1;
  }, [sortedData.length, pagination, itemsPerPage]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, pagination, itemsPerPage]);

  /* ================= HANDLERS ================= */

  const handleSort = useCallback((index: number) => {
    setSortState((prev) => {
      if (prev.index === index) {
        return { index, asc: !prev.asc };
      }
      return { index, asc: true };
    });
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setCurrentPage(1);
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /* ================= RENDER ================= */

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="relative w-64">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm..."
            className="pl-9 pr-3 py-2 border rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    {header}
                    {sortState.index === i &&
                      (sortState.asc ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id ?? `${index}-${currentPage}`}
                  className="hover:bg-slate-50 transition-colors"
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
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm flex-wrap">
          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            const active = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg border transition ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const Table = memo(InternalTable) as typeof InternalTable;
