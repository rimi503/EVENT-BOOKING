import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import MainLayout from '../layouts/MainLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import DigitalTicket from '../components/ticket/DigitalTicket';

// Configuration
const API_BASE_URL = "http://localhost:5000";
const MERCHANT_UPI = "your_merchant_upi@okaxis";
const MERCHANT_NAME = "New Year Gala";

const BookingPage = ({ isAdmin, setIsAdmin }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [warningAck, setWarningAck] = useState(false);

    // Data State
    const [mainGuest, setMainGuest] = useState({ firstName: '', lastName: '', surname: '', phone: '', email: '' });
    const [members, setMembers] = useState([]);
    const [ticketData, setTicketData] = useState(null);
    const [utr, setUtr] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    // Status Polling State
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // --- 1. RESTORE STATE ---
    useEffect(() => {
        const saved = localStorage.getItem('gala_session_v2');
        if (saved) {
            try {
                const p = JSON.parse(saved);
                if (p.mainGuest) setMainGuest(p.mainGuest);
                if (p.members) setMembers(p.members);
                if (p.ticketData) {
                    setTicketData(p.ticketData);
                    setPaymentStatus(p.ticketData.paymentStatus);
                }
                if (p.utr) setUtr(p.utr);

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
    }, [mainGuest, members, ticketData, utr, isLoaded, paymentStatus]);

    // --- 3. STATUS POLLING ---
    useEffect(() => {
        if (step !== 4 || paymentStatus === 'PAID' || paymentStatus === 'REJECTED' || !ticketData) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/tickets/status/${ticketData.ticketId}`);
                setPaymentStatus(res.data.paymentStatus);
                setRejectionReason(res.data.rejectionReason);

                // Update local Ticket Data
                setTicketData(prev => ({ ...prev, ...res.data }));

                if (res.data.paymentStatus !== 'VERIFICATION_PENDING') {
                    clearInterval(interval);
                }
            } catch (e) {
                if (e.response?.status === 404) {
                    alert("Session invalid or ticket deleted.");
                    handleReset();
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [step, paymentStatus, ticketData]);

    // --- HANDLERS ---
    const handleReset = () => {
        if (window.confirm("Start a new booking? Current progress will be lost.")) {
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
            if (res.data.success) {
                setTicketData({ ...res.data, paymentStatus: 'INITIATED' });
                setStep(2);
            }
        } catch (error) { alert("Error initiating booking. Please try again."); }
        finally { setLoading(false); }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (utr.length < 10) return alert("Please enter a valid 10-12 digit UTR.");
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/tickets/confirm-payment`, { ticketId: ticketData.ticketId, transactionId: utr });
            if (res.data.success) {
                setTicketData(res.data.ticket);
                setPaymentStatus(res.data.ticket.paymentStatus);
                setStep(4);
            }
        } catch (e) { alert(e.response?.data?.message || "Verification Failed"); }
        finally { setLoading(false); }
    };

    const getUPI = (app) => {
        if (!ticketData) return "";
        const amt = ticketData.totalAmount;
        const params = `pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${amt}&tn=TICKET-${ticketData.ticketId}&cu=INR`;
        if (app === 'gpay') return `tez://upi/pay?${params}`;
        if (app === 'phonepe') return `phonepe://upi/pay?${params}`;
        if (app === 'paytm') return `paytmmp://upi/pay?${params}`;
        return `upi://pay?${params}`;
    };

    // --- RENDER HELPERS ---
    const StepIndicator = () => (
        <div className="flex gap-2 mb-8 justify-center">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 w-12 rounded-full transition-colors duration-300 ${step >= i ? 'bg-navy' : 'bg-navy/10'}`}></div>
            ))}
        </div>
    );

    return (
        <MainLayout isAdmin={isAdmin} setIsAdmin={setIsAdmin}>
            <div className="flex flex-col items-center justify-center min-h-[80vh] py-10 w-full animate-slide-up">

                {step < 4 && (
                    <div className="w-full max-w-3xl mb-10 text-center">
                        <h1 className="text-4xl md:text-5xl font-serif font-black mb-4 text-navy">Secure your Spot<span className="text-plum">.</span></h1>
                        <p className="text-navy/60 text-sm uppercase tracking-widest">Join the exclusive New Year Gala 2025</p>
                    </div>
                )}

                {step < 4 && <StepIndicator />}

                {/* Card uses transparent white with glass effect */}
                <div className="w-full max-w-2xl bg-white/50 backdrop-blur-md p-8 md:p-12 rounded-2xl shadow-xl border border-white relative overflow-hidden">
                    {/* Step 1: Guest Details */}
                    {step === 1 && (
                        <form onSubmit={handleInitiate} className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-end border-b border-navy/10 pb-4">
                                <h3 className="font-bold text-lg font-serif">Main Guest Details</h3>
                                <button type="button" onClick={handleReset} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest transition-colors">Reset Form</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input label="First Name" required value={mainGuest.firstName} onChange={e => setMainGuest({ ...mainGuest, firstName: e.target.value })} />
                                <Input label="Last Name" required value={mainGuest.lastName} onChange={e => setMainGuest({ ...mainGuest, lastName: e.target.value })} />
                                <Input label="Surname" required value={mainGuest.surname} onChange={e => setMainGuest({ ...mainGuest, surname: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Phone Number" required type="tel" value={mainGuest.phone} onChange={e => setMainGuest({ ...mainGuest, phone: e.target.value })} />
                                <Input label="Email Address" required type="email" value={mainGuest.email} onChange={e => setMainGuest({ ...mainGuest, email: e.target.value })} />
                            </div>

                            <div className="pt-6 border-t border-navy/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg font-serif">Additional Guests <span className="text-navy/40 text-sm font-sans">({members.length})</span></h3>
                                    {members.length < 4 && (
                                        <Button type="button" variant="secondary" onClick={() => setMembers([...members, { name: '', phone: '' }])} className="!py-2 !px-4 !text-[10px]">
                                            + Add Guest
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {members.map((m, i) => (
                                        <div key={i} className="flex gap-4 items-end animate-slide-up">
                                            <span className="text-xs font-bold text-navy/30 mb-3 w-4">{i + 1}.</span>
                                            <Input className="flex-grow" label="Guest Name" value={m.name} onChange={e => { const n = [...members]; n[i].name = e.target.value; setMembers(n) }} />
                                            <Input className="w-1/3" label="Phone (Optional)" type="tel" value={m.phone} onChange={e => { const n = [...members]; n[i].phone = e.target.value; setMembers(n) }} />
                                            <button type="button" onClick={() => { const n = [...members]; n.splice(i, 1); setMembers(n) }} className="text-red-400 hover:text-red-600 text-xl font-bold mb-2 ml-2">×</button>
                                        </div>
                                    ))}
                                    {members.length === 0 && <p className="text-xs text-navy/40 italic text-center py-4 bg-navy/5 rounded-lg">No additional guests added.</p>}
                                </div>
                            </div>

                            <Button loading={loading} className="w-full mt-6">
                                Continue to Payment
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Payment */}
                    {step === 2 && (
                        <div className="text-center animate-fade-in">
                            <div className="mb-6 flex justify-between items-center">
                                <button onClick={() => setStep(1)} className="text-xs text-navy/40 hover:text-navy transition-colors">← Back</button>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-plum/10 text-plum px-3 py-1 rounded-full">Secure Payment</span>
                            </div>

                            <h2 className="text-6xl font-serif font-black mb-2 text-navy">₹{ticketData.totalAmount}</h2>
                            <p className="text-xs text-navy/50 uppercase tracking-widest mb-8">Total for {1 + members.length} {members.length + 1 === 1 ? 'Person' : 'Persons'}</p>

                            <div className="bg-white p-4 border border-gray-100 shadow-2xl rounded-2xl mb-10 inline-block relative rotate-1 hover:rotate-0 transition-transform duration-500">
                                <div className="absolute -inset-1 bg-gradient-to-br from-plum to-transparent opacity-30 blur-lg rounded-2xl"></div>
                                <QRCodeCanvas value={getUPI()} size={200} level="Q" className="relative z-10" />
                            </div>

                            <div className="max-w-xs mx-auto space-y-3 mb-8">
                                <p className="text-[10px] uppercase font-bold text-navy/40 mb-2">Pay using UPI App</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => window.location.href = getUPI('gpay')} className="py-2 border border-navy/10 rounded font-bold text-[10px] hover:bg-navy/5 transition text-navy">GPay</button>
                                    <button onClick={() => window.location.href = getUPI('phonepe')} className="py-2 border border-navy/10 rounded font-bold text-[10px] hover:bg-navy/5 transition text-navy">PhonePe</button>
                                    <button onClick={() => window.location.href = getUPI('paytm')} className="py-2 border border-navy/10 rounded font-bold text-[10px] hover:bg-navy/5 transition text-navy">Paytm</button>
                                </div>
                            </div>

                            <Button onClick={() => setStep(3)} className="w-full bg-green-600 hover:bg-green-700 hover:shadow-green-500/20 text-white">
                                I Have Made the Payment
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Verification */}
                    {step === 3 && (
                        <div className="animate-fade-in max-w-md mx-auto">
                            <div className="mb-6 flex justify-between items-center">
                                <button onClick={() => setStep(2)} className="text-xs text-navy/40 hover:text-navy transition-colors">← Back</button>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-400/10 text-yellow-700 px-3 py-1 rounded-full">Verification</span>
                            </div>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
                                <h3 className="font-bold text-yellow-800 text-sm mb-1">Payment Verification Required</h3>
                                <p className="text-xs text-yellow-700 leading-relaxed">Please enter the 12-digit Transaction ID (UTR) found in your UPI app's payment history to verify your booking.</p>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/50">Transaction ID (UTR)</label>
                                    <input
                                        className="w-full border-2 border-navy/20 p-4 rounded-lg text-center font-mono tracking-[0.5em] text-xl bg-white focus:border-navy focus:outline-none transition-all uppercase placeholder-navy/20 text-navy"
                                        placeholder="XXXXXXXXXXXX"
                                        value={utr}
                                        onChange={e => setUtr(e.target.value)}
                                        maxLength={12}
                                    />
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-navy/5 rounded-lg border border-navy/10 cursor-pointer" onClick={() => setWarningAck(!warningAck)}>
                                    <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${warningAck ? 'bg-navy border-navy' : 'border-gray-300 bg-white'}`}>
                                        {warningAck && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <label className="text-xs text-navy/80 leading-tight cursor-pointer select-none">
                                        I confirm that I have transferred exactly <strong className="text-navy">₹{ticketData.totalAmount}</strong> to the merchant. Incorrect details may lead to rejection.
                                    </label>
                                </div>

                                <Button
                                    disabled={!warningAck || loading}
                                    loading={loading}
                                    className={`w-full ${!warningAck ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' : ''}`}
                                >
                                    Verify Payment
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Step 4: Status / Final Ticket */}
                {step === 4 && (
                    <div className="w-full max-w-4xl animate-slide-up">

                        {/* PENDING STATE */}
                        {paymentStatus === 'VERIFICATION_PENDING' && (
                            <div className="bg-white/80 p-12 rounded-2xl shadow-xl text-center max-w-xl mx-auto border border-white">
                                <div className="w-20 h-20 border-4 border-navy/10 border-t-plum rounded-full animate-spin mx-auto mb-8"></div>
                                <h2 className="text-2xl font-serif font-bold mb-4 text-navy">Verifying Payment...</h2>
                                <p className="text-sm text-navy/60 mb-2">Our team is checking your transaction ID:</p>
                                <p className="font-mono text-lg font-bold bg-navy/5 py-2 px-4 rounded-lg inline-block text-navy">{ticketData.transactionId}</p>

                                <div className="mt-10 p-4 bg-blue-50 text-blue-800 text-xs rounded-lg animate-pulse">
                                    Please do not close or refresh this page. This usually takes 2-5 minutes.
                                </div>
                            </div>
                        )}

                        {/* REJECTED STATE */}
                        {paymentStatus === 'REJECTED' && (
                            <div className="bg-white/80 p-12 rounded-2xl shadow-xl text-center max-w-xl mx-auto border-t-4 border-red-500">
                                <div className="text-6xl mb-6">❌</div>
                                <h2 className="text-2xl font-bold text-red-600 mb-2">Booking Rejected</h2>
                                <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Verification Failed</p>

                                <div className="bg-red-50 border border-red-100 p-6 rounded-lg text-left mb-8">
                                    <p className="text-[10px] font-bold uppercase text-red-400 mb-2">Reason provided by Admin:</p>
                                    <p className="text-red-900 font-medium">"{rejectionReason || "Details did not match."}"</p>
                                </div>

                                <Button variant="outline" className="!text-navy !border-navy hover:!bg-navy hover:!text-cream" onClick={() => { setStep(3); setUtr(''); }}>
                                    Retry Payment Details
                                </Button>
                                <div className="mt-4">
                                    <button onClick={handleReset} className="text-navy/40 text-xs hover:text-red-500 underline">Cancel Booking</button>
                                </div>
                            </div>
                        )}

                        {/* APPROVED STATE */}
                        {paymentStatus === 'PAID' && (
                            <div className="text-center">
                                <div className="mb-12 animate-fade-in">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 text-3xl mb-6 shadow-lg shadow-green-100">
                                        ✓
                                    </div>
                                    <h2 className="text-4xl font-serif font-bold text-navy mb-2">Booking Confirmed</h2>
                                    <p className="text-navy/60">Your passes are ready. See you at the Gala!</p>
                                    <button onClick={() => window.open(`https://wa.me/?text=Got our passes for the Gala!`, '_blank')} className="mt-6 text-[10px] font-bold text-green-600 border border-green-200 bg-white px-5 py-2 rounded-full hover:bg-green-50 transition-colors shadow-sm">
                                        Share Confirmation on WhatsApp
                                    </button>
                                </div>

                                <div className="flex flex-col gap-8 w-full items-center">
                                    <DigitalTicket
                                        name={`${ticketData.mainGuest.firstName} ${ticketData.mainGuest.lastName}`}
                                        id={ticketData.ticketId}
                                        index={0}
                                    />
                                    {ticketData.members.map((m, i) => (
                                        <DigitalTicket
                                            key={i}
                                            name={m.name}
                                            id={ticketData.ticketId}
                                            index={i + 1}
                                        />
                                    ))}
                                </div>

                                <div className="mt-20 pt-10 border-t border-navy/10">
                                    <Button variant="ghost" onClick={handleReset}>Book Another Ticket</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </MainLayout>
    );
};

export default BookingPage;
