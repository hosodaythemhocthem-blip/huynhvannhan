// components/AiTutor.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Upload,
  Trash2,
  Download,
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabaseClient";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
}

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ==============================
     LOAD USER + INIT CONVERSATION
  ============================== */

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Tìm conversation gần nhất
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
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: "New Chat",
          })
          .select()
          .single();

        if (!error && data) {
          setConversationId(data.id);
        }
      }
    };

    init();
  }, []);

  /* ==============================
     LOAD MESSAGES
  ============================== */

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const formatted = data.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.created_at).getTime(),
      }));

      setMessages(formatted);
    }
  };

  /* ==============================
     AUTO SCROLL
  ============================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ==============================
     SAVE MESSAGE
  ============================== */

  const saveMessage = async (msg: ChatMessage) => {
    if (!conversationId) return;

    await supabase.from("messages").insert({
      id: msg.id,
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
    });
  };

  /* ==============================
     SEND MESSAGE
  ============================== */

  const handleSend = async (customText?: string) => {
    if (!conversationId) return;

    const text = customText || input.trim();
    if (!text || loading) return;

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
        content: aiReply,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(aiMessage);
    } catch (error) {
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
    }
  };

  /* ==============================
     DELETE MESSAGE
  ============================== */

  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  };

  /* ==============================
     CLEAR CHAT
  ============================== */

  const handleClearChat = async () => {
    if (!conversationId) return;

    if (window.confirm("Xóa toàn bộ cuộc trò chuyện?")) {
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);

      setMessages([]);
    }
  };

  /* ==============================
     EXPORT CHAT
  ============================== */

  const exportChat = () => {
    const text = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "lumina-chat.txt");
  };

  /* ==============================
     FILE UPLOAD (PDF + DOCX)
  ============================== */

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!conversationId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText +=
            content.items
              .map((item: any) => ("str" in item ? item.str : ""))
              .join(" ") + "\n";
        }
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        extractedText = result.value;
      } else {
        alert("Chỉ hỗ trợ PDF hoặc DOCX");
        return;
      }

      // Đổi tên file tránh trùng
      const filePath = `${conversationId}/${uuidv4()}-${file.name}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(filePath);

      await supabase.from("uploads").insert({
        conversation_id: conversationId,
        file_name: file.name,
        file_url: publicUrl,
      });

      handleSend(extractedText);
    } catch (err) {
      console.error(err);
      alert("Upload file thất bại");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-[32px] border shadow-2xl overflow-hidden">
      {/* GIỮ NGUYÊN UI CỦA BẠN */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id}>
            <MathPreview content={msg.content} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AiTutor;
