// components/ImportExamFromFile.tsx

import React, { useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

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
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        onImport(result.value.trim());
      }

      if (file.name.endsWith(".pdf")) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

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
      alert("Không thể đọc file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm space-y-3">
      <input
        type="file"
        accept=".docx,.pdf"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />

      {fileName && (
        <div className="text-sm text-gray-500 flex justify-between">
          <span>{fileName}</span>
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

      {loading && <p className="text-blue-500 text-sm">Đang xử lý...</p>}
    </div>
  );
};

export default ImportExamFromFile;
