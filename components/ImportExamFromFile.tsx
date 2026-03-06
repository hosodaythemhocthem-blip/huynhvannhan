import React, { useState, useRef, DragEvent } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { geminiService } from "../services/geminiService";

// Cấu hình Worker bằng CDN 
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (examData: any) => void; 
}

const ImportExamFromFile: React.FC<Props> = ({ isOpen, onClose, onImportSuccess }) => {
  // Thêm trạng thái "uploading" cho ảnh
  const [loadingStep, setLoadingStep] = useState<"idle" | "reading" | "analyzing" | "uploading">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LINK GOOGLE SCRIPT CỦA BẠN (Đã cập nhật code lưu vào folder 1Yx... ở bước trước)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyyI-Nbef4rbynbtiJgW5BwtKTybxeRsiRhTha23XNpc95N7TDt6l-O9lgFpjpVS4IX9w/exec';

  if (!isOpen) return null;

  // Hàm hỗ trợ chuyển File Ảnh sang Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Cắt bỏ phần mào đầu "data:image/png;base64,"
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    try {
      setFileName(file.name);
      
      // ==========================================
      // NHÁNH 1: NẾU FILE LÀ ẢNH (Tải lên Google Drive)
      // ==========================================
      if (file.type.startsWith("image/")) {
        setLoadingStep("uploading");
        
        const base64Data = await convertToBase64(file);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            base64: base64Data,
          }),
        });

        const data = await response.json();

        if (data.status === 'error') {
          throw new Error(data.message || "Lỗi từ Google Drive");
        }

        // Tải ảnh thành công, trả dữ liệu về Component cha
        // Trả về type: 'image' kèm theo link ảnh để hiển thị đề trắc nghiệm
        onImportSuccess({ 
          type: 'image_exam', 
          imageUrl: data.fileUrl, 
          title: file.name 
        });

        setLoadingStep("idle");
        setFileName(null);
        onClose();
        return; // Kết thúc hàm tại đây đối với Ảnh
      }

      // ==========================================
      // NHÁNH 2: NẾU FILE LÀ WORD HOẶC PDF (Dùng AI xử lý như cũ)
      // ==========================================
      setLoadingStep("reading");
      const buffer = await file.arrayBuffer();
      let fullText = "";

      if (file.name.toLowerCase().endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        fullText = result.value.trim();
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
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
        alert("Định dạng file không hỗ trợ. Vui lòng chọn .docx, .pdf hoặc ảnh (.png, .jpg)");
        setLoadingStep("idle");
        setFileName(null);
        return;
      }

      if (!fullText) throw new Error("File rỗng hoặc thư viện không rút trích được chữ từ file này.");

      // CHUYỂN QUA AI XỬ LÝ
      setLoadingStep("analyzing");
      const parsedData = await geminiService.parseExamWithAI(fullText);
      
      onImportSuccess({ type: 'text_exam', ...parsedData });
      
      setLoadingStep("idle");
      setFileName(null);
      onClose();

    } catch (error: any) {
      console.error("Lỗi xử lý file chi tiết:", error);
      alert(`Báo lỗi: ${error?.message || "Lỗi không xác định"}`);
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

  // Helper để lấy text hiển thị trạng thái
  const getStatusText = () => {
    if (loadingStep === "reading") return "Đang trích xuất văn bản...";
    if (loadingStep === "analyzing") return "AI đang phân tích câu hỏi...";
    if (loadingStep === "uploading") return "Đang lưu ảnh lên Google Drive...";
    return "";
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>✨</span> Tạo đề thi (AI & Ảnh)
          </h3>
          <button 
            onClick={() => {
              // Bấm X dể đóng form thì reset lại
              setLoadingStep("idle");
              setFileName(null);
              onClose();
            }}
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
              // 🔥 CHO PHÉP CHỌN CẢ WORD, PDF VÀ ẢNH
              accept=".docx,.pdf,image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                  // Reset input value để chọn lại cùng 1 file không bị lỗi
                  e.target.value = ''; 
                }
              }}
            />
            
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`p-3 rounded-full ${loadingStep !== "idle" ? 'bg-indigo-100' : 'bg-blue-50'}`}>
                {loadingStep === "idle" ? (
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
                  <p className="text-xs text-gray-500">Hỗ trợ File chữ (Word, PDF) hoặc File Ảnh (JPG, PNG)</p>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-indigo-600">
                    {getStatusText()}
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
