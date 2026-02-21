import React, { useState } from "react";
import mammoth from "mammoth";

// @ts-ignore: Bỏ qua kiểm tra type khắt khe của Vercel cho thư viện PDF.js
import * as pdfjsLib from "pdfjs-dist";

// Cấu hình Worker bằng CDN với version cố định (4.8.69) để tránh lỗi undefined version khi build
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface Props {
  onImport: (content: string) => void;
}

// Đã xóa interface TextItem tự định nghĩa để tránh xung đột type với pdfjs-dist

const ImportExamFromFile: React.FC<Props> = ({ onImport }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    try {
      setLoading(true);
      setFileName(file.name);

      const buffer = await file.arrayBuffer();

      // Xử lý file DOCX
      if (file.name.toLowerCase().endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        onImport(result.value.trim());
      } 
      // Xử lý file PDF
      else if (file.name.toLowerCase().endsWith(".pdf")) {
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          
          // Lọc và nối các chuỗi văn bản một cách an toàn
          // FIX: Dùng any để bypass lỗi type TS2677 và TS2339 của Vercel
          const pageText = content.items
            .filter((item: any) => item && "str" in item)
            .map((item: any) => item.str)
            .join(" ");
          
          fullText += pageText.trim() + "\n\n";
        }

        onImport(fullText.trim());
      } else {
        alert("Định dạng file không hỗ trợ. Vui lòng chọn .docx hoặc .pdf");
      }
    } catch (error) {
      console.error("Lỗi khi đọc file:", error);
      alert("Không thể đọc nội dung file. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFileName(null);
    onImport("");
  };

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm space-y-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Tải đề thi lên</label>
        <input
          type="file"
          accept=".docx,.pdf"
          disabled={loading}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
        />
      </div>

      {fileName && (
        <div className="text-sm text-gray-600 flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="truncate max-w-[200px]">{fileName}</span>
          <button
            onClick={handleClear}
            className="text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Xóa
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
          Đang xử lý nội dung file...
        </div>
      )}
    </div>
  );
};

export default ImportExamFromFile;
