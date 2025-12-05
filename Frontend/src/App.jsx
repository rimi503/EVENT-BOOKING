import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import MainLayout from "./layouts/MainLayout";

// Lazy Load Components
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
const Admin = lazy(() => import("./Admin"));

const API_BASE_URL = "http://localhost:5000";

// --- MAIN APP ---
const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check Session on Load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/check`);
        setIsAdmin(res.data.isAdmin);
      } catch (e) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-offwhite text-black font-serif text-xl animate-pulse">
        GALA.
      </div>
    );

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-offwhite">
        <div className="flex-grow">
          <Suspense
            fallback={
              <div className="h-screen flex items-center justify-center bg-offwhite">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<BookingPage isAdmin={isAdmin} setIsAdmin={setIsAdmin} />} />

              <Route
                path="/login"
                element={
                  isAdmin ? (
                    <Navigate to="/admin" />
                  ) : (
                    <LoginPage isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
                  )
                }
              />

              <Route
                path="/admin"
                element={
                  isAdmin ? (
                    <MainLayout isAdmin={isAdmin} setIsAdmin={setIsAdmin}>
                      <Admin />
                    </MainLayout>
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
};

export default App;
