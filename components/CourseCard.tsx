
import React from 'react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  // Fix: Added optional onClick prop to handle navigation and resolve TypeScript error in Dashboard.tsx
  onClick?: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  // Fix: Handle click event to trigger the onClick callback if provided
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(course.id);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
    >
      <div className="relative aspect-video">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-indigo-600 shadow-sm">
          {course.category}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            course.level === 'Cơ bản' ? 'bg-green-100 text-green-700' : 
            course.level === 'Trung cấp' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
          }`}>
            {course.level}
          </span>
          <div className="flex items-center text-yellow-500 text-xs">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
            <span className="ml-1 font-medium text-gray-600">{course.rating}</span>
          </div>
        </div>
        <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-4">{course.instructor}</p>
        
        <div className="mt-auto">
          {course.progress !== undefined && course.progress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] mb-1 font-medium text-gray-500 uppercase">
                <span>Tiến độ</span>
                <span>{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full transition-all" style={{ width: `${course.progress}%` }}></div>
              </div>
            </div>
          )}
          
          <a 
            href={`#/course/${course.id}`}
            onClick={handleClick}
            className="block w-full text-center py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors text-sm"
          >
            {course.progress && course.progress > 0 ? 'Tiếp tục học' : 'Xem khóa học'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
