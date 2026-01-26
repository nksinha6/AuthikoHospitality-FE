import React from "react";
import {
    CheckCircle,
    LayoutDashboard,
    Printer,
    ExternalLink,
    Globe
} from "lucide-react";

const SuccessModal = ({
    show,
    bookingId = "BKG-9901-PRO",
    totalGuests = "01",
    bookingSource = "OTA (Online Travel Agent)",
    onClose
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-4xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

                {/* Main Content */}
                <div className="p-10 text-center flex flex-col items-center">
                    {/* Success Icon */}
                    <div className="mb-6 relative">
                        <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <CheckCircle className="w-10 h-10 text-[#10B981]" strokeWidth={2.5} />
                        </div>
                    </div>

                    <h2 className="text-[28px] font-bold text-[#1e293b] mb-3">Verification Successful</h2>

                    {/* Verification Summary Card */}
                    <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 mb-8 text-left border border-[#F1F5F9]">
                        <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-4">Verification Summary</h4>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[#475569] font-medium">Total Guests Verified</span>
                                <span className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#1e293b]">
                                    {String(totalGuests).padStart(2, '0')} Guests
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[#475569] font-medium">Booking Source</span>
                                <div className="flex items-center gap-2 text-[#1e293b] font-bold text-xs">
                                    <Globe size={14} className="text-[#10B981]" />
                                    {bookingSource}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[#475569] font-medium">Status</span>
                                <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                    COMPLETED
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Primary Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-[#1b3631] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#142925] transition-all shadow-lg shadow-[#1b3631]/20 mb-4"
                    >
                        <LayoutDashboard size={20} />
                        Go to Check-In
                    </button>
                </div>

                {/* Footer */}
                <div className="bg-[#F8FAFC]/50 py-4 px-10 border-t border-[#F1F5F9]">
                    <p className="text-[10px] text-[#94a3b8] text-center">
                        Confirmation receipt has been sent to the primary guest's email.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;