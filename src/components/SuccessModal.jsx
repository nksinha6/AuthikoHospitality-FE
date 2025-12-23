import React from "react";
import { CheckCircle } from "lucide-react";
import { UI_TEXT } from "../constants/ui.js";

const SuccessModal = ({ show, message }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
                <div className="mb-4 flex justify-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{UI_TEXT.MODAL_SUCCESS_TITLE}</h3>
                <p className="text-gray-500 text-sm">{message || "Operation successful."}</p>
            </div>
        </div>
    );
};

export default SuccessModal;
