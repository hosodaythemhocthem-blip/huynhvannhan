# Hệ thống Kiến Thức Toán Học LMS

Hệ thống **Learning Management System (LMS)** chuyên nghiệp dành cho **Giáo viên và Học sinh Toán học**,  
tích hợp **AI Gia sư thông minh (Gemini)**, hỗ trợ giảng dạy – học tập – đánh giá một cách hiệu quả, hiện đại và bền vững.

---

## 🎯 Mục tiêu hệ thống

- Quản lý **đề thi – lớp học – học sinh – điểm số** một cách khoa học
- Hỗ trợ **AI Gia sư Toán học** (giải thích, hướng dẫn, trình bày LaTeX)
- Phân tích **đề thi từ văn bản / hình ảnh**
- Dữ liệu **lưu trữ an toàn, không mất khi deploy lại**
- Phù hợp triển khai **thực tế trong môi trường giáo dục**

---

## 🤖 Tính năng AI (Gemini)

Hệ thống sử dụng **Google Gemini API** cho các chức năng:
- Gia sư AI Toán học (trả lời có LaTeX)
- Phân tích đề thi Toán học
- Trích xuất câu hỏi từ:
  - Văn bản
  - Hình ảnh (đề scan, ảnh chụp)

---

## 🔐 Hướng dẫn thiết lập API Gemini

### 1️⃣ Lấy API Key
Truy cập:  
👉 https://aistudio.google.com/app/apikey  

---

### 2️⃣ Thiết lập biến môi trường

#### 🔹 Trên Vercel
- Project → **Settings → Environment Variables**
- Thêm:
