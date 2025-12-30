
import React, { useState } from 'react';
import { Course, Lesson } from '../types';
import AiAssistant from './AiAssistant';
import MathPreview from './MathPreview';

interface CourseViewerProps {
  course: Course;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson>(course.modules[0].lessons[0]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Main Content Area */}
      <div className="flex-grow lg:w-3/4">
        <div className="sticky top-0 z-10 bg-white">
          <div className="aspect-video bg-black flex items-center justify-center">
            {activeLesson.type === 'video' ? (
              <iframe 
                className="w-full h-full"
                src={activeLesson.videoUrl}
                title={activeLesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-white text-center p-8">
                <svg className="w-20 h-20 mx-auto mb-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h2 className="text-2xl font-bold mb-2">Bài học đọc tài liệu</h2>
                <p className="text-gray-400">Xem nội dung chi tiết bên dưới</p>
              </div>
            )}
          </div>
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{activeLesson.title}</h1>
              <p className="text-sm text-gray-500">Cập nhật lần cuối: 12/05/2024 • {activeLesson.duration}</p>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              Hoàn thành bài học
            </button>
          </div>
        </div>

        <div className="p-8 max-w-4xl">
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-4">Nội dung bài học</h3>
            <div className="prose prose-indigo max-w-none text-gray-700">
              <MathPreview math={activeLesson.content} className="mb-4" />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2">Tài liệu đính kèm</h4>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-3 text-sm text-indigo-700 hover:underline">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Slide_Bai_Hoc_{activeLesson.id}.pdf (2.4 MB)
              </a>
              <a href="#" className="flex items-center gap-3 text-sm text-indigo-700 hover:underline">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Ma_nguon_thuc_hanh.zip (12 MB)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Course Sidebar Content */}
      <div className="lg:w-1/4 border-l border-gray-200 h-screen sticky top-0 bg-gray-50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="font-bold text-gray-900">Nội dung khóa học</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-grow bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-1/3"></div>
            </div>
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">8/24 bài học</span>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {course.modules.map((module) => (
            <div key={module.id} className="mb-1">
              <div className="bg-gray-100 px-4 py-3 font-bold text-xs text-gray-600 uppercase tracking-wider">
                {module.title}
              </div>
              <div className="bg-white">
                {module.lessons.map((lesson) => (
                  <button 
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      activeLesson.id === lesson.id ? 'bg-indigo-50 text-indigo-700 border-l-4 border-l-indigo-600' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {lesson.completed ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          activeLesson.id === lesson.id ? 'border-indigo-600 text-indigo-600' : 'border-gray-300 text-gray-400'
                        }`}>
                          {lesson.type === 'video' ? (
                             <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          ) : (
                             <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className={`text-sm font-medium ${activeLesson.id === lesson.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {lesson.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">{lesson.duration}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AiAssistant currentContext={`${course.title} - ${activeLesson.title}: ${activeLesson.content}`} />
    </div>
  );
};

export default CourseViewer;
