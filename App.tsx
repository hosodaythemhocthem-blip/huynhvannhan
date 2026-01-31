
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ProjectFile } from './types';
import Button from './components/Button';
import { generateCodeExpansion } from './services/geminiService';
import JSZip from 'jszip';

// --- BẮT ĐẦU PHẦN COMPONENT FILE TREE NỘI BỘ ---
interface TreeItem {
  name: string;
  path: string;
  isFile: boolean;
  fileId?: string;
  isSelected?: boolean;
  children: Record<string, TreeItem>;
}

const InternalFileTree: React.FC<{
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleContext: (id: string) => void;
}> = ({ files, selectedFileId, onSelect, onDelete, onToggleContext }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'root': true, 'src': true });
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const treeData = useMemo(() => {
    const root: TreeItem = { name: 'root', path: '', isFile: false, children: {} };
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

  const renderTree = (item: TreeItem, depth: number = 0) => {
    const sortedChildren = Object.values(item.children).sort((a, b) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });
    const isCurrentFile = item.isFile && selectedFileId === item.fileId;

    return (
      <div key={item.path} className="select-none">
        {item.path !== '' && (
          <div 
            className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-all duration-150 ${
              isCurrentFile ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5 text-slate-400'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => item.isFile ? onSelect(item.fileId!) : toggleFolder(item.path)}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {item.isFile ? (
                <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); if (item.fileId) onToggleContext(item.fileId); }}>
                  <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${item.isSelected ? 'bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'border-slate-700'}`}>
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
              <button onClick={(e) => { e.stopPropagation(); onDelete(item.fileId!); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition-opacity">
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
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 group-focus-within:text-blue-500 transition-colors"></i>
          <input type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-[11px] outline-none focus:border-blue-500/30 transition-all placeholder:text-slate-800 text-slate-300" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">{files.length === 0 ? <div className="p-8 text-center opacity-20 mt-4"><i className="fa-solid fa-folder-plus text-3xl mb-3"></i><p className="text-[10px] font-black uppercase tracking-widest">No Files Loaded</p></div> : renderTree(treeData)}</div>
    </div>
  );
};
// --- KẾT THÚC PHẦN COMPONENT FILE TREE NỘI BỘ ---

interface ParsedChange {
  fileName: string;
  content: string;
}

declare const Prism: any;

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
    if (selectedFile && !isEditMode && typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [selectedFile, isEditMode, files]);

  useEffect(() => {
    if (aiResponse && typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }, [aiResponse]);

  const suggestedChanges = useMemo(() => {
    const changes: ParsedChange[] = [];
    const fileRegex = /(?:FILE|File|file):\s*([^\s\n]+)\n+```[a-z]*\n([\s\S]*?)```/gi;
    let match;
    while ((match = fileRegex.exec(aiResponse)) !== null) {
      changes.push({ fileName: match[1], content: match[2].trim() });
    }
    return changes;
  }, [aiResponse]);

  const handleApplyChange = (change: ParsedChange) => {
    const isConfig = change.fileName.includes('vite.config') || change.fileName.includes('package.json');
    if (isConfig && !confirm(`Phát hiện AI muốn thay đổi file hệ thống: ${change.fileName}. Áp dụng?`)) return;

    setFiles(prev => {
      const existingFileIndex = prev.findIndex(f => f.path === change.fileName);
      if (existingFileIndex >= 0) {
        const newFiles = [...prev];
        newFiles[existingFileIndex] = { ...newFiles[existingFileIndex], content: change.content, isSelected: true };
        setLastUpdatedFileId(newFiles[existingFileIndex].id);
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
        return [...prev, newFile];
      }
    });
    setTimeout(() => setLastUpdatedFileId(null), 2000);
  };

  const handleToggleContext = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isSelected: !f.isSelected } : f));
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const extractedFiles: ProjectFile[] = [];
      const textExtensions = ['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'json', 'md', 'txt', 'env'];
      
      for (const [path, zipEntry] of Object.entries(content.files)) {
        if (!zipEntry.dir) {
          const extension = path.split('.').pop()?.toLowerCase() || '';
          if (textExtensions.includes(extension) || path.startsWith('.')) {
            const fileData = await zipEntry.async('string');
            extractedFiles.push({
              id: Math.random().toString(36).substr(2, 9),
              name: path.split('/').pop() || path,
              path: path,
              content: fileData,
              language: extension,
              isSelected: false
            });
          }
        }
      }
      if (extractedFiles.length > 0) {
        setFiles(extractedFiles);
        setSelectedFileId(extractedFiles[0].id);
      }
    } catch (error) {
      alert("Lỗi khi giải nén ZIP.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessCode = async () => {
    if (!prompt.trim() || files.length === 0) return;
    setIsGenerating(true);
    setAiResponse('');
    try {
      await generateCodeExpansion(files, prompt, (chunk) => setAiResponse(prev => prev + chunk));
    } catch (err: any) {
      setAiResponse(prev => prev + `\n\n[ERROR: ${err.message}]`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050810] text-slate-300 overflow-hidden">
      <input type="file" accept=".zip" ref={fileInputRef} className="hidden" onChange={handleZipUpload} />
      
      <aside className="w-[300px] border-r border-white/5 bg-[#0b1120] flex flex-col z-20">
        <div className="p-5 border-b border-white/5 bg-black/40">
          <h1 className="font-black text-[11px] tracking-[0.2em] text-white">LMS ARCHITECT</h1>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* Sử dụng component nội bộ */}
          <InternalFileTree 
            files={files} 
            selectedFileId={selectedFileId} 
            onSelect={setSelectedFileId} 
            onDelete={(id) => setFiles(prev => prev.filter(f => f.id !== id))}
            onToggleContext={handleToggleContext}
          />
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-600 uppercase tracking-widest">Context</span>
            <span className="text-blue-400">{selectedContextCount} Linked</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="h-8 text-[10px]" onClick={() => fileInputRef.current?.click()}>ZIP IN</Button>
            <Button variant="primary" className="h-8 text-[10px]" onClick={() => {
              const zip = new JSZip();
              files.forEach(f => zip.file(f.path, f.content));
              zip.generateAsync({type:"blob"}).then(c => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(c); a.download = 'project.zip'; a.click();
              });
            }}>ZIP OUT</Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#070b14] relative">
        <header className="h-14 border-b border-white/5 flex items-center px-6 bg-[#0d1326]/40 justify-between">
          <div className="text-[12px] font-mono text-slate-500 truncate max-w-lg font-bold">
             {selectedFile ? selectedFile.path : "STANDBY"}
          </div>
          <div className="flex items-center gap-3">
             {selectedFile && (
               <div className="flex bg-black/60 p-1 rounded-lg border border-white/5">
                 <button onClick={() => setIsEditMode(false)} className={`px-3 py-1 rounded text-[10px] font-black ${!isEditMode ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>VIEW</button>
                 <button onClick={() => setIsEditMode(true)} className={`px-3 py-1 rounded text-[10px] font-black ${isEditMode ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>EDIT</button>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6 bg-dots">
            {selectedFile ? (
              <div className={`h-full bg-[#0d1326]/40 rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-2xl ${lastUpdatedFileId === selectedFile.id ? 'ring-2 ring-blue-500' : ''}`}>
                 <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                    {isEditMode ? (
                      <textarea 
                        value={selectedFile.content} 
                        onChange={(e) => setFiles(prev => prev.map(f => f.id === selectedFileId ? { ...f, content: e.target.value } : f))} 
                        className="w-full h-full bg-transparent outline-none resize-none code-font text-[13px] text-slate-300" 
                        spellCheck={false} 
                      />
                    ) : (
                      <pre className={`language-${selectedFile.language}`}><code className={`language-${selectedFile.language}`}>{selectedFile.content}</code></pre>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                 <i className="fa-solid fa-code text-5xl mb-4"></i>
                 <p className="text-sm font-bold uppercase tracking-widest">Select file to preview</p>
              </div>
            )}
          </div>

          <div className="w-[450px] border-l border-white/5 flex flex-col bg-[#0b1120]/90">
            <div className="p-4 border-b border-white/5 bg-black/30 flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI ARCHITECT</span>
               {suggestedChanges.length > 0 && (
                 <button onClick={() => suggestedChanges.forEach(handleApplyChange)} className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-black uppercase">SYNC ALL</button>
               )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {aiResponse ? (
                <div className="space-y-4">
                  <div className="bg-[#050810] border border-white/5 rounded-xl p-4 text-[12px] leading-relaxed text-slate-400 whitespace-pre-wrap code-font">
                    {aiResponse}
                    <div ref={responseEndRef} />
                  </div>
                  
                  {suggestedChanges.map((change, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-blue-500/40">
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span className="text-[11px] font-bold text-slate-300 truncate">{change.fileName.split('/').pop()}</span>
                        <span className="text-[8px] text-slate-600 truncate">{change.fileName}</span>
                      </div>
                      <button onClick={() => handleApplyChange(change)} className="text-[9px] font-black text-blue-400 border border-blue-400/20 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all">APPLY</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <i className="fa-solid fa-brain text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Command</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/60">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 pr-12 focus:border-blue-500/50 outline-none min-h-[120px] text-xs text-slate-300 placeholder:text-slate-800"
                  placeholder="Enter instruction..."
                  disabled={isGenerating}
                />
                <button 
                  onClick={handleProcessCode}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-4 right-4 h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500"
                >
                  <i className={`fa-solid ${isGenerating ? 'fa-circle-notch animate-spin' : 'fa-bolt'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        .bg-dots { background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 20px 20px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.1); border-radius: 10px; }
        pre[class*="language-"] { padding: 0 !important; margin: 0 !important; background: transparent !important; }
      `}</style>
    </div>
  );
};

export default App;
