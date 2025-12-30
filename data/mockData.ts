
import { Course, ProgressData } from '../types';

export const STUDY_DATA: ProgressData[] = [
  { name: 'Thứ 2', hours: 2.5 },
  { name: 'Thứ 3', hours: 4.2 },
  { name: 'Thứ 4', hours: 3.0 },
  { name: 'Thứ 5', hours: 5.1 },
  { name: 'Thứ 6', hours: 4.8 },
  { name: 'Thứ 7', hours: 6.5 },
  { name: 'CN', hours: 3.2 },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Toán học 12: Đạo hàm và Ứng dụng',
    instructor: 'Thầy Huỳnh Văn Nhẫn',
    description: 'Nắm vững các phương pháp tính đạo hàm và ứng dụng vào khảo sát hàm số.',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800',
    category: 'Giải tích',
    level: 'Nâng cao',
    rating: 4.9,
    students: 125,
    progress: 45,
    modules: [
      {
        id: 'm1',
        title: 'Chương 1: Quy tắc tính đạo hàm',
        lessons: [
          { id: 'l1', title: 'Đạo hàm của hàm số sơ cấp', duration: '15:00', type: 'video', content: 'Tìm hiểu về bảng đạo hàm căn bản...', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: true },
          { id: 'l2', title: 'Bài tập áp dụng $y = x^n$', duration: '10:00', type: 'reading', content: 'Thực hành tính đạo hàm cho các hàm đa thức.' }
        ]
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Hình học 10: Vector và Tọa độ',
    instructor: 'Cô Trần Thị D',
    description: 'Hệ thống kiến thức về Vector trong mặt phẳng Oxy.',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
    category: 'Hình học',
    level: 'Cơ bản',
    rating: 4.8,
    students: 210,
    progress: 15,
    modules: []
  },
  {
    id: 'course-3',
    title: 'Ôn thi THPT Quốc Gia 2025',
    instructor: 'Thầy Huỳnh Văn Nhẫn',
    description: 'Tổng hợp đề thi thử và các mẹo giải toán nhanh bằng máy tính cầm tay.',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    category: 'Luyện thi',
    level: 'Trung cấp',
    rating: 5.0,
    students: 540,
    progress: 0,
    modules: []
  }
];
