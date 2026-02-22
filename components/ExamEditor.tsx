const handleSave = async () => {
    if (!title.trim()) return showToast("Vui lòng nhập tên đề thi!", "error");
    if (questions.length === 0) return showToast("Đề thi cần ít nhất 1 câu hỏi!", "warning");

    setSaving(true);
    try {
      // Kiểm tra xem có user không
      if (!user || !user.id) {
        throw new Error("Không tìm thấy ID tài khoản giáo viên. Vui lòng thử đăng xuất và đăng nhập lại!");
      }

      const payload = {
        title,
        questions, 
        updated_at: new Date().toISOString(),
        teacher_id: user.id,
        is_locked: true,
      };

      let response;
      if (exam?.id) {
        response = await supabase.from('exams').update(payload).eq('id', exam.id).select();
      } else {
        // Bọc payload vào array để tương thích tốt nhất với mọi phiên bản Supabase
        response = await supabase.from('exams').insert([payload]).select();
      }

      const { data, error } = response;

      // Nếu Supabase từ chối, quăng lỗi ngay
      if (error) {
        console.error("Chi tiết lỗi Supabase:", error);
        throw new Error(`DB Error: ${error.message || error.details} (Mã: ${error.code})`);
      }
      
      showToast("Đã lưu đề thi thành công!", "success");
      onClose(); 

    } catch (err: any) {
      console.error("Lỗi Catch Block:", err);
      // 🔥 Hiện thông báo lỗi to đùng ra giữa màn hình để chúng ta biết nó bị kẹt ở đâu
      alert(`Lỗi Lưu Đề:\n${err.message || "Không rõ nguyên nhân"}\n\n(Chụp lại lỗi này gửi cho mình nếu bạn vẫn chưa lưu được nhé!)`);
      showToast("Lưu thất bại!", "error");
    } finally {
      // Đảm bảo nút sẽ ngừng quay loading dù thành công hay thất bại
      setSaving(false);
    }
  };
