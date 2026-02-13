// components/AiTutor.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Upload,
  Trash2,
  Download,
  Loader2,
  Copy,
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabaseClient";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CHUNK_SIZE = 6000;

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= INIT ================= */

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.id);
        loadMessages(existing.id);
      } else {
        const { data } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: "New Chat",
          })
          .select()
          .single();

        if (data) setConversationId(data.id);
      }
    };

    init();
  }, []);

  /* ================= LOAD MESSAGES ================= */

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.created_at).getTime(),
        }))
      );
    }
  };

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SAVE MESSAGE ================= */

  const saveMessage = async (msg: ChatMessage) => {
    if (!conversationId) return;

    await supabase.from("messages").insert({
      id: msg.id,
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
    });
  };

  /* ================= SEND ================= */

  const handleSend = async (customText?: string) => {
    if (!conversationId || sendingRef.current) return;

    const text = customText || input.trim();
    if (!text) return;

    sendingRef.current = true;
    setInput("");

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);

    setLoading(true);

    try {
      const aiReply = await askGemini(text);

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "ai",
        content: aiReply || "⚠️ AI không trả lời.",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(aiMessage);
    } catch {
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: "ai",
        content: "❌ AI đang quá tải, thử lại sau.",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, errorMsg]);
      await saveMessage(errorMsg);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  /* ================= DELETE MESSAGE ================= */

  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  };

  /* ================= COPY MESSAGE ================= */

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  /* ================= EXPORT ================= */

  const exportChat = () => {
    const text = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "lumina-chat.txt");
  };

  /* ================= FILE UPLOAD ================= */

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!conversationId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File tối đa 10MB");
      return;
    }

    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText +=
            content.items
              .map((item: any) => ("str" in item ? item.str : ""))
              .join(" ") + "\n";
        }
      } else if (file.type.includes("wordprocessingml")) {
        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        extractedText = result.value;
      } else {
        alert("Chỉ hỗ trợ PDF hoặc DOCX");
        return;
      }

      const filePath = `${conversationId}/${uuidv4()}-${file.name}`;

      await supabase.storage.from("uploads").upload(filePath, file);

      handleSend(extractedText);
    } catch (err) {
      console.error(err);
      alert("Upload thất bại");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ================= UI ================= */

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-[32px] border shadow-2xl overflow-hidden">

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {messages.map((msg) => (
          <div key={msg.id} className="relative group">

            <div className="absolute right-0 top-0 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => copyMessage(msg.content)}>
                <Copy size={14} />
              </button>
              <button onClick={() => deleteMessage(msg.id)}>
                <Trash2 size={14} />
              </button>
            </div>

            <div
              className={`p-4 rounded-2xl ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100"
              }`}
            >
              <MathPreview content={msg.content} />
            </div>
          </div>
        ))}

        {loading && (
          <Loader2 className="animate-spin text-indigo-600" />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 flex gap-2 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập câu hỏi..."
          className="flex-1 border rounded-xl px-4 py-2"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-200 px-3 rounded-xl"
        >
          <Upload size={16} />
        </button>

        <button
          onClick={() => handleSend()}
          className="bg-indigo-600 text-white px-4 rounded-xl"
        >
          <Send size={16} />
        </button>

        <button
          onClick={exportChat}
          className="bg-slate-200 px-3 rounded-xl"
        >
          <Download size={16} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default AiTutor;
