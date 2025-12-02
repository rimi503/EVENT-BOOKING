import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
// ❌ Static image import hata diya
// import QRImg from "../Images/QR.jpg";

// 🎯 DEPLOYMENT VARIABLE
const API_BASE_URL = "http://localhost:5000";
// 👇 FIX: APNA ASLI UPI ID YAHAN DAALO
const MERCHANT_UPI = "rudragajjar744-2@okhdfcbank";
const MERCHANT_NAME = "The Gala Event";

const Booking = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [mainBooker, setMainBooker] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [members, setMembers] = useState([]);
  const [ticketData, setTicketData] = useState(null);
  const [utr, setUtr] = useState("");
  const [selectedApp, setSelectedApp] = useState("qr");

  // --- HANDLERS (Same) ---
  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
  };

  const addMember = () => {
    if (members.length < 4) setMembers([...members, { name: "", phone: "" }]);
  };

  const removeMember = (index) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setMembers(updatedMembers);
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validMembers = members.filter(
        (m) => m.name.trim() !== "" && m.phone.trim() !== ""
      );
      const res = await axios.post(
        `${API_BASE_URL}/api/tickets/initiate-booking`,
        {
          mainName: mainBooker.name,
          email: mainBooker.email,
          phone: mainBooker.phone,
          members: validMembers,
        }
      );
      if (res.data.success) {
        setTicketData(res.data);
        setStep(2);
      }
    } catch (error) {
      alert("Error saving details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!utr) return alert("Please enter UTR/Ref ID.");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/tickets/confirm-payment`,
        {
          ticketId: ticketData.ticketId,
          transactionId: utr,
        }
      );
      if (res.data.success) {
        setTicketData(res.data.ticket);
        setStep(3);
      }
    } catch (error) {
      alert("Error submitting payment or UTR already used.");
    } finally {
      setLoading(false);
    }
  };

  // --- UPI LINK GENERATOR (Fixed Amount) ---
  const generateUpiLink = (scheme = null) => {
    const upiBase = `upi://pay?pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${ticketData?.amount}&tn=Ticket-${ticketData?.ticketId}&cu=INR`;

    // Deep link schemes (Inka VPA bhi same rahega)
    if (scheme === "gpay")
      return `tez://upi/pay?pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${ticketData?.amount}&tn=Ticket-${ticketData?.ticketId}&cu=INR`;
    if (scheme === "phonepe")
      return `phonepe://pay?pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${ticketData?.amount}&tn=Ticket-${ticketData?.ticketId}&cu=INR`;
    if (scheme === "paytm")
      return `paytmmp://pay?pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${ticketData?.amount}&tn=Ticket-${ticketData?.ticketId}&cu=INR`;

    return upiBase; // Generic for QR
  };

  // --- TICKET VIEW ---
  const TicketSuccessStep = () => {
    const [status, setStatus] = useState("VERIFICATION_PENDING");
    const ticketRef = useRef(null);

    useEffect(() => {
      if (ticketData.paymentStatus === "PAID") {
        setStatus("PAID");
        return;
      }
      const interval = setInterval(async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/tickets/status/${ticketData.ticketId}`
          );
          setStatus(res.data.paymentStatus);
          if (res.data.paymentStatus === "PAID") clearInterval(interval);
        } catch (err) {}
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    const downloadTicket = async () => {
      if (!ticketRef.current) return;
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `EventPass-${ticketData.mainName}.png`;
      link.click();
    };

    return (
      <div className="animate-fadeIn w-full max-w-sm mx-auto">
        {/* Notification */}
        <div
          className={`mb-6 p-4 rounded-none border-l-4 text-sm ${
            status === "PAID"
              ? "bg-[#E6F4EA] border-[#1E4620] text-[#1E4620]"
              : "bg-[#FFF4E5] border-[#FFD699] text-[#663C00]"
          }`}
        >
          <p className="font-bold">
            {status === "PAID" ? "TICKET CONFIRMED" : "PAYMENT UNDER REVIEW"}
          </p>
          <p className="opacity-80 text-xs mt-1">
            {status === "PAID"
              ? "Your pass is ready."
              : "Please wait for approval..."}
          </p>
        </div>

        {/* --- TICKET CARD (Aesthetic) --- */}
        <div
          ref={ticketRef}
          className="bg-[#FDFBF7] text-[#1C1C1C] shadow-2xl relative overflow-hidden border border-[#E5E0D8]"
        >
          <div className="bg-[#1C1C1C] text-[#FDFBF7] p-6 text-center">
            <h3 className="font-serif text-2xl tracking-widest uppercase">
              GALA NIGHT
            </h3>
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-60">
              Official Entry Pass
            </p>
          </div>

          <div className="p-6 flex flex-col items-center">
            <div className="relative p-3 border border-[#E5E0D8] bg-white shadow-sm mb-6">
              <QRCodeCanvas
                value={ticketData.ticketId}
                size={150}
                fgColor="#1C1C1C"
              />
              {status !== "PAID" && (
                <div className="absolute inset-0 bg-[#FDFBF7]/90 backdrop-blur-[2px] flex flex-col items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-3 text-sm">
              <div className="flex justify-between border-b border-[#E5E0D8] pb-1">
                <span className="uppercase text-[10px] tracking-widest text-gray-400">
                  Guest
                </span>
                <span className="font-bold">{ticketData.mainName}</span>
              </div>
              <div className="flex justify-between border-b border-[#E5E0D8] pb-1">
                <span className="uppercase text-[10px] tracking-widest text-gray-400">
                  Pax
                </span>
                <span className="font-bold">
                  {ticketData.members.length + 1} People
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="uppercase text-[10px] tracking-widest text-gray-400">
                  ID
                </span>
                <span className="font-mono text-xs text-gray-500">
                  {ticketData.ticketId.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1C1C] p-3 text-center">
            <p className="text-[8px] text-[#8C8C88] uppercase tracking-[0.2em]">
              Admit One Group
            </p>
          </div>
        </div>

        <button
          onClick={downloadTicket}
          disabled={status !== "PAID"}
          className={`mt-6 w-full py-4 font-bold text-xs uppercase tracking-[0.2em] transition-all border border-[#1C1C1C] ${
            status === "PAID"
              ? "bg-[#1C1C1C] text-[#FDFBF7] hover:bg-white hover:text-[#1C1C1C]"
              : "bg-transparent text-gray-400 border-gray-300 cursor-not-allowed"
          }`}
        >
          {status === "PAID" ? "Download Ticket" : "Processing..."}
        </button>
      </div>
    );
  };

  // --- UPI PAYMENT OPTIONS COMPONENT ---
  const UpiPaymentOptions = () => {
    const upiApps = [
      {
        name: "GPay",
        scheme: "gpay",
        color: "bg-[#4285F4]",
        text: "text-white",
      },
      {
        name: "PhonePe",
        scheme: "phonepe",
        color: "bg-[#5F259F]",
        text: "text-white",
      },
      {
        name: "PayTM",
        scheme: "paytm",
        color: "bg-[#00B9F1]",
        text: "text-black",
      },
    ];

    const handleAppClick = (scheme) => {
      const link = generateUpiLink(scheme);
      window.open(link, "_blank");
      setSelectedApp(scheme);
    };

    return (
      <div className="w-full mb-6">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          1. Select Payment Method
        </h4>

        {/* QR CODE VIEW (Dynamic QR using VPA) */}
        <div className="flex justify-center mb-4 transition-opacity duration-300">
          <div
            className={`border border-gray-200 p-3 bg-white shadow-md rounded-lg ${
              selectedApp !== "qr" ? "opacity-50 md:opacity-100" : ""
            }`}
          >
            <QRCodeCanvas
              value={generateUpiLink()} // UPI Link with fixed amount
              size={150}
              fgColor="#1C1C1C"
              level="H"
            />
          </div>
        </div>

        {/* APP DEEP LINK BUTTONS */}
        <div className="space-y-2 md:space-y-0 md:flex md:justify-center md:gap-3 transition-opacity duration-300">
          {/* QR Code Button */}
          <button
            onClick={() => setSelectedApp("qr")}
            className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              selectedApp === "qr"
                ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            QR Code (Scan)
          </button>

          {/* Direct Pay Buttons (Opens UPI App) */}
          {upiApps.map((app) => (
            <button
              key={app.name}
              onClick={() => handleAppClick(app.scheme)}
              className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all ${
                selectedApp === app.scheme
                  ? `${app.color} ${app.text} border-transparent shadow-md`
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {app.name}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-gray-400 mt-2 font-bold tracking-widest">
          {selectedApp === "qr"
            ? "Scan above to pay."
            : `Opens ${selectedApp.toUpperCase()} app.`}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center items-center py-4 md:py-8">
      <div className="w-full max-w-7xl bg-[#FDFBF7] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[650px] border border-[#E5E0D8] rounded-3xl">
        {/* LEFT BRANDING */}
        <div className="hidden lg:flex lg:w-5/12 bg-[#1C1C1C] text-[#FDFBF7] p-12 flex-col justify-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#C2B280_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="relative z-10 space-y-6">
            <div className="inline-block border border-[#C2B280] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[#C2B280]">
              Dec 31 • 2025
            </div>
            <h1 className="font-serif text-6xl leading-none tracking-tight">
              The
              <br />
              Grand
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C2B280] to-[#E5E0D8]">
                Gala
              </span>
              .
            </h1>
            <p className="opacity-60 text-sm leading-relaxed max-w-xs font-light border-l border-[#C2B280] pl-4">
              Join us for an evening of elegance and celebration.
            </p>
          </div>
        </div>

        {/* RIGHT FORM AREA */}
        <div className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="lg:hidden mb-8 text-center border-b border-[#E5E0D8] pb-6">
            <h2 className="font-serif text-3xl text-[#1C1C1C]">THE GALA</h2>
          </div>

          {/* STEP 1: FORM */}
          {step === 1 && (
            <div className="animate-fadeIn max-w-lg mx-auto w-full">
              <div className="mb-8">
                <h2 className="text-2xl font-serif text-[#1C1C1C] mb-2">
                  Guest Registration
                </h2>
                <p className="text-xs text-gray-600 uppercase tracking-widest">
                  Enter details to generate pass
                </p>
              </div>
              <form onSubmit={handleDetailsSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="relative group">
                    <input
                      className="w-full bg-transparent border-b border-gray-300 py-3 text-lg text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors placeholder-transparent peer"
                      id="fullname"
                      placeholder="Name"
                      required
                      value={mainBooker.name}
                      onChange={(e) =>
                        setMainBooker({ ...mainBooker, name: e.target.value })
                      }
                    />
                    <label
                      htmlFor="fullname"
                      className="absolute left-0 -top-3.5 text-gray-600 text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs"
                    >
                      Main Guest Name
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative group">
                      <input
                        className="w-full bg-transparent border-b border-gray-300 py-3 text-lg text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors placeholder-transparent peer"
                        id="phone"
                        placeholder="Phone"
                        required
                        type="tel"
                        value={mainBooker.phone}
                        onChange={(e) =>
                          setMainBooker({
                            ...mainBooker,
                            phone: e.target.value,
                          })
                        }
                      />
                      <label
                        htmlFor="phone"
                        className="absolute left-0 -top-3.5 text-gray-600 text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs"
                      >
                        Phone Number
                      </label>
                    </div>
                    <div className="relative group">
                      <input
                        className="w-full bg-transparent border-b border-gray-300 py-3 text-lg text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors placeholder-transparent peer"
                        id="email"
                        placeholder="Email"
                        required
                        type="email"
                        value={mainBooker.email}
                        onChange={(e) =>
                          setMainBooker({
                            ...mainBooker,
                            email: e.target.value,
                          })
                        }
                      />
                      <label
                        htmlFor="email"
                        className="absolute left-0 -top-3.5 text-gray-600 text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-xs"
                      >
                        Email Address
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-400">
                      Accompanying Guests ({members.length}/4)
                    </label>
                    {members.length < 4 && (
                      <button
                        type="button"
                        onClick={addMember}
                        className="text-[10px] uppercase font-bold tracking-widest text-[#1C1C1C] hover:underline flex items-center gap-1"
                      >
                        <span>+</span> Add Guest
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div
                        key={index}
                        className="flex gap-4 items-end animate-fadeIn"
                      >
                        <input
                          className="flex-grow border-b border-gray-200 py-2 text-sm text-[#1C1C1C] focus:outline-none focus:border-gray-400 bg-transparent placeholder-gray-300"
                          placeholder="Guest Name"
                          value={member.name}
                          onChange={(e) =>
                            handleMemberChange(index, "name", e.target.value)
                          }
                        />
                        <input
                          className="w-28 border-b border-gray-200 py-2 text-sm text-[#1C1C1C] focus:outline-none focus:border-gray-400 bg-transparent placeholder-gray-300"
                          placeholder="Phone"
                          type="tel"
                          value={member.phone}
                          onChange={(e) =>
                            handleMemberChange(index, "phone", e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-gray-600 hover:text-red-500 transition text-xl leading-none pb-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-xs text-gray-600 italic">
                        No extra guests added.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    disabled={loading}
                    className="w-full bg-[#1C1C1C] text-[#FDFBF7] py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    {loading ? "Processing..." : "Continue to Payment"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && (
            <div className="animate-fadeIn max-w-sm mx-auto w-full text-center relative">
              {/* Back Button */}
              <button
                onClick={() => setStep(1)}
                className="absolute -top-8 left-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#1C1C1C] transition flex items-center gap-1"
              >
                ← Edit Details
              </button>

              <h3 className="font-serif text-3xl mb-2 mt-4">Secure Payment</h3>
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-8">
                Scan QR or use app link to pay
              </p>

              <UpiPaymentOptions
                amount={ticketData?.amount}
                ticketId={ticketData?.ticketId}
              />

              <div className="mb-8 mt-6">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                  Total Due
                </p>
                <p className="text-5xl font-serif text-[#1C1C1C]">
                  ₹{ticketData?.amount}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="group relative">
                  <input
                    className="w-full bg-[#F9FAFB] border border-gray-200 py-4 text-center tracking-widest font-mono text-lg text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-all rounded-none"
                    placeholder="ENTER UTR / REF ID"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-600 mt-2">
                    Check your payment app for 12-digit UTR
                  </p>
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-[#1C1C1C] text-[#FDFBF7] py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  {loading ? "Verifying..." : "I Have Paid"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: TICKET */}
          {step === 3 && <TicketSuccessStep />}
        </div>
      </div>
    </div>
  );
};

export default Booking;
