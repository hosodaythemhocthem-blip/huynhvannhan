
import { Course, ProgressData } from './types';

// Giữ nguyên dữ liệu biểu đồ bạn đã thiết kế
export const STUDY_DATA: ProgressData[] = [
  { name: 'Thứ 2', hours: 2.5 },
  { name: 'Thứ 3', hours: 4.2 },
  { name: 'Thứ 4', hours: 3.0 },
  { name: 'Thứ 5', hours: 5.1 },
  { name: 'Thứ 6', hours: 4.8 },
  { name: 'Thứ 7', hours: 6.5 },
  { name: 'CN', hours: 3.2 },
];

// Giữ nguyên toàn bộ danh sách khóa học và bài học của bạn
export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Lập trình ReactJS hiện đại 2024',
    instructor: 'Nguyễn Văn A',
    description: 'Học React từ con số 0 đến chuyên gia. Bao gồm Hooks, Context API và dự án thực tế.',
    thumbnail: 'https://picsum.photos/seed/react/800/450',
    category: 'Công nghệ',
    level: 'Cơ bản',
    rating: 4.8,
    students: 1250,
    progress: 35,
    modules: [
      {
        id: 'm1',
        title: 'Chương 1: Giới thiệu & Cài đặt',
        lessons: [
          { id: 'l1', title: 'Tại sao nên học React?', duration: '10:00', type: 'video', content: 'React là thư viện phổ biến nhất...', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', completed: true },
          { id: 'l2', title: 'Cài đặt môi trường Node.js', duration: '15:00', type: 'video', content: 'Hướng dẫn cài đặt Node và NPM...', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ]
      },
      {
        id: 'm2',
        title: 'Chương 2: Thành phần (Components)',
        lessons: [
          { id: 'l3', title: 'JSX là gì?', duration: '12:00', type: 'reading', content: 'JSX giúp viết HTML trong JavaScript một cách tự nhiên.' },
          { id: 'l4', title: 'Props và State', duration: '20:00', type: 'video', content: 'Hiểu về luồng dữ liệu trong React...', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ]
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Thiết kế giao diện UI/UX chuyên sâu',
    instructor: 'Trần Thị B',
    description: 'Làm chủ Figma và các nguyên tắc thiết kế hiện đại để tạo ra trải nghiệm người dùng tuyệt vời.',
    thumbnail: 'https://picsum.photos/seed/uiux/800/450',
    category: 'Thiết kế',
    level: 'Trung cấp',
    rating: 4.9,
    students: 840,
    progress: 10,
    modules: []
  },
  {
    id: 'course-3',
    title: 'Data Science cơ bản với Python',
    instructor: 'Lê Văn C',
    description: 'Xử lý dữ liệu, trực quan hóa và xây dựng các mô hình máy học đơn giản.',
    thumbnail: 'https://picsum.photos/seed/data/800/450',
    category: 'Dữ liệu',
    level: 'Cơ bản',
    rating: 4.7,
    students: 2100,
    progress: 0,
    modules: []
  }
];
