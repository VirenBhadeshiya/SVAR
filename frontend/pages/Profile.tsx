import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, LogOut, Loader2, Download, Ticket, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { User as UserType, Booking as BookingType } from '../types';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const Profile: React.FC = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [booking, setBooking] = useState<BookingType | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [passDownloadEnabled, setPassDownloadEnabled] = useState(false);
    const [userIp, setUserIp] = useState('');
    const [isTabVisible, setIsTabVisible] = useState(true);
    const navigate = useNavigate();

    const printPassRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userId = localStorage.getItem('svar_user_id');
            if (userId) {
                const foundUser = await mockDb.getUserById(userId);
                if (foundUser) {
                    setUser(foundUser);
                    const allBookings = await mockDb.getBookings();
                    const foundBooking = allBookings.find(b => b.userId === foundUser.id);
                    setBooking(foundBooking || null);
                }
            }
            setLoading(false);
        };
        fetchUser();

        // --- UPDATED REAL-TIME POLLING LOGIC (USING MOCKDB DIRECTLY) ---
        const checkSettings = async () => {
            try {
                // Seedha Database se check karega bina caching issue ke
                const settingsData = await mockDb.getSettings();
                if (settingsData) {
                    setPassDownloadEnabled(settingsData.passDownloadEnabled === true);
                }

                if (!userIp) {
                    try {
                        const ipRes = await fetch('/api/ip');
                        const ipData = await ipRes.json();
                        setUserIp(ipData.ip);
                    } catch (ipErr) {
                        setUserIp("127.0.0.1"); // Fallback agar IP fetch na ho
                    }
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        };

        checkSettings();
        const interval = setInterval(checkSettings, 2000); // Har 2 second mein super-fast check
        // -------------------------------------------------------------

        // Screenshot Deterrents
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        };
        const handleVisibilityChange = () => {
            setIsTabVisible(!document.hidden);
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userIp]);

    const handleLogout = () => {
        localStorage.removeItem('svar_user_id');
        navigate('/');
    };

    const downloadPDF = async () => {
        if (!user || !booking || !printPassRef.current) return;
        setIsGeneratingPdf(true);

        try {
            const element = printPassRef.current;

            // use html-to-image instead of html2canvas for better React rendering and CORS support
            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: "#ffffff",
                pixelRatio: 2 // Equivalent to scale: 2
            });

            // PDF dimensions calculate karna (A4 size ya custom card size)
            // Use precise dimensions
            const pdfWidth = element.offsetWidth;
            const pdfHeight = element.offsetHeight;
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // File name format
            const fileName = `SVAR_Pass_${user.fullName.split(' ')[0]}_${booking.id.split('-').pop()}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('PDF Generation Error:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            alert(`Pass download karne mein samasya aayi. Kripya screenshot le lein.\nError details: ${errorMsg}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-viren-50">
                <Loader2 className="animate-spin text-viren-950" size={48} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-viren-50 p-4 text-center">
                <AlertTriangle className="text-red-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-viren-950">User Not Found</h2>
                <p className="text-viren-600 mb-8">Please login again to view your pass.</p>
                <button onClick={() => navigate('/login')} className="btn-viren-filled">Go to Login</button>
            </div>
        );
    }

    // Construct QR Data
    const qrData = booking ? {
        passId: booking.id,
        uid: user.id,
        name: user.fullName,
        phone: user.phone,
        aadhaar: user.aadhaar,
        type: booking.ticketType,
        status: booking.status,
        verified: user.verified,
        amount: booking.totalAmount,
        timestamp: booking.timestamp
    } : null;

    return (
        <div className="min-h-screen bg-viren-50 py-8 px-2 md:px-4">
            <div className="max-w-xl mx-auto">
                {/* Action Bar */}
                <div className="flex justify-between items-center mb-6 px-2">
                    <button onClick={() => navigate('/')} className="text-viren-600 hover:text-viren-950 font-bold text-sm">
                        &larr; Back to Home
                    </button>
                    <div className="flex items-center gap-4">
                        <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800 font-bold text-sm">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>

                {/* Security Notice on Pass Page */}
                <div className="mb-6 bg-[#731515] text-[#FFFFFF] p-3 rounded-lg border-l-4 border-white shadow-md animate-fade-in mx-2">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-white shrink-0" size={20} />
                        <p className="text-[10px] text-white leading-tight">
                            Aadhar card and real face match thase tyare j entry malse. Please carry your original Aadhaar card.
                            <br />
                            આધાર કાર્ડ અને અસલી ચહેરો મેચ થશે ત્યારે જ એન્ટ્રી મળશે. મહેરબાની કરીને અસલી આધાર કાર્ડ સાથે રાખવું.
                        </p>
                    </div>
                </div>

                <div className="flex justify-center w-full">
                    <div
                        ref={printPassRef}
                        className={`w-full max-w-[380px] min-w-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-viren-200 relative flex flex-col mx-auto transition-all duration-500 ${!isTabVisible ? 'blur-3xl grayscale' : ''}`}
                        style={{ transform: 'translateZ(0)', minHeight: '650px' }}
                    >
                        {/* DYNAMIC WATERMARK OVERLAY */}
                        <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden opacity-[0.03] select-none">
                            <div className="absolute top-0 left-0 w-[200%] h-[200%] flex flex-wrap content-start justify-start gap-12 rotate-[-25deg] -translate-x-1/4 -translate-y-1/4">
                                {Array.from({ length: 40 }).map((_, i) => (
                                    <div key={i} className="text-[10px] font-bold whitespace-nowrap uppercase tracking-widest text-viren-950">
                                        {user.fullName} • {userIp} • {new Date().toLocaleString()}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 1. HEADER SECTION */}
                        <div className="bg-viren-950 p-6 h-36 flex flex-col items-center justify-start relative overflow-hidden">
                            {/* Removed external texture background to prevent CORS PDF generation crashes */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-viren-red/30 rounded-full blur-3xl"></div>
                            <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>

                            <div className="relative z-10 w-32 h-auto text-white mt-1">
                                <Logo className="w-full h-full" variant="filled" />
                            </div>
                            <p className="text-viren-200 text-[10px] uppercase tracking-[0.3em] font-medium mt-2 relative z-10">Official Entry Pass</p>
                        </div>

                        {/* 2. PROFILE SECTION */}
                        <div className="relative z-20 -mt-12 flex flex-col items-center">
                            <div className="p-1.5 bg-white rounded-full shadow-lg">
                                <div className="w-32 h-32 rounded-full border-4 border-viren-50 overflow-hidden bg-gray-200">
                                    <img
                                        src={user.profilePhotoUrl || user.selfieUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            </div>

                            <div className="text-center px-6 mt-3">
                                <h2 className="text-2xl font-bold text-viren-950 uppercase font-serif tracking-wide leading-tight line-clamp-2">
                                    {user.fullName}
                                </h2>
                                {booking ? (
                                    <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
                                        <span className="px-3 py-1 bg-viren-50 border border-viren-200 rounded-full text-xs font-bold text-viren-800 tracking-wider">
                                            {booking.ticketType} PASS
                                        </span>
                                        {booking.status === 'CONFIRMED' ? (
                                            <span className="px-3 py-1 bg-green-100 border border-green-200 rounded-full text-[10px] font-bold text-green-700 flex items-center gap-1">
                                                <CheckCircle size={12} /> VERIFIED
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-yellow-100 border border-yellow-200 rounded-full text-[10px] font-bold text-yellow-700 flex items-center gap-1">
                                                <Clock size={12} /> PENDING
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-red-500 font-bold text-xs">No Booking</div>
                                )}
                            </div>
                        </div>

                        {/* 3. DETAILS CARD */}
                        {booking ? (
                            <div className="px-6 py-4 space-y-4">
                                <div className="bg-viren-50 rounded-xl border border-viren-200 p-4 text-center">
                                    <p className="text-[10px] uppercase text-viren-500 font-bold tracking-widest mb-1">Booking Reference</p>
                                    <p className="text-3xl font-mono font-bold text-viren-950 tracking-wider">
                                        {booking.id.split('-').pop()}
                                    </p>
                                    <p className="text-[10px] text-viren-400 font-mono mt-1">{booking.id}</p>
                                </div>

                                <div className="space-y-3 px-2">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-viren-red"><Calendar size={18} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-viren-950 uppercase">Oct 15 - Oct 24, 2026</p>
                                            <p className="text-[10px] text-viren-500">6:00 PM Onwards • 9 Days</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-viren-red"><MapPin size={18} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-viren-950 uppercase">PD Malaviya College Ground</p>
                                            <p className="text-[10px] text-viren-500">Gondal Road, Rajkot</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400">
                                Book a pass to see details
                            </div>
                        )}

                        {/* 4. DIVIDER */}
                        <div className="relative h-8 flex items-center w-full overflow-hidden">
                            <div className="w-5 h-8 bg-viren-50 rounded-r-full absolute -left-1 border-y border-r border-viren-200 shadow-inner"></div>
                            <div className="w-full border-t-2 border-dashed border-viren-300 mx-4"></div>
                            <div className="w-5 h-8 bg-viren-50 rounded-l-full absolute -right-1 border-y border-l border-viren-200 shadow-inner"></div>
                        </div>

                        {/* 5. QR CODE SECTION */}
                        {booking && qrData && (
                            <div className="bg-white px-6 pb-8 pt-2 flex flex-col items-center justify-center">
                                <div className="relative p-2 bg-white border-2 border-viren-950 rounded-2xl shadow-sm">
                                    <QRCodeSVG
                                        value={JSON.stringify(qrData)}
                                        size={180}
                                        level="L"
                                        fgColor="#20324C"
                                        bgColor="#FFFFFF"
                                    />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center border border-viren-100 shadow-sm p-1">
                                        <div className="w-full h-auto text-viren-950 flex items-center justify-center">
                                            <Logo variant="filled" className="w-full" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-xs font-bold text-viren-950 uppercase tracking-wide">Scan at Gate 1</p>
                                    <p className="text-[10px] text-viren-500 mt-1 uppercase">Valid Govt ID Required for Entry</p>
                                </div>
                            </div>
                        )}

                        <div className="h-2 bg-gradient-to-r from-viren-950 via-viren-900 to-viren-800 w-full"></div>
                    </div>
                </div>

                {/* Action Buttons with Animation */}
                <div className="flex justify-center w-full mt-8">
                    <div className="w-full max-w-[380px] flex flex-col gap-3">
                        {booking ? (
                            <AnimatePresence mode="wait">
                                {passDownloadEnabled ? (
                                    <motion.div
                                        key="download-btn"
                                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <button
                                            onClick={downloadPDF}
                                            disabled={isGeneratingPdf}
                                            className="w-full py-4 bg-viren-950 text-white shadow-2xl flex items-center justify-center gap-2 rounded-xl border border-viren-800 hover:bg-black hover:scale-[1.02] transition-all font-bold text-lg"
                                        >
                                            {isGeneratingPdf ? <Loader2 className="animate-spin" size={24} /> : <Download className="animate-bounce" size={24} />}
                                            Download Official Pass
                                        </button>
                                        <p className="text-center text-[10px] text-viren-500 uppercase tracking-wide mt-2">
                                            Save to gallery • Do not share QR code
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="waiting-msg"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-orange-50 border border-orange-200 p-5 rounded-xl text-center shadow-inner"
                                    >
                                        <div className="flex justify-center mb-2">
                                            <Clock className="text-orange-500 animate-pulse" size={24} />
                                        </div>
                                        <p className="text-orange-800 font-bold text-sm">Waiting for Admin to enable downloads.</p>
                                        <p className="text-[10px] text-orange-600 mt-1 uppercase tracking-wide">Please show this digital pass at the entry gate for now.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ) : (
                            <button onClick={() => navigate('/booking')} className="btn-viren-filled w-full py-4 shadow-xl flex items-center justify-center gap-2">
                                <Ticket size={20} /> Book a Pass Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;