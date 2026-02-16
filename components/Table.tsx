
import React, { useMemo, useState, useCallback, memo } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Trash2, 
  Save, 
  MoreHorizontal, 
  Loader2,
  FileX,
  ClipboardPaste,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionTr = motion.tr as any;

interface Column<T> {
  key: keyof T | string;
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
  onDeleteSelected?: (items: T[]) => void;
  emptyText?: string;
  title?: string;
}

const Table = <T extends { id?: string | number }>({
  columns,
  data,
  renderRow,
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
  loading = false,
  onDeleteSelected,
  emptyText = "Thầy ơi, chưa có dữ liệu nào ở đây cả!",
  title = ""
}: TableProps<T>) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // 1. Xử lý tìm kiếm & Sắp xếp
  const processedData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lower)
        )
      );
    }

    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, sortConfig]);

  // 2. Phân trang
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = pagination 
    ? processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : processedData;

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSearch(text);
    } catch (err) { alert("Dùng Ctrl+V"); }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4">
        {title && <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>}
        
        {searchable && (
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm kiếm thông minh..."
              className="w-full pl-14 pr-16 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-indigo-50 outline-none font-bold transition-all text-sm"
            />
            <button 
              onClick={handlePaste}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600 transition-all"
              title="Dán nhanh (Ctrl+V)"
            >
               <ClipboardPaste size={18} />
            </button>
          </div>
        )}
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải Cloud...</p>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 backdrop-blur-md">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                    className={`px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest ${col.sortable ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortConfig?.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <MotionTr
                      key={item.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-all"
                    >
                      {renderRow(item, index)}
                    </MotionTr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-32">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 animate-float">
                          <FileX size={48} />
                        </div>
                        <p className="text-slate-400 font-black text-lg">{emptyText}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
               <button
                 key={page}
                 onClick={() => setCurrentPage(page)}
                 className={`w-12 h-12 rounded-xl font-black text-sm transition-all
                   ${currentPage === page 
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                     : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
               >
                 {page}
               </button>
             ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(Table);
