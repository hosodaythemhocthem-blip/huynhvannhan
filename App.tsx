
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ProjectFile } from './types';
import Button from './components/Button';
import { generateCodeExpansion } from './services/geminiService';
import JSZip from 'jszip';

// --- COMPONENT FILE TREE NỘI BỘ (Tối ưu giao diện) ---
const InternalFileTree: React.FC<{
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleContext: (id: string) => void;
  lastUpdatedId: string | null;
}> = ({ files, selectedFileId, onSelect, onDelete, onToggleContext, lastUpdatedId }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'root': true, 'src': true });
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
          current.children[part] = { name: part, path: currentPath, isFile: isLast, fileId: isLast ? file.id : undefined, isSelected: isLast ? file.isSelected : false, children: {} };
        }
        current = current.children[part];
      });
    });
    return root;
  }, [files, searchTerm]);

  const renderTree = (item: any, depth: number = 0) => {
    const sortedChildren = Object.values(item.children).sort((a: any, b: any) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });
    const isCurrentFile = item.isFile && selectedFileId === item.fileId;
    const isRecentlyUpdated = item.isFile && lastUpdatedId === item.fileId;

    return (
      <div key={item.path} className="select-none">
        {item.path !== '' && (
          <div 
            className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-all duration-300 ${
              isCurrentFile ? 'bg-blue-600/20 text-blue-400' : isRecentlyUpdated ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-400'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => item.isFile ? onSelect(item.fileId!) : toggleFolder(item.path)}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {item.isFile ? (
                <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); if (item.fileId) onToggleContext(item.fileId); }}>
                  <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${item.isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-700'}`}>
                    {item.isSelected && <i className="fa-solid fa-check text-[8px] text-white"></i>}
                  </div>
                  <i className={`fa-solid ${item.name.endsWith('.tsx') ? 'fa-react text-cyan-400' : 'fa-file-code text-slate-500'} text-[11px]`}></i>
                </div>
              ) : (
                <i className={`fa-solid ${expandedFolders[item.path] ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px] opacity-40 w-3`}></i>
              )}
              {!item.isFile && <i className={`fa-solid ${expandedFolders[item.path] ? 'fa-folder-open text-blue-400/60' : 'fa-folder text-blue-400/60'} text-[11px]`}></i>}
              <span className={`text-[12px] truncate ${isCurrentFile ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
            </div>
            {item.isFile && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(item.fileId!); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1">
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            )}
          </div>
        )}
        {(!item.isFile && (item.path === '' || expandedFolders[item.path])) && (
          <div className="flex flex-col">{sortedChildren.map(child => renderTree(child, depth + (item.path === '' ? 0 : 1)))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 pt-2">
        <input type="text" placeholder="Quick find files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg pl-3 pr-3 py-2 text-[11px] outline-none focus:border-blue-500/30 text-slate-300" />
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
        {files.length === 0 ? <div className="p-8 text-center opacity-20 mt-4"><i className="fa-solid fa-cloud-arrow-up text-3xl mb-3"></i><p className="text-[10px]">DROP ZIP HERE</p></div> : renderTree(treeData)}
      </div>
    </div>
  );
};

// --- APP MAIN ---
const App: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [lastUpdatedFileId, setLastUpdatedFileId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseEndRef = useRef<HTMLDivElement>(null);

  const selectedFile = useMemo(() => files.find(f => f.id === selectedFileId), [files, selectedFileId]);
  const selectedContextCount = useMemo(() => files.filter(f => f.isSelected).length, [files]);

  useEffect(() => {
    if (selectedFile && !isEditMode && (window as any).Prism) {
      (window as any).Prism.highlightAll();
    }
  }, [selectedFile, isEditMode, files]);

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      alert('Code copied to clipboard!');
    }
  };

  const handleApplyChange = (change: { fileName: string, content: string }) => {
    setFiles(prev => {
      const existingFileIndex = prev.findIndex(f => f.path === change.fileName);
      if (existingFileIndex >= 0) {
        const newFiles = [...prev];
        newFiles[existingFileIndex] = { ...newFiles[existingFileIndex], content: change.content, isSelected: true };
        setLastUpdatedFileId(newFiles[existingFileIndex].id);
        setSelectedFileId(newFiles[existingFileIndex].id);
        return newFiles;
      } else {
        const newFile: ProjectFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: change.fileName.split('/').pop() || change.fileName,
          path: change.fileName,
          content: change.content,
          language: change.fileName.split('.').pop() || 'text',
          isSelected: true
        };
        setLastUpdatedFileId(newFile.id);
        setSelectedFileId(newFile.id);
        return [...prev, newFile];
      }
    });
    setTimeout(() => setLastUpdatedFileId(null), 3000);
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const extractedFiles: ProjectFile[] = [];
      for (const [path, zipEntry] of Object.entries(content.files)) {
        if (!zipEntry.dir) {
          const fileData = await zipEntry.async('string');
          extractedFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: path.split('/').pop() || path,
            path: path,
            content: fileData,
            language: path.split('.').pop() || 'text',
            isSelected: false
          });
        }
      }
      setFiles(extractedFiles);
      if (extractedFiles.length > 0) setSelectedFileId(extractedFiles[0].id);
    } catch (e) { alert("Zip error"); }
  };

  const handleProcessCode = async () => {
    if (!prompt.trim() || files.length === 0) return;
    setIsGenerating(true);
    setAiResponse('');
    try {
      await generateCodeExpansion(files, prompt, (chunk) => setAiResponse(prev => prev + chunk));
    } catch (err: any) {
      setAiResponse(p => p + `\n\nError: ${err.message}`);
    } finally { setIsGenerating(false); }
  };

  const suggestedChanges = useMemo(() => {
    const changes: { fileName: string, content: string }[] = [];
    const fileRegex = /(?:FILE|File|file):\s*([^\s\n]+)\n+```[a-z]*\n([\s\S]*?)```/gi;
    let match;
    while ((match = fileRegex.exec(aiResponse)) !== null) {
      changes.push({ fileName: match[1], content: match[2].trim() });
    }
    return changes;
  }, [aiResponse]);

  return (
    <div className="flex h-screen w-full bg-[#03060b] text-slate-300 overflow-hidden">
      <input type="file" accept=".zip" ref={fileInputRef} className="hidden" onChange={handleZipUpload} />
      
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-white/5 bg-[#080d1a] flex flex-col z-20">
        <div className="p-5 border-b border-white/5 bg-blue-600/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h1 className="font-black text-[10px] tracking-widest text-white uppercase">LMS Architect v2</h1>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <InternalFileTree 
            files={files} 
            selectedFileId={selectedFileId} 
            onSelect={setSelectedFileId} 
            onDelete={(id) => setFiles(prev => prev.filter(f => f.id !== id))}
            onToggleContext={(id) => setFiles(prev => prev.map(f => f.id === id ? {...f, isSelected: !f.isSelected} : f))}
            lastUpdatedId={lastUpdatedFileId}
          />
        </div>
        <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
          <Button variant="secondary" className="flex-1 text-[10px]" onClick={() => fileInputRef.current?.click()}>IMPORT ZIP</Button>
          <Button variant="primary" className="flex-1 text-[10px]" onClick={() => {
            const zip = new JSZip();
            files.forEach(f => zip.file(f.path, f.content));
            zip.generateAsync({type:"blob"}).then(c => {
              const a = document.createElement('a'); a.href = URL.createObjectURL(c); a.download = 'project-lms.zip'; a.click();
            });
          }}>EXPORT</Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-[#050810]">
        <header className="h-12 border-b border-white/5 flex items-center px-6 bg-[#080d1a]/50 justify-between">
          <div className="text-[11px] font-mono text-slate-400 truncate max-w-lg">
             {selectedFile ? `PROJECT > ${selectedFile.path.toUpperCase()}` : "ARCHITECT SYSTEM STANDBY"}
          </div>
          <div className="flex items-center gap-2">
             {selectedFile && (
               <>
                 <button onClick={handleCopyCode} className="text-slate-500 hover:text-white transition-colors" title="Copy code">
                   <i className="fa-regular fa-copy text-xs"></i>
                 </button>
                 <div className="flex bg-black/40 p-1 rounded-md border border-white/5 ml-2">
                   <button onClick={() => setIsEditMode(false)} className={`px-2 py-0.5 rounded text-[9px] font-bold ${!isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500'}`}>PREVIEW</button>
                   <button onClick={() => setIsEditMode(true)} className={`px-2 py-0.5 rounded text-[9px] font-bold ${isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500'}`}>MANUAL EDIT</button>
                 </div>
               </>
             )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-4 bg-dots">
            {selectedFile ? (
              <div className={`h-full bg-[#080d1a]/80 rounded-xl border border-white/5 flex flex-col overflow-hidden transition-all duration-500 ${lastUpdatedFileId === selectedFile.id ? 'ring-1 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'shadow-2xl'}`}>
                 <div className="flex-1 p-4 overflow-auto custom-scrollbar">
                    {isEditMode ? (
                      <textarea 
                        value={selectedFile.content} 
                        onChange={(e) => setFiles(prev => prev.map(f => f.id === selectedFileId ? { ...f, content: e.target.value } : f))} 
                        className="w-full h-full bg-transparent outline-none resize-none code-font text-[12px] text-slate-300 leading-relaxed" 
                        spellCheck={false} 
                      />
                    ) : (
                      <pre className={`language-${selectedFile.language}`}><code className={`language-${selectedFile.language}`}>{selectedFile.content}</code></pre>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                 <i className="fa-solid fa-microchip text-6xl mb-4"></i>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Load Project To Start</p>
              </div>
            )}
          </div>

          {/* AI Panel */}
          <div className="w-[420px] border-l border-white/5 flex flex-col bg-[#080d1a]/95 backdrop-blur-xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
               <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">System Engine</span>
               <div className="flex gap-2">
                 <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{selectedContextCount} Docs Linked</span>
                 {suggestedChanges.length > 0 && (
                   <button onClick={() => suggestedChanges.forEach(handleApplyChange)} className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold animate-pulse">APPLY ALL</button>
                 )}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {aiResponse ? (
                <div className="space-y-4">
                  <div className="bg-[#03060b] border border-white/5 rounded-xl p-4 text-[12px] leading-relaxed text-slate-400 whitespace-pre-wrap code-font">
                    {aiResponse}
                    <div ref={responseEndRef} />
                  </div>
                  {suggestedChanges.map((change, idx) => (
                    <div key={idx} className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-3 flex items-center justify-between group">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-bold text-slate-300 truncate">{change.fileName.split('/').pop()}</span>
                        <span className="text-[8px] text-slate-500 truncate">{change.fileName}</span>
                      </div>
                      <button onClick={() => handleApplyChange(change)} className="text-[9px] font-black text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all">SYNC</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <i className="fa-solid fa-head-side-virus text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Command</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/40">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 pr-12 focus:border-blue-500/50 outline-none min-h-[100px] text-xs text-slate-300 placeholder:text-slate-800"
                  placeholder="Describe your next feature or refactor..."
                  disabled={isGenerating}
                />
                <button 
                  onClick={handleProcessCode}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-30 shadow-lg shadow-blue-900/20"
                >
                  <i className={`fa-solid ${isGenerating ? 'fa-spinner animate-spin' : 'fa-paper-plane'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        .bg-dots { background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 24px 24px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.1); border-radius: 10px; }
        pre[class*="language-"] { padding: 0 !important; margin: 0 !important; }
      `}</style>
    </div>
  );
};

export default App;
