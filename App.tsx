import React, { useState, useEffect, useMemo } from "react";
import { ProjectFile } from "./types";
import { generateCodeExpansion } from "./services/geminiService";

/* ===============================
   INTERNAL FILE TREE
================================ */
const InternalFileTree: React.FC<{
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  lastUpdatedId: string | null;
}> = ({ files, selectedFileId, onSelect, lastUpdatedId }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const treeData = useMemo(() => {
    return files.filter((f) =>
      searchTerm
        ? f.path.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );
  }, [files, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5">
        <input
          className="w-full bg-black/40 border border-white/5 rounded px-3 py-2 text-xs"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {treeData.length === 0 && (
          <div className="text-center opacity-30 mt-10">
            No files loaded
          </div>
        )}

        {treeData.map((file) => {
          const isActive = file.id === selectedFileId;
          const isUpdated = file.id === lastUpdatedId;

          return (
            <div
              key={file.id}
              onClick={() => onSelect(file.id)}
              className={`px-2 py-1 text-xs rounded cursor-pointer transition ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : isUpdated
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "hover:bg-white/5 text-slate-400"
              }`}
            >
              {file.path}
            </div>
          );
        })}
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

  const handleRunAI = async () => {
    if (!prompt.trim() || files.length === 0) return;

    setIsGenerating(true);
    setAiResponse("");

    try {
      await generateCodeExpansion(files, prompt, (chunk) =>
        setAiResponse((prev) => prev + chunk)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#03060b] text-slate-300 flex">
      {/* LEFT */}
      <div className="w-64 border-r border-white/5">
        <InternalFileTree
          files={files}
          selectedFileId={selectedFileId}
          onSelect={setSelectedFileId}
          lastUpdatedId={lastUpdatedFileId}
        />
      </div>

      {/* RIGHT */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        <textarea
          className="w-full h-32 bg-black/40 border border-white/5 rounded p-3 text-sm"
          placeholder="Describe what you want AI to change..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={handleRunAI}
          disabled={isGenerating}
          className="self-start px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm transition"
        >
          {isGenerating ? "Generating..." : "Run AI"}
        </button>

        <pre className="flex-1 overflow-auto text-xs whitespace-pre-wrap bg-black/30 border border-white/5 rounded p-4">
          {aiResponse || "AI output will appear here..."}
        </pre>

        {selectedFile && (
          <pre className="text-xs whitespace-pre-wrap bg-black/50 border border-white/5 rounded p-4">
            {selectedFile.content}
          </pre>
        )}
      </div>
    </div>
  );
};

export default App;
