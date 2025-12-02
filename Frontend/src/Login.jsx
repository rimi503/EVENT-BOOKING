import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (res.data.success) {
        // Token save karo (Session Maintain)
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminName', res.data.username);
        // Admin dashboard par bhejo
        navigate('/admin');
        window.location.reload(); // Navbar update karne ke liye
      }
    } catch (error) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)} required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)} required 
            />
          </div>
          <button className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 transition">
            Login Securely
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;