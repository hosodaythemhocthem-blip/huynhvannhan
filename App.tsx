import React, { useState, useRef, useEffect, useMemo } from "react";
import { ProjectFile } from "./types";
import Button from "./components/Button";
import { generateCodeExpansion } from "./services/geminiService";

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
}> = ({
  files,
  selectedFileId,
  onSelect,
  onDelete,
  onToggleContext,
  lastUpdatedId,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
    { root: true, src: true }
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleFolder = (path: string) => {
    setExpandedFolders((p) => ({ ...p, [path]: !p[path] }));
  };

  const treeData = useMemo(() => {
    const root = { name: "root", path: "", isFile: false, children: {} as any };

    files.forEach((file) => {
      if (
        searchTerm &&
        !file.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return;

      const parts = file.path.split("/");
      let current = root;
      let currentPath = "";

      parts.forEach((part, idx) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = idx === parts.length - 1;

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
    const children = Object.values(item.children).sort((a: any, b: any) =>
      a.isFile === b.isFile
        ? a.name.localeCompare(b.name)
        : a.isFile
        ? 1
        : -1
    );

    const isCurrent = item.isFile && selectedFileId === item.fileId;
    const isUpdated = item.isFile && lastUpdatedId === item.fileId;

    return (
      <div key={item.path}>
        {item.path && (
          <div
            onClick={() =>
              item.isFile ? onSelect(item.fileId!) : toggleFolder(item.path)
            }
            className={`group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition ${
              isCurrent
                ? "bg-blue-600/20 text-blue-400"
                : isUpdated
                ? "bg-emerald-500/20 text-emerald-400"
                : "hover:bg-white/5 text-slate-400"
            }`}
            style={{ paddingLeft: depth * 12 + 8 }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[12px] truncate">{item.name}</span>
            </div>
          </div>
        )}

        {!item.isFile &&
          (item.path === "" || expandedFolders[item.path]) && (
            <div>{children.map((c) => renderTree(c, depth + 1))}</div>
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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {files.length === 0 ? (
          <div className="text-center opacity-20 mt-10">
            ZIP upload disabled (build-safe)
          </div>
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
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdatedFileId, setLastUpdatedFileId] =
    useState<string | null>(null);

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedFileId),
    [files, selectedFileId]
  );

  useEffect(() => {
    if ((window as any).Prism) {
      requestAnimationFrame(() =>
        (window as any).Prism.highlightAll()
      );
    }
  }, [selectedFileId]);

  const handleProcessCode = async () => {
    if (!prompt.trim() || files.length === 0) return;

    setIsGenerating(true);
    setAiResponse("");

    try {
      await generateCodeExpansion(files, prompt, (chunk) =>
        setAiResponse((p) => p + chunk)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#03060b] text-slate-300 flex">
      <div className="w-64 border-r border-white/5">
        <InternalFileTree
          files={files}
          selectedFileId={selectedFileId}
          onSelect={setSelectedFileId}
          onDelete={() => {}}
          onToggleContext={() => {}}
          lastUpdatedId={lastUpdatedFileId}
        />
      </div>

      <div className="flex-1 p-6">
        <textarea
          className="w-full h-32 bg-black/40 border border-white/5 rounded-lg p-3 text-sm"
          placeholder="Describe what you want AI to change..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <Button
          className="mt-4"
          onClick={handleProcessCode}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Run AI"}
        </Button>

        <pre className="mt-6 text-xs whitespace-pre-wrap">
          {aiResponse}
        </pre>
      </div>
    </div>
  );
};

export default App;
