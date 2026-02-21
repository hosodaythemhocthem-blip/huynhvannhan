const createExam = async () => {
    try {
      // 1. Bật trạng thái loading để tránh người dùng bấm liên tục (Spam)
      setLoading(true); 
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("exams")
        .insert({
          title: "Đề thi mới (Chưa đặt tên)",
          teacher_id: user.id,
          description: "",
          is_locked: false,
          is_archived: false,
          total_points: 10,
          version: 1,
          duration: 45,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      // 2. Nếu có lỗi từ Supabase -> In ra màn hình ngay lập tức
      if (error) {
        console.error("Lỗi tạo đề thi từ Supabase:", error);
        alert(`Không thể tạo đề thi. Lỗi: ${error.message} \nChi tiết (F12 để xem): ${error.details || error.hint}`);
        setLoading(false);
        return;
      }

      // 3. Nếu thành công -> Tải lại danh sách
      if (data) {
        alert("Tạo đề thi nháp thành công!"); // Báo cho người dùng biết
        await loadExams(); 
        
        // Tùy chọn: Chuyển hướng người dùng thẳng vào trang chỉnh sửa đề thi
        // navigate(`/exam-editor/${data.id}`); 
      }
    } catch (err) {
      console.error("Lỗi hệ thống:", err);
      alert("Đã xảy ra lỗi không xác định!");
    } finally {
      setLoading(false);
    }
  };
