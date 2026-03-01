import React, { useState, useEffect, useCallback } from "react"
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"

import { User, Exam } from "./types"
import { authService } from "./services/authService"
import { supabase } from "./supabase"
import { ToastProvider } from "./components/Toast"

import Layout from "./components/Layout"
import LoginScreen from "./pages/LoginScreen"
import TeacherPortal from "./pages/TeacherPortal"
import StudentDashboard from "./pages/StudentDashboard"
import AdminDashboard from "./pages/AdminDashboard"

// 👇 THÊM DÒNG NÀY: Import giao diện phòng thi của học sinh
// (Nếu file làm bài thi của bạn tên khác, ví dụ ExamRoom hay TakeExam thì bạn sửa lại tên file ở đây nhé)
import StudentQuiz from "./components/StudentQuiz" 

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = await authService.getCurrentUser()

        if (stored) {
          setUser(stored)
        } else {
          const { data } = await supabase.auth.getSession()

          if (data.session?.user) {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.session.user.id)
              .single()

            if (profile) {
              setUser(profile)
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleLogin = useCallback((u: User) => {
    setUser(u)
    setActiveTab("dashboard") // Reset tab về trang chủ khi đăng nhập
  }, [])

  const handleLogout = useCallback(async () => {
    await authService.signOut()
    setUser(null)
  }, [])

  if (loading) return null

  return (
    <ToastProvider>
      <Router>
        {!user ? (
          <Routes>
            <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
          </Routes>
        ) : (
          <Layout
            user={user}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          >
            <Routes>
              {user.role === "teacher" || user.role === "admin" ? (
                <>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route
                    path="*"
                    element={<TeacherPortal user={user} activeTab={activeTab} />}
                  />
                </>
              ) : (
                <Route
                  path="*"
                  element={
                    // 👇 ĐÃ FIX: Chuyển đổi màn hình dựa vào activeTab
                    activeTab === "exams" ? (
                      <StudentQuiz user={user} onTabChange={setActiveTab} />
                    ) : (
                      <StudentDashboard user={user} onTabChange={setActiveTab} />
                    )
                  }
                />
              )}
            </Routes>
          </Layout>
        )}
      </Router>
    </ToastProvider>
  )
}

export default App
