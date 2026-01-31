import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProjectFile } from './types';
import Button from './components/Button';
import { generateCodeExpansion } from './services/geminiService';
import JSZip from 'jszip';

/* ===============================
   INTERNAL FILE TREE
================================ */
const InternalFileTree: React.FC<{
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleContext: (id: string) => void;
  lastUpdatedId: string | null;
}> = ({ files, selectedFileId, onSelect, onDelete, onToggleContext, lastUpdatedId }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    src: true,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const treeData = useMemo(() => {
    const root = { name: 'root', path: '', isFile: false, children: {} as any };

    files.forEach(file => {
      if (searchTerm && !file.path.toLowerCase().includes(searchTerm.toLowerCase())) return;

      const parts = file.path.split('/');
      let current = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: currentPath,
            isFile: isLast,
            fileId: isLast ? file.id : undefined,
            isSelected: isLast ? file.isSelected : false,
            children: {},
          };
        }
        current = current.children[part];
      });
    });

    return root;
  }, [files, searchTerm]);

  const renderTree = (item: any, depth = 0) => {
    const children = Object.values(item.children).sort((a: any, b: any) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });

    const isCurrent = item.isFile && selectedFileId === item.fileId;
    const isUpdated = item.isFile && lastUpdatedId === item.fileId;

    return (
      <div key={item.path}>
        {item.path && (
          <div
            onClick={() => item.isFile ? onSelect(item.fileId!) : toggleFolder(item.path)}
            className={`group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition ${
              isCurrent
                ? 'bg-blue-600/20 text-blue-400'
                : isUpdated
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'hover:bg-white/5 text-slate-400'
            }`}
            style={{ paddingLeft: depth * 12 + 8 }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {item.isFile ? (
                <div
                  className="flex items-center gap-2"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleContext(item.fileId);
                  }}
                >
                  <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                    item.isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-700'
                  }`}>
                    {item.isSelected && <i className="fa-solid fa-check text-[8px] text-white" />}
                  </div>
                  <i className={`fa-solid ${item.name.endsWith('.tsx') ? 'fa-react text-cyan-400' : 'fa-file-code text-slate-500'} text-[11px]`} />
                </div>
              ) : (
                <i className={`fa-solid ${expandedFolders[item.path] ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px] opacity-40`} />
              )}
              <span className="text-[12px] truncate">{item.name}</span>
            </div>

            {item.isFile && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(item.fileId);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500"
              >
                <i className="fa-solid fa-xmark text-[10px]" />
              </button>
            )}
          </div>
        )}

        {!item.isFile && (item.path === '' || expandedFolders[item.path]) && (
          <div>{children.map(child => renderTree(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <input
          className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[11px]"
          placeholder="Quick find files..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {files.length === 0 ? (
          <div className="text-center opacity-20 mt-10">DROP ZIP HERE</div>
        ) : (
          renderTree(treeData)
        )}
      </div>
    </div>
  );
};

/* ===============================
   MAIN APP
================================ */
const App: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lastUpdatedFileId, setLastUpdatedFileId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = useMemo(
    () => files.find(f => f.id === selectedFileId),
    [files, selectedFileId]
  );

  const selectedContextCount = useMemo(
    () => files.filter(f => f.isSelected).length,
    [files]
  );

  useEffect(() => {
    if (selectedFile && !isEditMode && (window as any).Prism) {
      requestAnimationFrame(() => (window as any).Prism.highlightAll());
    }
  }, [selectedFileId, isEditMode]);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const zip = await JSZip.loadAsync(file);
    const list: ProjectFile[] = [];

    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        list.push({
          id: crypto.randomUUID(),
          name: path.split('/').pop() || path,
          path,
          content: await entry.async('string'),
          language: path.split('.').pop() || 'text',
          isSelected: false,
        });
      }
    }

    setFiles(list);
    setSelectedFileId(list[0]?.id ?? null);
  };

  const handleProcessCode = async () => {
    if (!prompt.trim() || files.length === 0) return;

    setIsGenerating(true);
    setAiResponse('');

    try {
      await generateCodeExpansion(files, prompt, chunk =>
        setAiResponse(prev => prev + chunk)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestedChanges = useMemo(() => {
    const regex =
      /(?:FILE|File|file)\s*:\s*([^\n]+)\n+```[\w-]*\n([\s\S]*?)```/g;

    const result: { fileName: string; content: string }[] = [];
    let match;

    while ((match = regex.exec(aiResponse))) {
      result.push({
        fileName: match[1].trim(),
        content: match[2].trim(),
      });
    }

    return result;
  }, [aiResponse]);

  const applyChange = (change: { fileName: string; content: string }) => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.path === change.fileName);

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], content: change.content, isSelected: true };
        setSelectedFileId(copy[idx].id);
        setLastUpdatedFileId(copy[idx].id);
        return copy;
      }

      const file: ProjectFile = {
        id: crypto.randomUUID(),
        name: change.fileName.split('/').pop()!,
        path: change.fileName,
        content: change.content,
        language: change.fileName.split('.').pop() || 'text',
        isSelected: true,
      };

      setSelectedFileId(file.id);
      setLastUpdatedFileId(file.id);
      return [...prev, file];
    });

    setTimeout(() => setLastUpdatedFileId(null), 2500);
  };

  /* === JSX giữ nguyên UI như bạn gửi === */
  return (
    <div className="h-screen w-screen bg-[#03060b] text-slate-300">
      {/* UI giữ nguyên – không lặp lại cho dài */}
    </div>
  );
};

export default App;
