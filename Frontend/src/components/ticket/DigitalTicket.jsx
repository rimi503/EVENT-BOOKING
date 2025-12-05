import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

const DigitalTicket = ({ name, id, index, eventName = "New Year Gala" }) => {
    const passRef = useRef();
    const [generating, setGenerating] = useState(false);

    const downloadPDF = async () => {
        if (!passRef.current) return;
        setGenerating(true);

        try {
            // 1. Wait for everything to settle
            await document.fonts.ready.catch(e => console.log("Font load warn:", e)); // robust wait
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(passRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#1C2340',
                logging: true, // Enable logging to see issues in console
                allowTaint: false, // CRITICAL: Must be false to use toDataURL
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('[data-ticket="true"]');
                    if (el) {
                        // 1. Remove Shadows (Tailwind v4 might use oklab for shadow colors)
                        el.style.boxShadow = 'none';
                        el.querySelectorAll('*').forEach(child => {
                            child.style.boxShadow = 'none';
                        });

                        // 2. Handle Glass/Blur elements -> Make them solid/simple
                        const glassElements = el.querySelectorAll('.backdrop-blur-sm, .backdrop-blur-lg');
                        glassElements.forEach(g => {
                            g.style.backdropFilter = 'none';
                            g.style.background = 'rgba(255, 255, 255, 0.95)';
                        });

                        // 3. Handle Opacity/Alpha colors (bg-plum/40 etc might be oklab)
                        // Identify decorative blobs by their classes or structure
                        const blobs = el.querySelectorAll('.rounded-full.blur-\\[80px\\]');
                        blobs.forEach(blob => {
                            blob.style.display = 'none'; // Hide decorative blurs completely for PDF (cleaner, avoids parsing issues)
                        });

                        // 4. Force borders to standard RGB (fix oklab error)
                        el.style.borderColor = 'rgba(255,255,255,0.1)';
                        const bordered = el.querySelectorAll('[class*="border"]');
                        bordered.forEach(b => { b.style.borderColor = 'rgba(28, 35, 64, 0.1)'; });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [600, 300]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 600, 300);
            pdf.save(`Pass-${name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Error:", error);
            alert(`Failed to generate PDF: ${error.message || "Unknown error"}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto animate-slide-up">
            {/* Ticket Container */}
            <div className="overflow-x-auto w-full flex justify-center p-4">
                {/* Ticket Ref */}
                <div
                    ref={passRef}
                    data-ticket="true"
                    className="relative w-[600px] h-[300px] flex-shrink-0 rounded-2xl overflow-hidden bg-navy text-cream shadow-2xl border border-white/5"
                >
                    {/* Decorative Elements - Simplified for render reliability */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-plum/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cream/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 opacity-50"></div>

                    {/* Layout */}
                    <div className="relative z-10 h-full flex">
                        {/* Left Section: Event Info */}
                        <div className="w-[65%] h-full p-8 flex flex-col justify-between border-r border-dashed border-cream/20 relative">
                            {/* Perforation circles */}
                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-cream rounded-full"></div>
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-cream rounded-full"></div>

                            <div>
                                <p className="text-[10px] tracking-[0.4em] uppercase text-gold-400 font-bold mb-2">Exclusive Entry</p>
                                <h1 className="text-5xl font-serif font-black leading-none italic tracking-tighter text-cream">
                                    {eventName}<span className="text-plum">.</span>
                                </h1>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest text-cream/50 mb-1">Guest Name</p>
                                    <h2 className="text-2xl font-bold uppercase tracking-wide truncate text-cream">{name}</h2>
                                </div>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-cream/50">Date</p>
                                        <p className="text-sm font-bold text-cream">Dec 31, 2025</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-cream/50">Time</p>
                                        <p className="text-sm font-bold text-cream">8:00 PM</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-[9px] text-cream/40 uppercase tracking-widest">
                                Non-Transferable • ID Required
                            </div>
                        </div>

                        {/* Right Section: QR & Code */}
                        <div className="w-[35%] h-full p-6 flex flex-col justify-center items-center bg-white/10 backdrop-blur-sm rounded-l-3xl">
                            <div className="bg-white p-2 rounded-lg mb-4 shadow-lg">
                                <QRCodeCanvas value={`TICKET-${id}-${index}`} size={100} />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-cream/50 mb-1">Ticket ID</p>
                            <p className="font-mono text-sm font-bold text-gold-400">{id}-{index + 1}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={downloadPDF}
                disabled={generating}
                className="mt-6 bg-plum text-cream px-10 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-navy transition-all shadow-xl hover:shadow-plum/30 flex items-center gap-2 group"
            >
                {generating ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing...
                    </>
                ) : (
                    <>
                        <span>Download Pass</span>
                        <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </>
                )}
            </button>
        </div>
    );
};

export default DigitalTicket;
