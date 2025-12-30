
import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Clock, BookOpen, Trophy, Sparkles } from 'lucide-react';
import { STUDY_DATA, MOCK_COURSES } from '../data/mockData';
import CourseCard from './CourseCard';

interface DashboardProps {
  onCourseClick: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCourseClick }) => {
  const stats = [
    { label: 'Khóa học', value: '4', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Giờ học', value: '18.5h', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Điểm kỹ năng', value: '850', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Thành tựu', value: '12', icon: Trophy, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chào mừng trở lại! 👋</h1>
        <p className="text-gray-500 mt-1">Hôm nay là một ngày tuyệt vời để học toán.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Hoạt động học tập</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={STUDY_DATA}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Tiếp tục học</h3>
          <div className="space-y-4">
            {MOCK_COURSES.slice(0, 3).map(course => (
              <div 
                key={course.id} 
                className="group cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                onClick={() => onCourseClick(course.id)}
              >
                <div className="flex gap-4">
                  <img src={course.thumbnail} className="w-20 h-14 object-cover rounded-lg" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600">{course.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{course.instructor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Khám phá khóa học</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_COURSES.map(course => (
            <CourseCard key={course.id} course={course} onClick={onCourseClick} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
