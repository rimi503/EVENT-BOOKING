import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const API_BASE_URL = "http://localhost:5000";

const LoginPage = ({ isAdmin, setIsAdmin }) => {
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
                if (setIsAdmin) setIsAdmin(true);
                navigate('/admin');
            }
        } catch (err) {
            setError(err.response?.data?.message || "Connection Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout isAdmin={isAdmin} setIsAdmin={setIsAdmin}>
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="bg-white/60 backdrop-blur-lg w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex min-h-[500px] animate-slide-up border border-white">

                    {/* Left Side: Decorative - Now Navy */}
                    <div className="hidden md:flex w-1/2 bg-navy text-cream p-12 flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-navy to-black z-0"></div>
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-plum/50 rounded-full blur-[100px]"></div>

                        <div className="relative z-10">
                            <h1 className="text-4xl font-serif italic font-bold">GALA.</h1>
                            <p className="text-xs uppercase tracking-widest text-cream/50 mt-2">Staff Access Portal</p>
                        </div>

                        <div className="relative z-10">
                            <p className="text-cream/60 text-sm leading-relaxed">
                                "Elegance is not standing out, but being remembered."
                            </p>
                            <div className="w-12 h-1 bg-plum mt-6"></div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-transparent relative">
                        <h2 className="text-2xl font-bold mb-2 text-navy">Welcome Back</h2>
                        <p className="text-sm text-navy/50 mb-10">Please enter your credentials to access the dashboard.</p>

                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-600 p-3 text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <div className="pt-4">
                                <Button loading={loading} className="w-full">
                                    Login to Dashboard
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default LoginPage;
