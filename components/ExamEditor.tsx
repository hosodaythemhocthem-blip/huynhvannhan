{/* 1. HEADER TOOLBAR */}
      <div className="bg-white border-b pl-6 pr-32 py-3 flex justify-between items-center shadow-sm shrink-0 h-16 relative z-[100]">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20}/>
          </button>
          <div className="flex-1 max-w-2xl">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-black text-slate-800 outline-none w-full bg-transparent placeholder-slate-300"
              placeholder="Nhập tên đề thi..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="text-xs font-medium text-slate-400 mr-2 hidden sm:block">
             {questions.length} câu hỏi • Tổng điểm: {questions.length}
           </div>
           
           <button 
             onClick={() => setShowPreview(!showPreview)}
             className={`p-2 rounded-xl transition-all ${showPreview ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
             title="Bật/Tắt chế độ xem trước"
           >
             {showPreview ? <Layout size={20}/> : <EyeOff size={20}/>}
           </button>

           <button 
             onClick={handleSave} 
             disabled={saving}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 whitespace-nowrap"
           >
             {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
             Lưu Đề
           </button>
        </div>
      </div>
