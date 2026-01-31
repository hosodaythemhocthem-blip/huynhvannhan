import React, { useState, useRef, useEffect, useMemo } from "react";
import { ProjectFile } from "./types";
import { generateCodeExpansion } from "./services/geminiService";
import JSZip from "jszip";

/* ===============================
   FILE TREE
================================ */
const FileTree: React.FC<{
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
}> = ({ files, selectedFileId, onSelect }) => {
  return (
    <div className="space-y-1">
      {files.map((f) => (
        <div
          key={f.id}
          onClick={() => onSelect(f.id)}
          className={`px-3 py-2 rounded cursor-pointer text-sm truncate
            ${
              selectedFileId === f.id
                ? "bg-blue-600/20 text-blue-400"
                : "hover:bg-white/5 text-slate-400"
            }`}
        >
          {f.path}
        </div>
      ))}
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedFileId),
    [files, selectedFileId]
  );

  /* ===============================
     ZIP UPLOAD
  ================================ */
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const zip = await JSZip.loadAsync(file);
    const list: ProjectFile[] = [];

    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        list.push({
          id: crypto.randomUUID(),
          name: path.split("/").pop() || path,
          path,
          content: await entry.async("string"),
          language: path.split(".").pop() || "text",
          isSelected: false,
        });
      }
    }

    setFiles(list);
    setSelectedFileId(list[0]?.id ?? null);
  };

  /* ===============================
     RUN AI
  ================================ */
  const runAI = async () => {
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

  /* ===============================
     UI
  ================================ */
  return (
    <div className="h-screen w-screen bg-[#0b0f17] text-slate-200 flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-80 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h1 className="text-sm font-semibold text-white mb-3">
            Project Files
          </h1>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 text-xs rounded bg-blue-600 hover:bg-blue-500 transition"
          >
            Upload ZIP
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleZipUpload}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <div className="text-center text-xs opacity-30 mt-10">
              No files loaded
            </div>
          ) : (
            <FileTree
              files={files}
              selectedFileId={selectedFileId}
              onSelect={setSelectedFileId}
            />
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        {/* PROMPT */}
        <div className="p-4 border-b border-white/5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want AI to change..."
            className="w-full h-24 bg-black/40 border border-white/10 rounded p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex justify-end mt-2">
            <button
              onClick={runAI}
              disabled={isGenerating}
              className="px-4 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {isGenerating ? "Running AI..." : "Run AI"}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-white/5">
          {/* FILE VIEW */}
          <section className="p-4 overflow-auto">
            <h2 className="text-xs uppercase tracking-wider opacity-50 mb-2">
              Selected File
            </h2>

            {selectedFile ? (
              <pre className="text-xs bg-black/40 p-4 rounded overflow-auto">
                {selectedFile.content}
              </pre>
            ) : (
              <div className="text-xs opacity-30">No file selected</div>
            )}
          </section>

          {/* AI OUTPUT */}
          <section className="p-4 overflow-auto">
            <h2 className="text-xs uppercase tracking-wider opacity-50 mb-2">
              AI Output
            </h2>

            <pre className="text-xs bg-black/40 p-4 rounded whitespace-pre-wrap">
              {aiResponse || "AI output will appear here..."}
            </pre>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
