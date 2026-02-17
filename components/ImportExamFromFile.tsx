import React, { useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  onImport: (content: string) => void;
}

const ImportExamFromFile: React.FC<Props> = ({ onImport }) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    try {
      setLoading(true);
      setFileName(file.name);

      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onImport(result.value.trim());
      }

      if (file.name.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text +=
            content.items
              .map((item: any) => item.str)
              .join(" ")
              .trim() + "\n\n";
        }

        onImport(text.trim());
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Lỗi khi đọc file. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm space-y-3">
      <input
        type="file"
        accept=".docx,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="w-full"
      />

      {fileName && (
        <div className="text-sm text-gray-500 flex justify-between items-center">
          <span>Đã tải: {fileName}</span>
          <button
            onClick={() => {
              setFileName(null);
              onImport("");
            }}
            className="text-red-500 text-xs"
          >
            Xóa
          </button>
        </div>
      )}

      {loading && (
        <p className="text-blue-500 text-sm">Đang xử lý file...</p>
      )}
    </div>
  );
};

export default ImportExamFromFile;
