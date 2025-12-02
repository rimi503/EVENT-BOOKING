import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 🎯 OWNER CONFIGURATION
const API_BASE_URL = "http://localhost:5000"; 
const MERCHANT_UPI = "your_merchant_upi@okaxis"; 
const MERCHANT_NAME = "New Year Gala";   
const PASS_BG_URL = "https://i.imgur.com/c8p7r9A.jpeg"; // Horizontal Image

const Booking = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [warningAck, setWarningAck] = useState(false);

  // Data
  const [mainGuest, setMainGuest] = useState({ firstName: '', lastName: '', surname: '', phone: '', email: '' });
  const [members, setMembers] = useState([]); 
  const [ticketData, setTicketData] = useState(null); 
  const [utr, setUtr] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 1. RESTORE STATE ---
  useEffect(() => {
    const saved = localStorage.getItem('gala_session_v2');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            if(p.mainGuest) setMainGuest(p.mainGuest);
            if(p.members) setMembers(p.members);
            if(p.ticketData) setTicketData(p.ticketData);
            if(p.utr) setUtr(p.utr);
            
            if (p.ticketData) {
                const s = p.ticketData.paymentStatus;
                if (s === 'INITIATED') setStep(2);
                else if (s === 'VERIFICATION_PENDING' && !p.utr) setStep(3);
                else if (['VERIFICATION_PENDING', 'PAID', 'REJECTED'].includes(s)) setStep(4);
            }
        } catch (e) { localStorage.removeItem('gala_session_v2'); }
    }
    setIsLoaded(true);
  }, []);

  // --- 2. AUTO SAVE ---
  useEffect(() => {
    if (isLoaded && (mainGuest.firstName || ticketData)) {
        const session = { mainGuest, members, ticketData, utr };
        localStorage.setItem('gala_session_v2', JSON.stringify(session));
    }
  }, [mainGuest, members, ticketData, utr, isLoaded]);

  // --- HANDLERS ---
  const handleReset = () => {
      if(window.confirm("Reset Form? All data will be cleared.")) {
          localStorage.removeItem('gala_session_v2');
          window.location.reload();
      }
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const validMembers = members.filter(m => m.name.trim() !== "");
        const res = await axios.post(`${API_BASE_URL}/api/tickets/initiate-booking`, { mainGuest, members: validMembers });
        if(res.data.success) {
            setTicketData({ ...res.data, paymentStatus: 'INITIATED' });
            setStep(2);
        }
    } catch (error) { alert("Error initiating booking. Please try again."); }
    finally { setLoading(false); }
  };

  const handlePaymentSubmit = async (e) => {
      e.preventDefault();
      if(utr.length < 10) return alert("Please enter a valid 10-12 digit UTR.");
      setLoading(true);
      try {
          const res = await axios.post(`${API_BASE_URL}/api/tickets/confirm-payment`, { ticketId: ticketData.ticketId, transactionId: utr });
          if(res.data.success) {
              setTicketData(res.data.ticket);
              setStep(4);
          }
      } catch (e) { alert(e.response?.data?.message || "Verification Failed"); }
      finally { setLoading(false); }
  };

  const getUPI = (app) => {
      if(!ticketData) return "";
      const amt = ticketData.totalAmount;
      const params = `pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${amt}&tn=TICKET-${ticketData.ticketId}&cu=INR`;
      
      if(app === 'gpay') return `tez://upi/pay?${params}`;
      if(app === 'phonepe') return `phonepe://upi/pay?${params}`;
      if(app === 'paytm') return `paytmmp://upi/pay?${params}`;
      return `upi://pay?${params}`;
  };

  // --- STATUS & DOWNLOAD PAGE ---
  const StatusPage = () => {
      const [status, setStatus] = useState(ticketData?.paymentStatus);
      const [reason, setReason] = useState(ticketData?.rejectionReason);

      useEffect(() => {
          if(status === 'PAID' || status === 'REJECTED') return;
          
          const interval = setInterval(async () => {
              try {
                  const res = await axios.get(`${API_BASE_URL}/api/tickets/status/${ticketData.ticketId}`);
                  setStatus(res.data.paymentStatus);
                  setReason(res.data.rejectionReason);
                  
                  const ls = JSON.parse(localStorage.getItem('gala_session_v2') || '{}');
                  ls.ticketData = res.data;
                  localStorage.setItem('gala_session_v2', JSON.stringify(ls));

                  if(res.data.paymentStatus !== 'VERIFICATION_PENDING') clearInterval(interval);
              } catch (e) { 
                  if(e.response?.status === 404) { 
                      alert("Session invalid or ticket deleted."); 
                      handleReset(); 
                  } 
              }
          }, 2000);
          return () => clearInterval(interval);
      }, [status]);

      // --- PASS COMPONENT (HORIZONTAL) ---
      const FinalPass = ({ name, id, index }) => {
          const passRef = useRef();
          const [generating, setGenerating] = useState(false);

          const downloadPDF = async () => {
              if (!passRef.current) return;
              setGenerating(true);
              
              try {
                  // Use html2canvas with forced background color to avoid transparency issues
                  const canvas = await html2canvas(passRef.current, {
                      scale: 2,
                      useCORS: true,
                      backgroundColor: '#000000', 
                      logging: false,
                  });

                  const imgData = canvas.toDataURL('image/png');
                  
                  // Create Landscape PDF matching the container dimensions roughly
                  // 600px width corresponds to roughly 211mm in standard printing terms (at 72dpi)
                  // but for screen PDF, we can use px units or match aspect ratio.
                  // A standard A5 landscape or custom size works well.
                  const pdf = new jsPDF({
                      orientation: 'landscape',
                      unit: 'px',
                      format: [600, 300] 
                  });

                  pdf.addImage(imgData, 'PNG', 0, 0, 600, 300);
                  pdf.save(`Pass-${name.replace(/\s+/g, '_')}.pdf`);

              } catch (error) {
                  console.error("PDF Error:", error);
                  alert("Failed to generate PDF.");
              } finally {
                  setGenerating(false);
              }
          };

          return (
            <div className="flex flex-col items-center mb-8 w-full">
                {/* HORIZONTAL TICKET CONTAINER
                   - Using inline styles for colors to prevent 'oklab' error in html2canvas
                   - Tailwind for layout structure
                */}
                <div className="overflow-x-auto w-full flex justify-center p-2">
                    <div 
                        ref={passRef}
                        className="relative w-[600px] h-[300px] flex-shrink-0 rounded-xl shadow-2xl overflow-hidden"
                        style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    >
                        {/* Background Image */}
                        {/* <img 
                            src={PASS_BG_URL} 
                            className="absolute inset-0 w-full h-full object-cover" 
                            crossOrigin="anonymous" 
                            alt="pass"
                        /> */}

                        {/* OVERLAYS */}
                        
                        {/* Top Left: Branding */}
                        <div className="absolute top-6 left-8 z-10">
                             <p className="text-xs tracking-[0.3em] uppercase opacity-80 font-light" style={{ color: '#ffffff' }}>New Year</p>
                             <h1 className="text-5xl font-serif font-bold leading-none mt-1 drop-shadow-lg" style={{ color: '#eab308' }}>GALA</h1>
                        </div>

                        {/* Right Side: Guest Info */}
                        <div className="absolute top-1/2 right-10 -translate-y-1/2 text-right z-10 w-1/2">
                            <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#d1d5db' }}>Guest Name</p>
                            <h2 className="text-3xl font-bold uppercase font-sans tracking-wide leading-tight drop-shadow-md break-words" style={{ color: '#ffffff' }}>
                                {name}
                            </h2>
                            <div className="mt-4 inline-block border px-3 py-1 rounded backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                                <p className="text-[10px] font-mono tracking-widest" style={{ color: '#ffffff' }}>
                                    ID: {id}-{index + 1}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="absolute bottom-0 left-0 w-full h-10 flex items-center justify-between px-8" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#9ca3af' }}>Admit One</span>
                            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#9ca3af' }}>Non-Transferable</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={downloadPDF} 
                    disabled={generating}
                    className="mt-4 bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2"
                >
                    {generating ? "Processing..." : "Download PDF Pass"}
                </button>
            </div>
          );
      };

      if(status === 'REJECTED') return (
          <div className="text-center py-12 animate-fadeIn">
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-red-600">Application Rejected</h2>
              <div className="bg-red-50 border border-red-200 p-4 mt-4 rounded text-sm text-red-800 text-left max-w-xs mx-auto">
                  <p className="font-bold text-xs uppercase mb-1 opacity-70">Reason:</p>
                  "{reason || "Verification Failed"}"
              </div>
              <button onClick={() => {setStep(3); setUtr('');}} className="mt-6 bg-black text-white py-3 px-8 rounded font-bold text-xs">Retry Payment Info</button>
          </div>
      );

      if(status !== 'PAID') return (
          <div className="text-center py-20 animate-fadeIn">
              <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-black rounded-full mx-auto mb-6"></div>
              <h2 className="text-xl font-bold">Verifying Payment...</h2>
              <p className="text-xs text-gray-500 mt-2">Admin is checking UTR: <span className="font-mono text-black">{ticketData.transactionId}</span></p>
              <p className="text-[10px] text-red-400 mt-8 animate-pulse">DO NOT CLOSE OR REFRESH</p>
          </div>
      );

      return (
          <div className="py-8 animate-fadeIn w-full max-w-5xl mx-auto">
              <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-green-700 mb-2">Booking Confirmed ✅</h2>
                  <p className="text-sm text-gray-600">Download your official event passes below.</p>
                  <button onClick={() => window.open(`https://wa.me/?text=Got our passes for the Gala!`, '_blank')} className="mt-4 text-[10px] font-bold text-green-600 border border-green-600 px-4 py-1 rounded-full hover:bg-green-50">Share on WhatsApp</button>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                  {/* Main Guest Pass */}
                  <FinalPass name={`${ticketData.mainGuest.firstName} ${ticketData.mainGuest.lastName}`} id={ticketData.ticketId} index={0} />
                  
                  {/* Sub Members Passes */}
                  {ticketData.members.map((m, i) => (
                      <FinalPass key={i} name={m.name} id={ticketData.ticketId} index={i+1} />
                  ))}
              </div>
              
              <div className="text-center mt-12 pt-8 border-t border-gray-200">
                  <button onClick={handleReset} className="text-gray-400 text-xs underline hover:text-black">Start A New Booking</button>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-[#1C1C1C] p-6 text-white flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-widest">Party NIGHT</h1>
                <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className={`h-1 w-4 rounded ${step >= i ? 'bg-white' : 'bg-white/20'}`}></div>)}
                </div>
            </div>
            
            <div className="p-6 md:p-10">
                
                {/* STEP 1: GUEST FORM */}
                {step === 1 && (
                    <form onSubmit={handleInitiate} className="space-y-5 animate-fadeIn">
                        <div className="flex justify-between items-end border-b pb-2 mb-4">
                            <h3 className="font-bold text-lg">1. Main Guest</h3>
                            <button type="button" onClick={handleReset} className="text-[10px] text-red-500 font-bold uppercase">Reset Form</button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            <input className="input-field" placeholder="First Name" required value={mainGuest.firstName} onChange={e=>setMainGuest({...mainGuest, firstName: e.target.value})} />
                            <input className="input-field" placeholder="Last Name" required value={mainGuest.lastName} onChange={e=>setMainGuest({...mainGuest, lastName: e.target.value})} />
                            <input className="input-field" placeholder="Surname" required value={mainGuest.surname} onChange={e=>setMainGuest({...mainGuest, surname: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input className="input-field" type="tel" placeholder="Phone Number" required value={mainGuest.phone} onChange={e=>setMainGuest({...mainGuest, phone: e.target.value})} />
                            <input className="input-field" type="email" placeholder="Email Address" required value={mainGuest.email} onChange={e=>setMainGuest({...mainGuest, email: e.target.value})} />
                        </div>

                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg">2. Add Members ({members.length})</h3>
                                {members.length < 4 && <button type="button" onClick={()=>setMembers([...members, {name:'', phone:''}])} className="text-xs bg-black text-white px-3 py-1 rounded font-bold">+ ADD</button>}
                            </div>
                            {members.map((m, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input className="input-field flex-grow" placeholder="Full Name" value={m.name} onChange={e=>{const n=[...members]; n[i].name=e.target.value; setMembers(n)}} />
                                    <input className="input-field w-1/3" placeholder="Phone" type="tel" value={m.phone} onChange={e=>{const n=[...members]; n[i].phone=e.target.value; setMembers(n)}} />
                                    <button type="button" onClick={()=>{const n=[...members]; n.splice(i,1); setMembers(n)}} className="text-red-500 font-bold px-2">×</button>
                                </div>
                            ))}
                            {members.length === 0 && <p className="text-xs text-gray-400 italic">No additional members added.</p>}
                        </div>

                        <button disabled={loading} className="w-full bg-[#1C1C1C] text-white py-4 mt-6 font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-800 transition">
                            {loading ? "Processing..." : "Continue to Payment"}
                        </button>
                    </form>
                )}

                {/* STEP 2: PAYMENT SCREEN */}
                {step === 2 && (
                    <div className="text-center animate-fadeIn">
                        <button onClick={() => setStep(1)} className="text-xs text-gray-400 mb-6 hover:text-black">← Back</button>
                        <h2 className="text-4xl font-bold mb-1">₹{ticketData.totalAmount}</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">Total for {1 + members.length} Persons</p>
                        
                        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-xl mb-8 inline-block relative">
                            <QRCodeCanvas value={getUPI()} size={180} level="H" />
                            <p className="text-[9px] mt-2 text-gray-400 uppercase font-bold tracking-wider">Scan to Pay</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-8 max-w-xs mx-auto">
                            <button onClick={() => window.location.href = getUPI('gpay')} className="py-3 border rounded font-bold text-blue-600 bg-blue-50 hover:bg-blue-100">Pay via GPay</button>
                            <button onClick={() => window.location.href = getUPI('phonepe')} className="py-3 border rounded font-bold text-purple-600 bg-purple-50 hover:bg-purple-100">Pay via PhonePe</button>
                            <button onClick={() => window.location.href = getUPI('paytm')} className="py-3 border rounded font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100">Pay via Paytm</button>
                        </div>

                        <button onClick={() => setStep(3)} className="w-full bg-green-600 text-white py-4 rounded font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-green-700">
                            I Have Paid → Next
                        </button>
                    </div>
                )}

                {/* STEP 3: VERIFY UTR */}
                {step === 3 && (
                    <div className="max-w-sm mx-auto animate-fadeIn">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <h3 className="font-bold text-yellow-800 text-sm">⚠️ Payment Verification</h3>
                            <p className="text-xs text-yellow-700 mt-1">Enter the 12-digit Transaction ID / UTR from your payment app to verify. Do not refresh.</p>
                        </div>
                        
                        <form onSubmit={handlePaymentSubmit}>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Transaction ID (UTR)</label>
                            <input className="w-full border-2 border-gray-300 p-3 rounded text-center font-mono tracking-widest text-lg focus:border-black focus:outline-none mb-6 uppercase" placeholder="XXXXXXXXXXXX" value={utr} onChange={e => setUtr(e.target.value)} maxLength={12} />
                            
                            <div className="flex items-start gap-3 mb-6 p-3 bg-gray-50 rounded">
                                <input type="checkbox" id="ack" className="mt-1" checked={warningAck} onChange={e => setWarningAck(e.target.checked)} />
                                <label htmlFor="ack" className="text-xs text-gray-600 leading-tight">I confirm that I have paid the exact amount of <strong>₹{ticketData.totalAmount}</strong>.</label>
                            </div>

                            <button disabled={!warningAck || loading} className={`w-full py-4 rounded font-bold text-xs uppercase tracking-widest transition ${warningAck ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                                {loading ? "Submitting..." : "Verify Payment"}
                            </button>
                            <button type="button" onClick={() => setStep(2)} className="w-full mt-4 text-xs text-gray-400">Back to Payment</button>
                        </form>
                    </div>
                )}

                {step === 4 && <StatusPage />}

            </div>
        </div>
        <style>{`
            .input-field { @apply w-full border-b border-gray-300 py-2 text-sm outline-none focus:border-black transition-colors bg-transparent placeholder-gray-400; }
            .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
};

export default Booking;