import React, { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { geminiService } from "../services/geminiService"
import MathPreview from "./MathPreview"

interface Message {
  id: string
  role: "user" | "ai"
  text: string
}

const AiTutor: React.FC<{ user: { id: string; full_name: string } }> = ({
  user,
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "ai",
        text: `Chào ${user.full_name}, tôi là Lumina AI.`,
      },
    ])
  }, [user.full_name])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: input,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const reply = await geminiService.askGemini(input)

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: reply,
        },
      ])
    } catch {
      alert("AI lỗi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "ai" ? (
              <MathPreview content={msg.text} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        {loading && <Loader2 className="animate-spin" />}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 bg-slate-100 rounded-xl"
        />
        <button
          onClick={handleSend}
          className="p-3 bg-indigo-600 text-white rounded-xl"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

export default AiTutor
