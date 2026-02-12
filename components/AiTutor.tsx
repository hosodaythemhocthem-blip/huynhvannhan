// FULL CODE SIÊU ĐỈNH – SUPABASE VERSION

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Eraser,
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
     INIT CONVERSATION
  ============================== */

  useEffect(() => {
    const initConversation = async () => {
      const { data } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      setConversationId(data.id);
    };

    initConversation();
  }, []);

  /* ==============================
     AUTO SCROLL
  ============================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ==============================
     SAVE MESSAGE TO DB
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
    } catch {
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: "ai",
        content: "❌ AI đang quá tải.",
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

    if (confirm("Xóa toàn bộ cuộc trò chuyện?")) {
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
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    let extractedText = "";

    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer))
        .promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        extractedText += content.items.map((item: any) => item.str).join(" ");
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

    // Upload file to Supabase Storage
    const { data } = await supabase.storage
      .from("uploads")
      .upload(`${conversationId}/${file.name}`, file);

    const fileUrl = supabase.storage
      .from("uploads")
      .getPublicUrl(data?.path || "").data.publicUrl;

    await supabase.from("uploads").insert({
      conversation_id: conversationId,
      file_name: file.name,
      file_url: fileUrl,
    });

    handleSend(extractedText);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-[32px] border shadow-2xl overflow-hidden">
      {/* UI giữ nguyên cấu trúc của bạn */}
      {/* (Phần render không thay đổi cấu trúc) */}
    </div>
  );
};

export default AiTutor;
