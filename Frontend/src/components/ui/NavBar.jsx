import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Button from './Button';

const API_BASE_URL = "http://localhost:5000";

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

    const isActive = (path) =>
        location.pathname === path
            ? "text-navy relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-plum"
            : "text-navy/60 hover:text-navy transition-colors";

    return (
        <>
            <nav className="bg-cream/90 backdrop-blur-md border-b border-navy/5 h-20 fixed top-0 w-full z-50 flex justify-between items-center px-6 lg:px-12 shadow-sm transition-all duration-300">
                <Link to="/" className="text-3xl font-serif font-black tracking-tighter flex items-center gap-1 group text-navy">
                    GALA<span className="text-plum text-4xl group-hover:animate-pulse">.</span>
                </Link>

                <div className="flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-widest text-navy">
                    <Link to="/" className={isActive("/")}>Home</Link>

                    <button
                        onClick={() => setShowRecover(true)}
                        className="text-navy/60 hover:text-navy transition-colors"
                    >
                        Find My Pass
                    </button>

                    {isAdmin ? (
                        <div className="flex gap-4 items-center">
                            <Link to="/admin">
                                <Button variant={location.pathname === "/admin" ? "primary" : "ghost"} className="!py-2 !px-4 !text-[10px]">
                                    Dashboard
                                </Button>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button variant="primary" className="!py-2 !px-6 !text-[10px]">Staff Login</Button>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Recover Modal */}
            {showRecover && (
                <div className="fixed inset-0 bg-navy/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-cream p-8 rounded-2xl w-full max-w-md relative shadow-2xl animate-slide-up border border-navy/10 text-navy">
                        <button
                            onClick={() => setShowRecover(false)}
                            className="absolute top-4 right-4 text-navy/40 hover:text-navy text-2xl transition"
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-serif font-bold mb-2">Lost your pass?</h2>
                        <p className="text-xs text-navy/60 mb-6 uppercase tracking-wider">
                            Enter details to recover booking
                        </p>
                        <form onSubmit={handleRecover} className="space-y-6">
                            <input
                                className="w-full border-b border-navy/20 py-3 text-sm outline-none focus:border-navy bg-transparent font-mono placeholder-navy/30 text-navy"
                                placeholder="Phone Number / UTR"
                                value={recoverInput}
                                onChange={(e) => setRecoverInput(e.target.value)}
                                required
                            />
                            <Button type="submit" className="w-full">
                                Search Booking
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavBar;
