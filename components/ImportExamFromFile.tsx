import React, { useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

interface Props {
  onImport: (content: string) => void;
}

const ImportExamFromFile: React.FC<Props> = ({ onImport }) => {
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);

    if (file.name.endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      onImport(result.value);
    }

    if (file.name.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ");
      }

      onImport(text);
    }

    setLoading(false);
  };

  return (
    <div className="border p-4 rounded-lg bg-white shadow">
      <input
        type="file"
        accept=".docx,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      {loading && <p className="text-blue-500 mt-2">Đang xử lý file...</p>}
    </div>
  );
};

export default ImportExamFromFile;
