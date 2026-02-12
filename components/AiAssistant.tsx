import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, MessageCircle, Loader2, Paperclip } from 'lucide-react';
import { askGemini } from '../services/geminiService';
import MathPreview from './MathPreview';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface Props {
  context?: string;
}

const AiAssistant: React.FC<Props> = ({ context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Xin chào! Tôi là **Lumina AI** ✨\nTôi có thể giúp gì cho bạn về Toán học hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Auto scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  /* Focus input */
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  /* ===== HANDLE FILE UPLOAD ===== */
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const text = await file.text(); // đọc nội dung file
      const prompt = `Phân tích nội dung đề sau và hỗ trợ giải:\n\n${text}`;

      const reply = await askGemini(prompt);

      setMessages(prev => [
        ...prev,
        { role: 'user', text: `📎 Đã gửi file: ${file.name}` },
        { role: 'ai', text: reply || 'AI không trả lời.' }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ Không thể đọc file. Vui lòng kiểm tra định dạng.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ===== HANDLE SEND ===== */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const finalPrompt = context
        ? `Ngữ cảnh: ${context}\n\nCâu hỏi: ${userMsg}`
        : userMsg;

      const reply = await askGemini(finalPrompt);

      setMessages(prev => [
        ...prev,
        { role: 'ai', text: reply || '⚠️ AI không trả về nội dung.' }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ Lỗi kết nối AI. Kiểm tra cấu hình API.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl hover:scale-110 transition-all hover:rotate-3"
        >
          <MessageCircle size={28} />
        </button>
      ) : (
        <div className="w-[380px] h-[600px] max-h-[80vh] bg-white rounded-[32px] shadow-2xl border flex flex-col overflow-hidden">

          {/* HEADER */}
          <header className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-yellow-300" />
              <div>
                <h4 className="font-bold text-sm">Lumina AI Tutor</h4>
                <p className="text-[10px] opacity-60 uppercase">Trợ lý học tập</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </header>

          {/* MESSAGES */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm shadow ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  {msg.role === 'ai' ? (
                    <MathPreview math={msg.text} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <Loader2 size={18} className="animate-spin text-indigo-600" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-2">

              {/* FILE BUTTON */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-xl flex items-center justify-center"
              >
                <Paperclip size={16} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <input
                ref={inputRef}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập câu hỏi Toán học..."
                className="flex-1 border rounded-xl px-4 py-2 text-sm"
              />

              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>

            {fileName && (
              <p className="text-[10px] mt-2 text-slate-400">
                📎 File đã chọn: {fileName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
