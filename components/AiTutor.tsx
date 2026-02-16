import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, Loader2, Paperclip, Trash2, 
  Clipboard, RotateCcw, Copy, Bot, User 
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AiTutor: React.FC<{ user: { id: string, fullName: string } }> = ({ user }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load lịch sử vĩnh viễn
  useEffect(() => {
    const loadChat = async () => {
      const { data } = await (supabase.from('messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }) as any);
      if (data && data.length > 0) setMessages(data);
      else setMessages([{ role: 'ai', text: `Chào Thầy/Em **${user.fullName}**, tôi là trợ lý Lumina. Hãy dán đề bài hoặc tải file lên nhé!` }]);
    };
    loadChat();
  }, [user.id]);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInput(prev => prev + text);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input; setInput(""); setLoading(true);

    const { data: userMsg } = await (supabase.from('messages').insert({ user_id: user.id, role: 'user', text: userText }).select().single() as any);
    setMessages(prev => [...prev, userMsg]);

    const reply = await askGemini(userText);
    const { data: aiMsg } = await (supabase.from('messages').insert({ user_id: user.id, role: 'ai', text: reply }).select().single() as any);
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const deleteMessage = async (id: string) => {
    if (confirm("Xóa tin nhắn này vĩnh viễn?")) {
      await (supabase.from('messages').delete().eq('id', id) as any);
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="text-indigo-400" />
          <h2 className="font-black italic uppercase tracking-tighter">Lumina AI Tutor</h2>
        </div>
        <button onClick={() => setMessages([])} className="p-2 hover:bg-white/10 rounded-lg"><RotateCcw size={18}/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'}`}>
              {msg.role === 'ai' ? <MathPreview content={msg.text} /> : msg.text}
              {msg.id && (
                <button onClick={() => deleteMessage(msg.id)} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white p-1 rounded-full"><Trash2 size={10}/></button>
              )}
            </div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin text-indigo-600" />}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-white border-t flex gap-2 items-center">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-3 bg-slate-100 rounded-xl resize-none outline-none" placeholder="Dán đề vào đây (Ctrl+V)..." />
        <button onClick={handlePaste} className="p-3 text-slate-400 hover:text-indigo-600"><Clipboard size={20}/></button>
        <button onClick={handleSend} className="p-4 bg-indigo-600 text-white rounded-xl shadow-lg"><Send size={20}/></button>
      </div>
    </div>
  );
};
export default AiTutor;
