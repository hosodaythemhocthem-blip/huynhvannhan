import React, { useState, useEffect, useCallback } from "react"
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"

import { User } from "./types"
import { authService } from "./services/authService"
import { supabase } from "./supabase"
import { ToastProvider } from "./components/Toast"

import Layout from "./components/Layout"
import LoginScreen from "./pages/LoginScreen"
import TeacherPortal from "./pages/TeacherPortal"
import StudentDashboard from "./pages/StudentDashboard"
import AdminDashboard from "./pages/AdminDashboard"

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>("dashboard")

  /* ======================================================
     INIT AUTH
  ====================================================== */
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        // đảm bảo teacher mặc định tồn tại
        await authService.ensureDefaultTeacher()

        // 1️⃣ kiểm tra localStorage trước
        const stored = authService.getCurrentUser()
        if (stored && isMounted) {
          setUser(stored)
          return
        }

        // 2️⃣ kiểm tra session Supabase
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Get session error:", error.message)
          return
        }

        const sessionUser = data.session?.user
        if (!sessionUser) return

        // 3️⃣ lấy profile từ table users
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle()

        if (profileError) {
          console.error("Profile fetch error:", profileError.message)
          return
        }

        if (profile && isMounted) {
          localStorage.setItem("lms_user", JSON.stringify(profile))
          setUser(profile as User)
        }
      } catch (err) {
        console.error("Init auth error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  /* ======================================================
     LOGIN / LOGOUT
  ====================================================== */
  const handleLogin = useCallback((u: User) => {
    setUser(u)
  }, [])

  const handleLogout = useCallback(async () => {
    await authService.signOut()
    localStorage.removeItem("lms_user")
    setUser(null)
  }, [])

  /* ======================================================
     LOADING SCREEN
  ====================================================== */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Đang tải hệ thống...
      </div>
    )
  }

  const isAdmin =
    user?.email === "huynhvannhan@gmail.com" &&
    user.role === "teacher"

  return (
    <ToastProvider>
      <Router>
        {!user ? (
          <Routes>
            <Route
              path="*"
              element={<LoginScreen onLogin={handleLogin} />}
            />
          </Routes>
        ) : (
          <Layout
            user={user}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          >
            <Routes>
              {user.role === "teacher" ? (
                <>
                  <Route
                    path="/admin"
                    element={
                      isAdmin ? (
                        <AdminDashboard />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <TeacherPortal
                        user={user}
                        activeTab={activeTab}
                      />
                    }
                  />
                </>
              ) : (
                <Route
                  path="*"
                  element={
                    <StudentDashboard
                      user={user}
                      activeTab={activeTab}
                      onStartExam={(exam) =>
                        console.log("Start exam:", exam)
                      }
                    />
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
