import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('VERIFICATION_PENDING'); // Default view: PENDING
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Auth check & Polling (Same as before)
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/login');
    
    fetchTickets();
    const interval = setInterval(() => fetchTickets(true), 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tickets/all-tickets');
      setTickets(res.data);
    } catch (error) { console.error("Sync Error"); }
  };

  const handleAction = async (ticketId, status) => {
    if (!window.confirm(`Mark as ${status}?`)) return;
    try {
      await axios.post('http://localhost:5000/api/tickets/update-status', { ticketId, status });
      fetchTickets();
    } catch (error) { alert("Failed"); }
  };

  // --- LOGIC: COPY TO CLIPBOARD ---
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("UTR Copied: " + text); // Chaho to Toast use kar lena
  };

  // --- LOGIC: FILTER & SEARCH ---
  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'ALL' ? true : t.paymentStatus === filter;
    const matchesSearch = t.mainName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.transactionId?.includes(searchTerm);
    // Sirf wahi dikhao jo Initiated se aage badh gaye hain
    return matchesFilter && matchesSearch && t.paymentStatus !== 'INITIATED';
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* Header & Tabs */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 sticky top-4 z-10">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
                <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">Live Sync 🟢</div>
            </div>

            {/* Tabs Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setFilter('VERIFICATION_PENDING')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'VERIFICATION_PENDING' ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    ⏳ Pending ({tickets.filter(t => t.paymentStatus === 'VERIFICATION_PENDING').length})
                </button>
                <button onClick={() => setFilter('PAID')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'PAID' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    ✅ Approved
                </button>
                <button onClick={() => setFilter('ALL')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    All Records
                </button>
            </div>

            {/* Search Bar */}
            <input 
                type="text" 
                placeholder="🔍 Search by Name or UTR..." 
                className="w-full mt-3 p-2 border rounded-lg text-sm bg-slate-50"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* --- CARDS LIST (Mobile First) --- */}
        <div className="space-y-3">
            {filteredTickets.map((t) => (
               <div key={t.ticketId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                   {/* Header Row */}
                   <div className="flex justify-between items-start">
                       <div>
                           <h3 className="font-bold text-slate-800">{t.mainName}</h3>
                           <p className="text-xs text-slate-500">Guests: {t.members.length + 1} | Amount: ₹{t.amount}</p>
                       </div>
                       <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {t.paymentStatus.replace('VERIFICATION_', '')}
                       </span>
                   </div>

                   {/* UTR Copy Section */}
                   <div className="mt-3 flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                       <span className="font-mono text-sm text-slate-700 flex-grow">{t.transactionId}</span>
                       <button onClick={() => copyToClipboard(t.transactionId)} className="text-blue-600 text-xs font-bold uppercase hover:bg-blue-50 px-2 py-1 rounded">
                           Copy
                       </button>
                   </div>

                   {/* Action Buttons (Sirf Pending walo ke liye) */}
                   {t.paymentStatus === 'VERIFICATION_PENDING' && (
                       <div className="mt-4 grid grid-cols-2 gap-3">
                           <button onClick={() => handleAction(t.ticketId, 'PAID')} className="bg-green-500 text-white py-3 rounded-lg font-bold shadow-sm active:scale-95">
                               ACCEPT
                           </button>
                           <button onClick={() => handleAction(t.ticketId, 'REJECTED')} className="bg-red-50 text-red-600 py-3 rounded-lg font-bold active:scale-95">
                               REJECT
                           </button>
                       </div>
                   )}
               </div>
            ))}

            {filteredTickets.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                    No tickets found in this category.
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Admin;