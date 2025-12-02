import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";

// Lazy Load Components
const Booking = lazy(() => import("./Booking"));
const Admin = lazy(() => import("./Admin"));
const Login = lazy(() => import("./Login"));

const API_BASE_URL = "http://localhost:5000";

// --- NAVBAR COMPONENT ---
const NavBar = ({ isAdmin, setIsAdmin }) => {
  const [showRecover, setShowRecover] = useState(false);
  const [recoverInput, setRecoverInput] = useState("");
  const location = useLocation();

  const handleRecover = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/tickets/find-ticket`, {
        search: recoverInput,
      });
      if (res.data.success) {
        const state = {
          mainGuest: res.data.ticket.mainGuest,
          members: res.data.ticket.members,
          ticketData: res.data.ticket,
          utr: res.data.ticket.transactionId,
        };
        localStorage.setItem("gala_session_v2", JSON.stringify(state));
        window.location.href = "/";
      }
    } catch (error) {
      alert("No booking found. Check phone number or UTR.");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
      setIsAdmin(false);
      window.location.href = "/";
    } catch (e) {
      console.error("Logout error");
    }
  };

  // Helper to check active link
  const isActive = (path) =>
    location.pathname === path
      ? "text-black border-b-2 border-black pb-1"
      : "text-gray-500 hover:text-black transition";

  return (
    <>
      <nav className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center sticky top-0 z-50 shadow-sm h-20">
        <Link
          to="/"
          className="text-2xl font-black tracking-tighter flex items-center gap-1"
        >
          GALA<span className="text-yellow-600 text-3xl">.</span>
        </Link>

        <div className="flex gap-6 text-xs font-bold uppercase items-center">
          <Link to="/" className={isActive("/")}>
            Home
          </Link>

          {/* Recover Button */}
          <button
            onClick={() => setShowRecover(true)}
            className="text-gray-500 hover:text-black transition"
          >
            Find My Pass
          </button>

          {/* Staff / Dashboard Logic */}
          {isAdmin ? (
            <div className="flex gap-4 items-center">
              <Link
                to="/admin"
                className={`bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition ${
                  location.pathname === "/admin" ? "bg-gray-800" : ""
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={`border border-black px-5 py-2 rounded hover:bg-black hover:text-white transition ${
                location.pathname === "/login"
                  ? "bg-black text-white"
                  : "text-black"
              }`}
            >
              Admin Login
            </Link>
          )}
        </div>
      </nav>

      {/* Recover Modal */}
      {showRecover && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setShowRecover(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-2">Lost your pass?</h2>
            <p className="text-xs text-gray-500 mb-6">
              Enter your Phone Number or Transaction ID to recover your booking.
            </p>
            <form onSubmit={handleRecover} className="space-y-4">
              <input
                className="w-full border-b border-gray-300 py-2 text-sm outline-none focus:border-black"
                placeholder="Phone Number / UTR"
                value={recoverInput}
                onChange={(e) => setRecoverInput(e.target.value)}
                required
              />
              <button className="w-full bg-black text-white py-3 rounded font-bold text-xs uppercase tracking-widest hover:bg-gray-800">
                Search Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

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
      <div className="h-screen flex items-center justify-center bg-[#F5F5F5]">
        Loading...
      </div>
    );

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
        <NavBar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <div className="flex-grow">
          <Suspense
            fallback={
              <div className="p-10 text-center">Loading Component...</div>
            }
          >
            <Routes>
              <Route path="/" element={<Booking />} />
              {/* Pass setIsAdmin to Login so Navbar updates instantly */}
              <Route
                path="/login"
                element={
                  isAdmin ? (
                    <Navigate to="/admin" />
                  ) : (
                    <Login setIsAdmin={setIsAdmin} />
                  )
                }
              />
              <Route
                path="/admin"
                element={isAdmin ? <Admin /> : <Navigate to="/login" />}
              />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
};

export default App;
