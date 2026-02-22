// components/ImportExamFromFile.tsx
import React, { useState, useRef, DragEvent } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { geminiService } from "../services/geminiService";

// Cấu hình Worker bằng CDN 
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (examData: any) => void; // Trả về object JSON của đề thi thay vì text thô
}

const ImportExamFromFile: React.FC<Props> = ({ isOpen, onClose, onImportSuccess }) => {
  const [loadingStep, setLoadingStep] = useState<"idle" | "reading" | "analyzing">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file) return;

    try {
      setFileName(file.name);
      setLoadingStep("reading");

      const buffer = await file.arrayBuffer();
      let fullText = "";

      // 1. XỬ LÝ ĐỌC FILE (Giữ nguyên logic chuẩn của Thầy)
      if (file.name.toLowerCase().endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        fullText = result.value.trim();
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .filter((item: any) => item && "str" in item)
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText.trim() + "\n\n";
        }
      } else {
        alert("Định dạng file không hỗ trợ. Vui lòng chọn .docx hoặc .pdf");
        setLoadingStep("idle");
        setFileName(null);
        return;
      }

      if (!fullText) throw new Error("File rỗng hoặc không đọc được nội dung.");

      // 2. CHUYỂN QUA AI XỬ LÝ
      setLoadingStep("analyzing");
      const parsedData = await geminiService.parseExamWithAI(fullText);
      
      // 3. HOÀN THÀNH
      onImportSuccess(parsedData);
      
      // Reset state & đóng modal
      setLoadingStep("idle");
      setFileName(null);
      onClose();

    } catch (error) {
      console.error("Lỗi xử lý file:", error);
      alert("Có lỗi xảy ra trong quá trình bóc tách đề thi. Vui lòng kiểm tra lại file.");
      setLoadingStep("idle");
      setFileName(null);
    }
  };

  // --- Xử lý sự kiện Kéo Thả (Drag & Drop) ---
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>✨</span> Tạo đề thi AI từ File
          </h3>
          <button 
            onClick={onClose}
            disabled={loadingStep !== "idle"}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Vùng kéo thả file */}
        <div className="p-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out cursor-pointer
              ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
              ${loadingStep !== "idle" ? 'pointer-events-none opacity-70' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".docx,.pdf"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`p-3 rounded-full ${loadingStep !== "idle" ? 'bg-indigo-100' : 'bg-blue-50'}`}>
                {loadingStep === "idle" ? (
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
              
              {loadingStep === "idle" ? (
                <>
                  <p className="text-sm font-medium text-gray-700">Nhấn để chọn hoặc kéo thả file vào đây</p>
                  <p className="text-xs text-gray-500">Hỗ trợ định dạng Word (.docx) và PDF</p>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-indigo-600">
                    {loadingStep === "reading" ? "Đang trích xuất văn bản..." : "AI đang phân tích và chia câu hỏi..."}
                  </p>
                  <p className="text-xs text-gray-500">{fileName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExamFromFile;
