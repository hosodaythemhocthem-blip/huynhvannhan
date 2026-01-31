
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ProjectFile } from './types';
import Button from './components/Button';
import FileTree from './components/FileTree';
import { generateCodeExpansion } from './services/geminiService';
import JSZip from 'jszip';

interface ParsedChange {
  fileName: string;
  content: string;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [lastUpdatedFileId, setLastUpdatedFileId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseEndRef = useRef<HTMLDivElement>(null);

  const selectedFile = files.find(f => f.id === selectedFileId);

  // Improved Regex to catch variations in AI output (case insensitive, handles spaces)
  const suggestedChanges = useMemo(() => {
    const changes: ParsedChange[] = [];
    const fileRegex = /(?:FILE|File|file):\s*([^\s\n]+)\n+```[a-z]*\n([\s\S]*?)```/gi;
    let match;
    
    while ((match = fileRegex.exec(aiResponse)) !== null) {
      changes.push({
        fileName: match[1],
        content: match[2].trim()
      });
    }
    return changes;
  }, [aiResponse]);

  const handleApplyChange = (change: ParsedChange) => {
    setFiles(prev => {
      const existingFileIndex = prev.findIndex(f => f.name === change.fileName);
      if (existingFileIndex >= 0) {
        const newFiles = [...prev];
        newFiles[existingFileIndex] = {
          ...newFiles[existingFileIndex],
          content: change.content
        };
        setLastUpdatedFileId(newFiles[existingFileIndex].id);
        return newFiles;
      } else {
        const newFile: ProjectFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: change.fileName,
          content: change.content,
          language: change.fileName.split('.').pop() || 'text'
        };
        setLastUpdatedFileId(newFile.id);
        return [...prev, newFile];
      }
    });
    
    setTimeout(() => setLastUpdatedFileId(null), 2000);
  };

  const handleApplyAll = () => {
    suggestedChanges.forEach(handleApplyChange);
  };

