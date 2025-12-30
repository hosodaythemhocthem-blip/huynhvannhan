
# Hệ thống Kiến Thức Toán Học LMS

Hệ thống quản lý học tập chuyên nghiệp hỗ trợ AI dành cho Giáo viên và Học sinh.

## Hướng dẫn thiết lập API

Để sử dụng các tính năng AI (Gia sư AI, Phân tích đề thi), bạn cần có Gemini API Key.

1. Lấy mã tại: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Thiết lập biến môi trường:
   - **Trên Vercel:** Thêm Environment Variable với tên `API_KEY`.
   - **Chạy cục bộ:** Tạo file `.env.local` và thêm dòng: `API_KEY=mã_của_bạn`.

## Chạy dự án
1. `npm install`
2. `npm run dev`
