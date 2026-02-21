import { supabase } from '../supabase';
import { ExamSubmission, Question } from '../types';

export const quizService = {
  // 1. Nộp bài thi
  async submitExam(submission: Partial<ExamSubmission>) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .insert({
        ...submission,
        is_submitted: true,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 2. Tự động chấm điểm (cho câu trắc nghiệm)
  gradeExam(questions: Question[], answers: Record<string, string>): number {
    let score = 0;
    questions.forEach(q => {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        // So sánh đáp án học sinh chọn với đáp án đúng
        // Lưu ý: answers[q.id] lưu index (0,1,2,3) hoặc ký tự (A,B,C,D) tùy logic Editor
        // Ở ExamEditor phần trước ta lưu 'A','B','C','D'.
        if (answers[q.id] === q.correct_answer) {
          score += (Number(q.points) || 0);
        }
      }
    });
    return score;
  },

  // 3. Lấy lịch sử làm bài của học sinh
  async getStudentHistory(studentId: string) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select('*, exams(title)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // 4. Lấy chi tiết một bài làm (để xem lại)
  async getSubmissionDetail(submissionId: string) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
      
    if (error) throw error;
    return data;
  }
};
