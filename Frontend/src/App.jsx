import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// Lazy Load Components
const Booking = lazy(() => import('./Booking'));
const Scanner = lazy(() => import('./Scanner'));
const Admin = lazy(() => import('./Admin'));
const Login = lazy(() => import('./Login'));

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
};

// --- NAVBAR ---
const NavBar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('adminToken'));
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    setIsAdmin(false);
    window.location.href = '/';
  };

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `text-xs md:text-sm font-medium tracking-widest uppercase transition-all duration-300 ${
      isActive 
      ? 'text-[#1C1C1C] font-bold border-b border-[#1C1C1C] pb-1' 
      : 'text-gray-500 hover:text-[#1C1C1C]'
    }`;
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#FDFBF7]/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        
        <Link to="/" className="font-serif text-2xl font-bold tracking-[0.2em] text-[#1C1C1C]">
          GALA<span className="text-[#C2B280]">.</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link to="/" className={getLinkClass('/')}>Home</Link>
          <Link to="/scan" className={getLinkClass('/scan')}>Scan</Link>
          
          {isAdmin ? (
            <div className="flex items-center gap-6">
                <Link to="/admin" className={getLinkClass('/admin')}>Dashboard</Link>
                <button onClick={handleLogout} className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 tracking-widest border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition">
                    Logout
                </button>
            </div>
          ) : (
            <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C] border border-[#1C1C1C] px-4 py-2 hover:bg-[#1C1C1C] hover:text-[#FDFBF7] transition">
              Staff Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full min-h-[50vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C1C1C]"></div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#EBE9E4] text-[#1C1C1C] font-sans selection:bg-[#C2B280] selection:text-white flex flex-col"> 
        <NavBar />
        
        {/* Main Content Area - Properly Spaced */}
        <div className="flex-grow flex flex-col items-center justify-center w-full px-4 pt-24 pb-8">
          <div className="w-full max-w-7xl">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Booking />} />
                <Route path="/scan" element={<Scanner />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </div>
        </div>
{/* 
        <footer className="text-center pb-6 text-[10px] uppercase tracking-widest opacity-40">
          © 2025 The Official Event
        </footer> */}
      </div>
    </Router>
  );
}

export default App;