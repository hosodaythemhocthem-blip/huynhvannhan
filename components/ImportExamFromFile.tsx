import mammoth from 'mammoth';
import { Upload } from 'lucide-react';

const MAX_FILE_SIZE_MB = 10;

export default function ImportExamFromFile() {
  const handleFile = async (file: File) => {
    if (!file) return;

    // Check size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File quá lớn (>${MAX_FILE_SIZE_MB}MB). Vui lòng chọn file nhỏ hơn.`);
      return;
    }

    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({
          arrayBuffer: buffer
        });

        if (!value.trim()) {
          alert('Không đọc được nội dung Word (file rỗng hoặc không hợp lệ).');
          return;
        }

        alert(
          '✅ Đã đọc Word thành công!\n\n' +
          'Nội dung trích xuất (mẫu):\n\n' +
          value.slice(0, 800) +
          (value.length > 800 ? '\n\n...' : '')
        );

        // 👉 TODO:
        // 1. Gửi value sang AI
        // 2. AI parse -> { title, questions[], answers }
        // 3. onAdd(exam)

      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        alert(
          '📄 PDF đã nhận.\n\n' +
          'File PDF sẽ được xử lý bằng AI Vision để trích xuất câu hỏi.'
        );

        // 👉 TODO:
        // 1. Upload PDF
        // 2. AI Vision OCR
        // 3. Parse thành đề thi
      } else {
        alert('Định dạng file không hỗ trợ.');
      }
    } catch (err) {
      console.error('Import exam error:', err);
      alert('❌ Có lỗi khi đọc file. Vui lòng thử lại.');
    }
  };

  return (
    <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
      <Upload size={18} />
      Upload Word / PDF

      <input
        type="file"
        accept=".docx,.pdf"
        hidden
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.currentTarget.value = ''; // reset để upload lại cùng file
        }}
      />
    </label>
  );
}