  const handleExportZip = async () => {
    if (files.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(file.name, file.content);
      });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `architect-project-${new Date().getTime()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Lỗi khi đóng gói file ZIP.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = () => {
    if (confirm("Xác nhận xóa toàn bộ project hiện tại để bắt đầu mới?")) {
      setFiles([]);
      setSelectedFileId(null);
      setAiResponse('');
      setPrompt('');
    }
  };

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    const newFile: ProjectFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFileName,
      content: newFileContent,
      language: newFileName.split('.').pop() || 'text'
    };
    setFiles(prev => [...prev, newFile]);
    setNewFileName('');
    setNewFileContent('');
    setIsAddingFile(false);
    setSelectedFileId(newFile.id);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingZip(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const extractedFiles: ProjectFile[] = [];
      const textExtensions = ['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'json', 'md', 'txt', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'yml', 'yaml', 'xml', 'env'];

      for (const [path, zipEntry] of Object.entries(content.files)) {
        const entry = zipEntry as any;
        if (!entry.dir) {
          const extension = path.split('.').pop()?.toLowerCase() || '';
          const isText = textExtensions.includes(extension) || path.startsWith('.') || !path.includes('.');
          
          if (isText) {
            const fileData = await entry.async('string');
            extractedFiles.push({
              id: Math.random().toString(36).substr(2, 9),
              name: path,
              content: fileData,
              language: extension
            });
          }
        }
      }

      if (extractedFiles.length > 0) {
        setFiles(prev => [...prev, ...extractedFiles]);
        if (!selectedFileId) setSelectedFileId(extractedFiles[0].id);
      }
    } catch (error) {
      console.error("Error processing ZIP:", error);
      alert("Lỗi khi đọc file ZIP.");
    } finally {
      setIsProcessingZip(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessCode = async () => {
    if (!prompt.trim() || files.length === 0) return;
    setIsGenerating(true);
    setAiResponse('');
    try {
      await generateCodeExpansion(files, prompt, (chunk) => {
        setAiResponse(prev => prev + chunk);
      });
    } catch (err) {
      setAiResponse(prev => prev + "\n\n[LỖI: Không thể kết nối Gemini API. Vui lòng kiểm tra lại.]");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFileContent = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      alert("Đã copy nội dung file!");
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(aiResponse);
    alert("Đã copy phản hồi của AI!");
  };

  useEffect(() => {
    if (aiResponse) {
      responseEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiResponse]);

  return (
    <div className="flex h-screen w-full bg-[#0a0f1e] overflow-hidden text-slate-200">
      <input type="file" accept=".zip" ref={fileInputRef} className="hidden" onChange={handleZipUpload} />

      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800/60 bg-[#0d1326] flex flex-col shadow-2xl z-20">
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-[#0d1326]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
              <i className="fa-solid fa-wand-magic-sparkles text-white text-sm"></i>
            </div>
            <h1 className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">ARCHITECT</h1>
          </div>
          <div className="flex gap-1">
             <button onClick={handleClearAll} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors text-slate-500 hover:text-red-400" title="Xóa tất cả">
              <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors text-blue-400" title="Tải ZIP">
              <i className="fa-solid fa-file-zipper"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
          {isProcessingZip ? (
            <div className="p-8 flex flex-col items-center gap-4 text-slate-500">
              <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                 <i className="fa-solid fa-cog animate-spin text-2xl relative"></i>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-400/80">Indexing...</span>
            </div>
          ) : (
            <div className={lastUpdatedFileId ? 'flash-update' : ''}>
               <FileTree files={files} selectedFileId={selectedFileId} onSelect={setSelectedFileId} onDelete={handleRemoveFile} />
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-slate-800/60 bg-[#0d1326]/40 space-y-4">
           <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
             <span>Project Assets</span>
             <span className="text-blue-400">{files.length} Files</span>
           </div>
           <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden ring-1 ring-white/5">
             <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${Math.min(files.length * 3, 100)}%` }}></div>
           </div>
           <Button 
            variant="secondary" 
            className="w-full text-[11px] h-10 font-bold uppercase tracking-wider border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all" 
            onClick={handleExportZip}
            disabled={files.length === 0 || isExporting}
           >
             {isExporting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-down"></i>}
             Export Project
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#0a0f1e] relative">
        <header className="h-14 border-b border-slate-800/60 flex items-center px-8 bg-[#0d1326]/20 justify-between backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
             {selectedFile ? (
               <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[10px] font-mono text-blue-400">
                    {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{selectedFile.name}</span>
               </div>
             ) : (
               <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Development Environment</span>
             )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${isGenerating ? 'bg-blue-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">{isGenerating ? 'AI Architect processing' : 'Core Ready'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 relative">
            {isAddingFile ? (
              <div className="max-w-3xl mx-auto bg-[#0d1326]/90 border border-slate-800/50 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl ring-1 ring-white/5 transition-all">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                    <i className="fa-solid fa-file-circle-plus text-blue-500"></i>
                  </div>
                  Create Resource
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-1 mb-2 block tracking-widest">Entry Name</label>
                    <input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="w-full bg-[#050810] border border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600/30 outline-none transition-all border-slate-800/50 placeholder:text-slate-700" placeholder="e.g., src/components/Header.tsx" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-1 mb-2 block tracking-widest">Initial Content</label>
                    <textarea value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)} className="w-full h-80 bg-[#050810] border border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600/30 outline-none code-font text-sm leading-relaxed border-slate-800/50" placeholder="Paste your source code..." />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" className="rounded-xl px-6" onClick={() => setIsAddingFile(false)}>Cancel</Button>
                    <Button variant="primary" className="px-10 rounded-xl font-black shadow-blue-600/10" onClick={handleAddFile}>Deploy File</Button>
                  </div>
                </div>
              </div>
            ) : selectedFile ? (
              <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div className="bg-[#0d1326]/40 rounded-3xl border border-slate-800/60 overflow-hidden flex-1 flex flex-col shadow-2xl backdrop-blur-sm group">
                   <div className="px-6 py-4 bg-[#0d1326]/80 border-b border-slate-800/60 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <i className="fa-solid fa-code text-blue-500 text-sm"></i>
                        <span className="text-[12px] font-mono text-slate-300 font-bold">{selectedFile.name}</span>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="ghost" className="!p-0 h-8 w-8 hover:bg-slate-700/50" title="Copy Content" onClick={handleCopyFileContent}>
                           <i className="fa-solid fa-copy text-xs"></i>
                        </Button>
                     </div>
                   </div>
                   <textarea value={selectedFile.content} readOnly className="flex-1 w-full bg-transparent p-8 outline-none resize-none code-font text-[13px] leading-relaxed text-slate-400 custom-scrollbar selection:bg-blue-500/20" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                <div className="relative mb-12">
                   <div className="absolute inset-0 bg-blue-600 blur-[100px] opacity-10 animate-pulse"></div>
                   <div className="w-32 h-32 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 rounded-[3rem] flex items-center justify-center border border-white/5 rotate-3 shadow-2xl relative z-10 backdrop-blur-3xl ring-1 ring-white/10">
                    <i className="fa-solid fa-microchip text-7xl text-blue-500 -rotate-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"></i>
                  </div>
                </div>
                <h2 className="text-5xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-600">Gemini Architect</h2>
                <p className="text-slate-400 mb-12 text-xl font-medium leading-relaxed opacity-80">
                  Hệ thống hỗ trợ lập trình thông minh. Tải project từ GitHub để phân tích, sửa lỗi hoặc mở rộng tính năng với sức mạnh của Gemini 3 Pro.
                </p>
                <div className="flex gap-5">
                  <Button variant="primary" className="h-16 px-12 rounded-2xl shadow-2xl shadow-blue-600/20 text-lg font-black group" onClick={() => fileInputRef.current?.click()}>
                    <i className="fa-solid fa-upload group-hover:-translate-y-1 transition-transform"></i> Tải Project ZIP
                  </Button>
                  <Button variant="secondary" className="h-16 px-12 rounded-2xl border-slate-800 bg-white/5 hover:bg-white/10 text-lg font-black" onClick={() => setIsAddingFile(true)}>
                    <i className="fa-solid fa-plus"></i> Manual Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions Panel */}
          <div className="w-[540px] border-l border-slate-800/60 flex flex-col bg-[#0d1326]/40 backdrop-blur-3xl z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)]">
            <div className="p-5 border-b border-slate-800/60 bg-[#0d1326]/60 flex justify-between items-center">
               <h3 className="font-black text-[11px] uppercase tracking-[0.25em] text-slate-500 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                 Cognitive Feed
               </h3>
               <div className="flex gap-2">
                {aiResponse && (
                   <Button variant="ghost" className="h-8 !py-0 !px-3 text-[10px] font-bold border border-slate-800/50 hover:bg-slate-800" onClick={handleCopyResponse}>
                    <i className="fa-solid fa-copy"></i> Copy
                   </Button>
                )}
                {suggestedChanges.length > 0 && (
                  <Button variant="primary" className="!py-1 !px-4 text-[11px] h-8 rounded-xl font-black shadow-lg shadow-blue-600/30 animate-pulse" onClick={handleApplyAll}>
                      Sync All ({suggestedChanges.length})
                  </Button>
                )}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050810]/30">
              {aiResponse ? (
                <div className="space-y-8">
                  <div className="bg-[#0d1326]/60 border border-slate-800/40 rounded-3xl p-7 whitespace-pre-wrap text-[13px] leading-relaxed code-font shadow-2xl text-slate-300 relative selection:bg-blue-600/30">
                    {aiResponse}
                    <div ref={responseEndRef} />
                  </div>
                  
                  {suggestedChanges.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Proposals</p>
                        <span className="bg-blue-600/10 text-blue-400 text-[10px] px-3 py-1 rounded-full border border-blue-500/20 font-black tracking-tighter shadow-inner">
                          {suggestedChanges.length} OBJECTS
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {suggestedChanges.map((change, idx) => (
                          <div key={idx} className="bg-[#0d1326] border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/40 transition-all group/item shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center group-hover/item:bg-blue-600/10 transition-colors border border-slate-800">
                                <i className="fa-solid fa-file-code text-blue-500/40 group-hover/item:text-blue-400"></i>
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[12px] font-mono text-slate-300 truncate w-48 font-bold">{change.fileName}</span>
                                <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">Analysis Complete</span>
                              </div>
                            </div>
                            <Button variant="ghost" className="h-9 !py-0 !px-4 text-[11px] font-black border border-slate-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-xl transition-all" onClick={() => handleApplyChange(change)}>
                              Update
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-14 text-slate-700 space-y-6 opacity-40">
                  <div className="w-20 h-20 border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center">
                    <i className="fa-solid fa-terminal text-3xl"></i>
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.2em]">Standby for instruction</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800/60 bg-[#0d1326] shadow-[0_-20px_50px_rgba(0,0,0,0.6)] z-10">
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleProcessCode()}
                  className="w-full bg-[#050810] border border-slate-800 rounded-3xl p-6 pr-20 focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/60 outline-none transition-all min-h-[180px] text-sm resize-none shadow-inner placeholder:text-slate-700 text-slate-300"
                  placeholder="Ví dụ: 'Phân tích file App.tsx và thêm Dark Mode', 'Optimize thuật toán xử lý dữ liệu', 'Viết tiếp chức năng login sử dụng Firebase'..."
                  disabled={isGenerating}
                />
                <button 
                  onClick={handleProcessCode}
                  disabled={isGenerating || !prompt.trim() || files.length === 0}
                  className="absolute bottom-6 right-6 h-14 w-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 disabled:text-slate-800 rounded-[1.25rem] flex items-center justify-center transition-all text-white shadow-2xl shadow-blue-600/30 active:scale-90 group"
                >
                  {isGenerating ? (
                    <i className="fa-solid fa-circle-notch animate-spin text-xl"></i>
                  ) : (
                    <i className="fa-solid fa-paper-plane-top group-hover:scale-110 group-hover:-rotate-12 transition-all"></i>
                  )}
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600 px-2 font-black uppercase tracking-[0.15em]">
                <div className="flex items-center gap-4">
                   <span>CTRL + ENTER TO SEND</span>
                   <span className="text-blue-900/40">|</span>
                   <span className="flex items-center gap-2"><i className="fa-solid fa-bolt text-amber-900/40"></i> Gemini 3 Pro Engine</span>
                </div>
                <span className="flex items-center gap-2 text-emerald-900/40"><i className="fa-solid fa-circle-check"></i> Project Synced</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }
        .flash-update { animation: flash-glow 2s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes flash-glow {
          0% { background-color: rgba(59, 130, 246, 0.15); box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1); }
          100% { background-color: transparent; box-shadow: none; }
        }
        ::selection { background-color: rgba(59, 130, 246, 0.3); color: white; }
      `}</style>
    </div>
  );
};

export default App;
