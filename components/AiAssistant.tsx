import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, MessageCircle, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { askGemini } from '../services/geminiService';
import MathPreview from './MathPreview';
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { saveMessage, fetchMessages, clearMessages } from '../services/chatService';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface Props {
  context?: string;
}

const AiAssistant: React.FC<Props> = ({ context = "" }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ===== LOAD CHAT VĨNH VIỄN ===== */
  useEffect(() => {
    const load = async () => {
      const data = await fetchMessages();
      if (data.length) {
        setMessages(data.map((m: any) => ({
          role: m.role,
          text: m.text
        })));
      } else {
        setMessages([
          {
            role: 'ai',
            text: 'Xin chào! Tôi là **Lumina AI** ✨\nTôi có thể giúp gì cho bạn?'
          }
        ]);
      }
    };
    load();
  }, []);

  /* ===== AUTO SCROLL ===== */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ===== FILE PARSER ===== */
  const extractText = async (file: File) => {

    if (file.size > 5_000_000) {
      throw new Error("File quá lớn (tối đa 5MB)");
    }

    let text = "";

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ");
      }
    }

    else if (file.type.includes("wordprocessingml")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;
    }

    else {
      throw new Error("Chỉ hỗ trợ PDF hoặc DOCX");
    }

    return text;
  };

  /* ===== HANDLE FILE ===== */
  const handleFileUpload = async (file: File) => {

    setFileName(file.name);
    setLoading(true);

    try {
      const text = await extractText(file);

      const reply = await askGemini(`Phân tích và giải đề sau:\n\n${text}`);

      const newMessages = [
        { role: 'user' as const, text: `📎 ${file.name}` },
        { role: 'ai' as const, text: reply || 'AI không trả lời.' }
      ];

      setMessages(prev => [...prev, ...newMessages]);

      for (const m of newMessages) {
        await saveMessage(m.role, m.text);
      }

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===== HANDLE SEND ===== */
  const handleSend = async () => {

    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');

    const userMessage = { role: 'user' as const, text: userMsg };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage('user', userMsg);

    setLoading(true);

    try {
      const finalPrompt = context
        ? `Ngữ cảnh: ${context}\n\nCâu hỏi: ${userMsg}`
        : userMsg;

      const reply = await askGemini(finalPrompt);

      const aiMessage = {
        role: 'ai' as const,
        text: reply || '⚠️ AI không trả lời.'
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessage('ai', aiMessage.text);

    } catch {
      alert("Lỗi AI");
    } finally {
      setLoading(false);
    }
  };

  /* ===== CLEAR CHAT ===== */
  const handleClear = async () => {
    await clearMessages();
    setMessages([]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-[24px]"
        >
          <MessageCircle size={28} />
        </button>
      ) : (
        <div className="w-[380px] h-[600px] bg-white rounded-[32px] shadow-2xl flex flex-col">

          <header className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sparkles size={20} />
              <h4 className="font-bold text-sm">Lumina AI Tutor</h4>
            </div>

            <div className="flex gap-3">
              <button onClick={handleClear}>
                <Trash2 size={18} />
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 p-5 overflow-y-auto bg-slate-50 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                  {msg.role === 'ai'
                    ? <MathPreview math={msg.text} />
                    : <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
              </div>
            ))}

            {loading && <Loader2 className="animate-spin" />}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 bg-slate-200 rounded-xl"
            >
              <Paperclip size={16} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />

            <input
              ref={inputRef}
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 border rounded-xl px-4"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl"
            >
              <Send size={16} />
            </button>
          </div>

          {fileName && (
            <p className="text-[10px] p-2 text-slate-400">
              📎 {fileName}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
