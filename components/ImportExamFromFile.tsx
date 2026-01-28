import mammoth from 'mammoth';
import { Upload } from 'lucide-react';

export default function ImportExamFromFile() {
  const handleFile = async (file: File) => {
    if (file.name.endsWith('.docx')) {
      const buffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });

      alert(
        'Đã đọc Word thành công!\n\nNội dung mẫu:\n' +
          value.slice(0, 800)
      );

      // 👉 chỗ này sau nối AI để tự tách câu hỏi
    } else if (file.name.endsWith('.pdf')) {
      alert('PDF đã nhận – sẽ xử lý bằng AI Vision');
    }
  };

  return (
    <label className="cursor-pointer bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow">
      <Upload size={18} /> Upload Word / PDF
      <input
        type="file"
        accept=".docx,.pdf"
        hidden
        onChange={e => e.target.files && handleFile(e.target.files[0])}
      />
    </label>
  );
}
