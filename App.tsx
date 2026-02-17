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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  /* ======================================================
     INIT AUTH
  ====================================================== */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // đảm bảo teacher mặc định tồn tại
        await authService.ensureDefaultTeacher()

        const stored = authService.getCurrentUser()

        if (stored) {
          setUser(stored)
        } else {
          // kiểm tra session Supabase
          const { data } = await supabase.auth.getSession()

          if (data.session?.user) {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.session.user.id)
              .single()

            if (profile) {
              localStorage.setItem(
                "lms_user",
                JSON.stringify(profile)
              )
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

  /* ======================================================
     LOGIN / LOGOUT
  ====================================================== */
  const handleLogin = useCallback((u: User) => {
    setUser(u)
  }, [])

  const handleLogout = useCallback(async () => {
    await authService.signOut()
    setUser(null)
  }, [])

  if (loading) return null

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
                        <Navigate to="/" />
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
