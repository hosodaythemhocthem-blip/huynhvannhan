
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <a href="#/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
              <span>EduFlex</span>
            </a>
            <nav className="hidden md:flex gap-6">
              <a href="#/" className="text-gray-600 hover:text-indigo-600 font-medium">Khóa học</a>
              <a href="#/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">Lộ trình của tôi</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 font-medium">Thư viện</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input 
                type="text" 
                placeholder="Tìm khóa học..." 
                className="bg-gray-100 border-none rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center cursor-pointer">
              <span className="text-indigo-700 font-bold text-sm">TV</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
