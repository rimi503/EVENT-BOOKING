import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "http://localhost:5000"; 

const Login = ({ setIsAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`, 
        { email, password },
        { withCredentials: true }
      );
      
      if (res.data.success) {
        // Update App State
        if(setIsAdmin) setIsAdmin(true);
        // Redirect
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Connection Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 shadow-2xl w-full max-w-sm border border-gray-200 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
        
        <h1 className="font-bold text-2xl text-center mb-1">Staff Portal</h1>
        <p className="text-xs text-gray-400 text-center uppercase tracking-widest mb-8">Authorized Access Only</p>
        
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-3 text-xs rounded font-medium text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
             <input 
                className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-black transition-colors placeholder-gray-400"
                type="email" 
                placeholder="Email ID" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
             />
             <input 
                className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-black transition-colors placeholder-gray-400"
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
             />

             <button 
                disabled={loading} 
                className="w-full bg-black text-white py-4 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg mt-4"
             >
                {loading ? "Verifying..." : "Login"}
             </button>
        </form>
      </div>
    </div>
  );
};

export default Login;