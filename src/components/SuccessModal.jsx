// import React from "react";
// import {
//     CheckCircle,
//     LayoutDashboard,
//     Printer,
//     ExternalLink,
//     Globe
// } from "lucide-react";

// const SuccessModal = ({
//     show,
//     bookingId = "BKG-9901-PRO",
//     totalGuests = "01",
//     bookingSource = "OTA (Online Travel Agent)",
//     onClose
// }) => {
//     if (!show) return null;

//     return (
//         <div className="fixed inset-0 bg-[#0F172A]/40 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
//             <div className="bg-white rounded-4xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

//                 {/* Main Content */}
//                 <div className="p-10 text-center flex flex-col items-center">
//                     {/* Success Icon */}
//                     <div className="mb-6 relative">
//                         <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center border-4 border-white shadow-sm">
//                             <CheckCircle className="w-10 h-10 text-[#10B981]" strokeWidth={2.5} />
//                         </div>
//                     </div>

//                     <h2 className="text-[28px] font-bold text-[#1e293b] mb-3">Verification Successful</h2>

//                     {/* Verification Summary Card */}
//                     <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 mb-8 text-left border border-[#F1F5F9]">
//                         <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-4">Verification Summary</h4>

//                         <div className="space-y-4">
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-[#475569] font-medium">Total Guests Verified</span>
//                                 <span className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#1e293b]">
//                                     {String(totalGuests).padStart(2, '0')} Guests
//                                 </span>
//                             </div>

//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-[#475569] font-medium">Booking Source</span>
//                                 <div className="flex items-center gap-2 text-[#1e293b] font-bold text-xs">
//                                     <Globe size={14} className="text-[#10B981]" />
//                                     {bookingSource}
//                                 </div>
//                             </div>

//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-[#475569] font-medium">Status</span>
//                                 <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] rounded-lg text-[10px] font-bold uppercase tracking-wider">
//                                     COMPLETED
//                                 </span>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Primary Button */}
//                     <button
//                         onClick={onClose}
//                         className="w-full bg-[#1b3631] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#142925] transition-all shadow-lg shadow-[#1b3631]/20 mb-4"
//                     >
//                         <LayoutDashboard size={20} />
//                         Go to Check-In
//                     </button>
//                 </div>

//                 {/* Footer */}
//                 <div className="bg-[#F8FAFC]/50 py-4 px-10 border-t border-[#F1F5F9]">
//                     <p className="text-[10px] text-[#94a3b8] text-center">
//                         Confirmation receipt has been sent to the primary guest's email.
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SuccessModal;

// -- Updated Success Model --

import React from "react";
import {
  Building2,
  Check,
  Home,
  Info,
  Users,
  ArrowRightLeft,
} from "lucide-react";

const SuccessModal = ({
  show,
  bookingId = "BK-882910",
  totalGuests = 3,
  bookingSource = "Direct",
  onClose,
  onViewDetails,
}) => {
  if (!show) return null;

  //   return (
  //     <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
  //       <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
  //         {/* Main Content */}
  //         <div className="p-8 text-center flex flex-col items-center">
  //           {/* Icon Section */}
  //           <div className="relative mb-6">
  //             <div className="w-24 h-24 bg-[#E6F9F3] rounded-full flex items-center justify-center">
  //               <Building2 size={36} className="text-[#10B981]" />
  //             </div>

  //             {/* Small Check Badge */}
  //             <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
  //               <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
  //                 <Check size={16} className="text-white" strokeWidth={3} />
  //               </div>
  //             </div>
  //           </div>

  //           {/* Title */}
  //           <h2 className="text-2xl font-bold text-[#1e293b] mb-3">Thank You!</h2>

  //           {/* Description */}
  //           <p className="text-sm text-[#64748b] mb-8 leading-relaxed">
  //             All guest records for Booking{" "}
  //             <span className="font-semibold text-[#1e293b]">{bookingId}</span>{" "}
  //             have been successfully uploaded to the system.
  //           </p>

  //           {/* Status Card */}
  //           <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 mb-6 border border-[#EEF2F7] text-left shadow-sm">
  //             {/* Header */}
  //             <div className="flex justify-between items-center mb-4">
  //               <span className="text-[11px] font-semibold text-[#94a3b8] tracking-widest uppercase">
  //                 Post-Status
  //               </span>
  //               <span className="text-xs font-semibold px-3 py-1 bg-[#DCFCE7] text-[#15803D] rounded-full">
  //                 COMPLETE
  //               </span>
  //             </div>

  //             {/* Divider */}
  //             <div className="border-t border-[#E2E8F0] mb-4"></div>

  //             {/* Two Columns */}
  //             <div className="grid grid-cols-2 gap-4 text-center">
  //               <div>
  //                 <div className="flex justify-center mb-1 text-[#10B981]">
  //                   <Users size={18} />
  //                 </div>
  //                 <p className="text-sm font-bold text-[#1e293b]">
  //                   {totalGuests} Guests
  //                 </p>
  //                 <p className="text-xs text-[#64748b]">Verified</p>
  //               </div>

  //               <div className="border-l border-[#E2E8F0]">
  //                 <div className="flex justify-center mb-1 text-[#10B981]">
  //                   <ArrowRightLeft size={18} />
  //                 </div>
  //                 <p className="text-sm font-bold text-[#1e293b]">
  //                   {bookingSource}
  //                 </p>
  //                 <p className="text-xs text-[#64748b]">Source</p>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Pagination Dots */}
  //           <div className="flex gap-2 mb-6">
  //             <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
  //             <div className="w-2 h-2 rounded-full bg-[#D1FAE5]"></div>
  //             <div className="w-2 h-2 rounded-full bg-[#D1FAE5]"></div>
  //           </div>

  //           {/* Primary Button */}
  //           <button
  //             onClick={onClose}
  //             className="w-full bg-[#14B8A6] hover:bg-[#0d9488] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
  //           >
  //             <Home size={18} />
  //             Back to Home
  //           </button>

  //           {/* Secondary Button */}
  //           <button
  //             onClick={onViewDetails}
  //             className="w-full mt-4 border border-[#CBD5E1] text-[#334155] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#F1F5F9] transition"
  //           >
  //             <Info size={18} />
  //             View Booking Details
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  //   return (
  //     <div className="h-dvh w-dvw bg-[#F8FAFC] flex items-center justify-center px-6">
  //       <div className="w-full max-w-md bg-white rounded-3xl p-8 flex flex-col items-center">
  //         {/* Icon Section */}
  //         <div className="relative mb-6">
  //           <div className="w-24 h-24 bg-[#E6F9F3] rounded-full flex items-center justify-center">
  //             <Building2 size={36} className="text-[#10B981]" />
  //           </div>

  //           {/* Check Badge */}
  //           <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
  //             <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
  //               <Check size={16} className="text-white" strokeWidth={3} />
  //             </div>
  //           </div>
  //         </div>

  //         {/* Title */}
  //         <h2 className="text-2xl font-bold text-[#1e293b] mb-3">Thank You!</h2>

  //         {/* Description */}
  //         <p className="text-sm text-[#64748b] mb-8 leading-relaxed text-center">
  //           All guest records for Booking{" "}
  //           <span className="font-semibold text-[#1e293b]">{bookingId}</span> have
  //           been successfully uploaded to the system.
  //         </p>

  //         {/* Status Card */}
  //         <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 mb-6 border border-[#EEF2F7] shadow-sm">
  //           <div className="flex justify-between items-center mb-4">
  //             <span className="text-[11px] font-semibold text-[#94a3b8] tracking-widest uppercase">
  //               Post-Status
  //             </span>
  //             <span className="text-xs font-semibold px-3 py-1 bg-[#DCFCE7] text-[#15803D] rounded-full">
  //               COMPLETE
  //             </span>
  //           </div>

  //           <div className="border-t border-[#E2E8F0] mb-4"></div>

  //           <div className="grid grid-cols-2 gap-4 text-center">
  //             <div>
  //               <div className="flex justify-center mb-1 text-[#10B981]">
  //                 <Users size={18} />
  //               </div>
  //               <p className="text-sm font-bold text-[#1e293b]">
  //                 {totalGuests} Guests
  //               </p>
  //               <p className="text-xs text-[#64748b]">Verified</p>
  //             </div>

  //             <div className="border-l border-[#E2E8F0]">
  //               <div className="flex justify-center mb-1 text-[#10B981]">
  //                 <ArrowRightLeft size={18} />
  //               </div>
  //               <p className="text-sm font-bold text-[#1e293b]">
  //                 {bookingSource}
  //               </p>
  //               <p className="text-xs text-[#64748b]">Source</p>
  //             </div>
  //           </div>
  //         </div>

  //         {/* Pagination Dots */}
  //         <div className="flex gap-2 mb-6">
  //           <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
  //           <div className="w-2 h-2 rounded-full bg-[#D1FAE5]"></div>
  //           <div className="w-2 h-2 rounded-full bg-[#D1FAE5]"></div>
  //         </div>

  //         {/* Primary Button */}
  //         <button
  //           onClick={onClose}
  //           className="w-full bg-[#14B8A6] hover:bg-[#0d9488] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
  //         >
  //           <Home size={18} />
  //           Back to Home
  //         </button>

  //         {/* Secondary Button */}
  //         <button
  //           onClick={onViewDetails}
  //           className="w-full mt-4 border border-[#CBD5E1] text-[#334155] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#F1F5F9] transition"
  //         >
  //           <Info size={18} />
  //           View Booking Details
  //         </button>
  //       </div>
  //     </div>
  //   );
  return (
    <div className="h-dvh w-dvw bg-[#F8FAFC] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white rounded-3xl flex flex-col items-center">
        {/* Icon Section */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-[#E6F9F3] rounded-full flex items-center justify-center">
            <Building2 size={36} className="text-[#10B981]" />
          </div>

          <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
            <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
              <Check size={16} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
        {/* Title */}
        <h2 className="text-2xl font-bold text-[#1e293b] mb-3">Thank You!</h2>
        {/* Description */}
        <p className="text-sm text-[#64748b] mb-8 leading-relaxed text-center">
          All guest records for Booking{" "}
          <span className="font-semibold text-[#1e293b]">{bookingId}</span> have
          been successfully uploaded to the system.
        </p>
        {/* Status Card */}
        <div className="w-full bg-[#F8FAFC] rounded-2xl p-6 mb-8 border border-[#EEF2F7] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[11px] font-semibold text-[#94a3b8] tracking-widest uppercase">
              Post-Status
            </span>
            <span className="text-xs font-semibold px-3 py-1 bg-[#DCFCE7] text-[#15803D] rounded-full">
              COMPLETE
            </span>
          </div>

          <div className="border-t border-[#E2E8F0] mb-4"></div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex justify-center mb-1 text-[#10B981]">
                <Users size={18} />
              </div>
              <p className="text-sm font-bold text-[#1e293b]">
                {totalGuests} Guests
              </p>
              <p className="text-xs text-[#64748b]">Verified</p>
            </div>

            <div className="border-l border-[#E2E8F0]">
              <div className="flex justify-center mb-1 text-[#10B981]">
                <ArrowRightLeft size={18} />
              </div>
              <p className="text-sm font-bold text-[#1e293b]">
                {bookingSource}
              </p>
              <p className="text-xs text-[#64748b]">Source</p>
            </div>
          </div>
        </div>
        {/* Primary Button */}
        <button
          onClick={onClose}
          className="w-full h-12 py-3 bg-[#1b3631] hover:bg-[#162b27] text-white text-md rounded-xl font-semibold flex items-center justify-center gap-2 transition"
        >
          <Home size={18} />
          Back to Home
        </button>
        {/* Secondary Button */}
        {/* <button
          onClick={onViewDetails}
          className="w-full h-12 py-3 mt-4 border border-[#1b3631] text-[#1b3631] text-md rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#F1F5F9] transition"
        >
          <Info size={18} />
          View Booking Details
        </button>  */}
      </div>
    </div>
  );
};

export default SuccessModal;
