import React from "react";
import { X } from "lucide-react";
import { CheckCircle, Circle, Download, FileText } from "lucide-react";
import { UI_TEXT } from "../constants/ui.js";

const GuestDetailsModal = ({ show, handleClose, guest }) => {
    if (!show || !guest) return null;

    // Determine verification status display
    const getVerificationStatus = (status) => {
        switch (status) {
            case "VERIFIED":
                return { text: "Verified", className: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> };
            case "MATCH":
                return { text: "Match", className: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> };
            case "NOT_APPLICABLE":
                return { text: "Not Applicable", className: "text-gray-500", icon: <Circle className="w-4 h-4" /> };
            case "NOT_REQUIRED":
                return { text: "Not Required", className: "text-gray-500", icon: <Circle className="w-4 h-4" /> };
            default:
                return { text: status, className: "text-gray-700", icon: null };
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#1e40af] px-6 py-4 text-white flex items-center justify-between border-b">
                    <div>
                        <h3 className="text-xl font-bold">All Guests</h3>
                        <p className="text-sm text-blue-100 mt-1">Details & Verification Information</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Check-in Information */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Checked in Date & Time</h4>
                        <p className="text-lg font-medium">18 Aug 2025, 11:10 AM</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-sm text-gray-500">Reservation Number</p>
                                <p className="font-medium">RES4001</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Property Name</p>
                                <p className="font-medium">Silver Sands</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Property Location</p>
                                <p className="font-medium">Banjara Hills, Hyderabad</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="font-medium">Male</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-medium">15 Jul 1985</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Nationality</p>
                                <p className="font-medium">Indian</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Government ID Type</p>
                                <p className="font-medium">Passport</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Government ID Number</p>
                                <p className="font-medium">N1234567</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">+91-980XX-XXX34</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium break-all">arjun.mehta@gmail.com</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Aadhaar Verification */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Aadhaar Verification</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <div className="flex items-center gap-2">
                                    <Circle className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Not Applicable</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Face ID</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="font-medium">Match</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Manual Verification</p>
                                <div className="flex items-center gap-2">
                                    <Circle className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Not Required</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Verified On</p>
                                <p className="font-medium">18 Aug 2025, 11:25 AM</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Verified By (Hotel Staff ID)</p>
                                <p className="font-medium">HC-User201</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">+91-980XX-XXX34</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Dependents Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Dependents Information</h4>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-gray-500">No dependents available</p>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Checked Out Status */}
                    <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-full">
                            <span className="font-semibold">Checked Out</span>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Export Options */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Export Options</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Excel Export */}
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-50 p-2 rounded">
                                            <FileText className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Export Excel</p>
                                            <p className="text-sm text-gray-500 mt-1">Download as Excel file</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="mt-3">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        View Details →
                                    </button>
                                </div>
                            </div>

                            {/* PDF Export */}
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-50 p-2 rounded">
                                            <FileText className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Export PDF</p>
                                            <p className="text-sm text-gray-500 mt-1">Download as PDF file</p>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="mt-3">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Export Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors">
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">Export Excel</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors">
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">Export PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestDetailsModal;