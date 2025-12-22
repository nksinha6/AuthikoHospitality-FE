import React from "react";
import { X } from "lucide-react";
import { UI_TEXT } from "../constants/ui.js";
import { VERIFICATION_STATUS } from "../constants/config.js";

const GuestDetailsModal = ({ show, handleClose, guest }) => {
    if (!show || !guest) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-[#1b3631] p-6 text-white flex items-center justify-between">
                    <h3 className="text-lg font-bold">{UI_TEXT.MODAL_GUEST_DETAILS_TITLE}</h3>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500">{UI_TEXT.MODAL_PHONE_NUMBER}</span>
                        <span className="font-semibold text-gray-900 text-lg tracking-wide">{guest.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500">{UI_TEXT.MODAL_AADHAAR_STATUS}</span>
                        <span className={`font-semibold capitalize px-2 py-1 rounded-md text-sm ${guest.aadhaarStatus === VERIFICATION_STATUS.VERIFIED ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                            {guest.aadhaarStatus === VERIFICATION_STATUS.VERIFIED ? UI_TEXT.GUEST_VERIFICATION_VERIFIED : guest.aadhaarStatus}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500">{UI_TEXT.MODAL_FACE_STATUS}</span>
                        <span className={`font-semibold capitalize px-2 py-1 rounded-md text-sm ${guest.faceStatus === VERIFICATION_STATUS.VERIFIED ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                            {guest.faceStatus === VERIFICATION_STATUS.VERIFIED ? UI_TEXT.GUEST_VERIFICATION_VERIFIED : guest.faceStatus}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pb-3">
                        <span className="text-sm text-gray-500">Timestamp</span>
                        <span className="font-medium text-gray-900">{guest.timestamp}</span>
                    </div>

                    {/* Minors Section in Modal */}
                    {guest.minors && guest.minors.length > 0 && (
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{UI_TEXT.GUEST_VERIFICATION_ACCOMPANYING_MINORS}</p>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                                {guest.minors.map((m, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-900">{m.name}</span>
                                        <span className="text-gray-500 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{m.age} {UI_TEXT.GUEST_VERIFICATION_YEARS}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestDetailsModal;
