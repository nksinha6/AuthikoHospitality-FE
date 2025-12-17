import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  CheckCircle,
  X,
  Clock,
  User,
  Plus,
  Edit2,
} from "lucide-react";
import { UI_TEXT, ROUTES } from "../constants/ui.js";
import { VERIFICATION_STATUS, GUEST_VERIFICATION } from "../constants/config.js";

// Success Modal Component
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

// Guest Details Modal Component
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

export default function GuestVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const formData = location.state?.formData || {};
  const { adults = 0, minors: totalMinorsLimit = 0, bookingId, primaryGuest } = formData;

  const [guests, setGuests] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Minor Logic State
  const [activeMinorForm, setActiveMinorForm] = useState(null);

  // Initialize guest list
  useEffect(() => {
    if (adults) {
      const initialGuests = Array.from({ length: adults }, (_, index) => {
        if (index === 0 && primaryGuest) {
          return {
            phoneNumber: (primaryGuest.countryCode || GUEST_VERIFICATION.COUNTRY_CODE_NUMERIC) + (primaryGuest.phoneNumber || ""),
            isVerified: false,
            aadhaarStatus: VERIFICATION_STATUS.PENDING,
            faceStatus: VERIFICATION_STATUS.PENDING,
            timestamp: null,
            minors: [],
          };
        }
        return {
          phoneNumber: "",
          isVerified: false,
          aadhaarStatus: VERIFICATION_STATUS.PENDING,
          faceStatus: VERIFICATION_STATUS.PENDING,
          timestamp: null,
          minors: [],
        }
      });
      setGuests(initialGuests);
    }
  }, [adults, primaryGuest]);

  const handlePhoneNumberChange = (index, value) => {
    const updatedGuests = [...guests];
    updatedGuests[index].phoneNumber = value;
    setGuests(updatedGuests);
  };

  const isValidPhoneNumber = (phoneNumber) => {
    return phoneNumber && phoneNumber.length >= 10;
  };

  const handleVerifyGuest = (index) => {
    const updatedGuests = [...guests];
    updatedGuests[index].isVerified = true;
    updatedGuests[index].timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const phone = updatedGuests[index].phoneNumber;
    const phoneWithoutCode = phone.replace(new RegExp(`^${GUEST_VERIFICATION.COUNTRY_CODE_NUMERIC}`), "");

    if (phoneWithoutCode === GUEST_VERIFICATION.TEST_PHONE_NUMBER) {
      updatedGuests[index].aadhaarStatus = VERIFICATION_STATUS.VERIFIED;
      updatedGuests[index].faceStatus = VERIFICATION_STATUS.PROCESSING;
      setGuests(updatedGuests);

      setTimeout(() => {
        setGuests(prev => {
          const newState = [...prev];
          newState[index] = { ...newState[index], faceStatus: VERIFICATION_STATUS.VERIFIED };
          return newState;
        });
      }, GUEST_VERIFICATION.FACE_PROCESSING_DELAY);
    } else {
      updatedGuests[index].aadhaarStatus = VERIFICATION_STATUS.PROCESSING;
      setGuests(updatedGuests);

      setTimeout(() => {
        setGuests(prev => {
          const newState = [...prev];
          newState[index] = { ...newState[index], aadhaarStatus: VERIFICATION_STATUS.VERIFIED, faceStatus: VERIFICATION_STATUS.PROCESSING };
          return newState;
        });

        setTimeout(() => {
          setGuests(prev => {
            const newState = [...prev];
            newState[index] = { ...newState[index], faceStatus: VERIFICATION_STATUS.VERIFIED };
            return newState;
          });
        }, GUEST_VERIFICATION.FACE_PROCESSING_DELAY);
      }, GUEST_VERIFICATION.AADHAAR_PROCESSING_DELAY);
    }
  };

  const handleChangeNumber = (index) => {
    const updatedGuests = [...guests];
    updatedGuests[index].isVerified = false;
    updatedGuests[index].phoneNumber = "";
    updatedGuests[index].aadhaarStatus = VERIFICATION_STATUS.PENDING;
    updatedGuests[index].faceStatus = VERIFICATION_STATUS.PENDING;
    updatedGuests[index].timestamp = null;
    setGuests(updatedGuests);
  };

  const handleConfirmCheckIn = () => {
    setShowSuccessModal(true);
    setModalMessage(UI_TEXT.GUEST_VERIFICATION_SUCCESS_MESSAGE);
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate(ROUTES.DASHBOARD);
    }, GUEST_VERIFICATION.SUCCESS_MODAL_DELAY);
  };

  const handleCancelVerification = () => {
    if (window.confirm(UI_TEXT.GUEST_VERIFICATION_CANCEL_CONFIRM)) {
      navigate(-1);
    }
  };

  // Minor Logic
  const openAddMinorForm = (guestIndex) => {
    setActiveMinorForm({ guestIndex, minorIndex: null, name: "", age: "" });
  };

  const openEditMinorForm = (guestIndex, minorIndex, minor) => {
    setActiveMinorForm({ guestIndex, minorIndex, name: minor.name, age: minor.age });
  };

  const closeMinorForm = () => {
    setActiveMinorForm(null);
  };

  const handleMinorInputChange = (field, value) => {
    setActiveMinorForm(prev => ({ ...prev, [field]: value }));
  };

  const saveMinor = () => {
    if (!activeMinorForm.name || !activeMinorForm.age) {
      alert("Please enter both name and age.");
      return;
    }

    setGuests(prev => {
      const newState = [...prev];
      const gIndex = activeMinorForm.guestIndex;

      if (activeMinorForm.minorIndex !== null) {
        const newMinors = [...newState[gIndex].minors];
        newMinors[activeMinorForm.minorIndex] = { name: activeMinorForm.name, age: activeMinorForm.age };
        newState[gIndex] = { ...newState[gIndex], minors: newMinors };
      } else {
        newState[gIndex] = {
          ...newState[gIndex],
          minors: [...newState[gIndex].minors, { name: activeMinorForm.name, age: activeMinorForm.age }]
        };
      }
      return newState;
    });
    closeMinorForm();
  };

  const removeMinor = (guestIndex, minorIndex) => {
    setGuests(prev => {
      const newState = [...prev];
      const newMinors = [...newState[guestIndex].minors];
      newMinors.splice(minorIndex, 1);
      newState[guestIndex] = { ...newState[guestIndex], minors: newMinors };
      return newState;
    });
  };

  const totalAddedMinors = guests.reduce((sum, g) => sum + g.minors.length, 0);
  const limitReached = totalAddedMinors >= totalMinorsLimit;

  const allGuestsFullyVerified =
    guests.length > 0 &&
    guests.every(
      (g) =>
        g.isVerified &&
        g.aadhaarStatus === VERIFICATION_STATUS.VERIFIED &&
        g.faceStatus === VERIFICATION_STATUS.VERIFIED
    );

  const hasAnyVerified = guests.some(
    (g) => g.aadhaarStatus === VERIFICATION_STATUS.VERIFIED && g.faceStatus === VERIFICATION_STATUS.VERIFIED
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">

      {/* Main Content Area - Centered */}
      <div className="w-full max-w-7xl">
        <div className="rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Header Section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-[#1b3631]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {UI_TEXT.GUEST_VERIFICATION_TITLE}
                </h2>
                <p className="text-sm text-white">
                  {UI_TEXT.GUEST_VERIFICATION_BOOKING_ID}: <span className="font-semibold text-white">{bookingId || "VXXXXXX"}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm bg-blue-50 text-[#1b3631] px-3 py-1.5 rounded-full font-medium">
                <User size={16} />
                <span>{adults} {UI_TEXT.TABLE_ADULTS}, {totalMinorsLimit} {UI_TEXT.TABLE_MINORS}</span>
              </div>
            </div>
          </div>

          {/* Guest Verification Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 w-16">{UI_TEXT.GUEST_VERIFICATION_SR_NO}</th>
                  <th className="px-8 py-4 w-100">{UI_TEXT.GUEST_VERIFICATION_GUEST_INFO}</th>
                  {guests.some((g) => g.isVerified) && (
                    <>
                      <th className="px-8 py-4">{UI_TEXT.GUEST_VERIFICATION_ID_STATUS}</th>
                      <th className="px-8 py-4">{UI_TEXT.GUEST_VERIFICATION_FACE_ID}</th>
                      <th className="px-8 py-4">{UI_TEXT.GUEST_VERIFICATION_TIMESTAMP}</th>
                    </>
                  )}
                  {hasAnyVerified && (
                    <th className="px-8 py-4 w-32">{UI_TEXT.GUEST_VERIFICATION_ACTION}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map((guest, index) => (
                  <tr
                    key={index}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                    valign="top"
                  >
                    <td className="px-8 py-6 font-semibold text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    <td className="px-8 py-6 space-y-4">
                      {!guest.isVerified ? (
                        <div className="flex items-center gap-3 relative">
                          <div className="flex-1">
                            <PhoneInput
                              country={GUEST_VERIFICATION.DEFAULT_COUNTRY_CODE}
                              value={guest.phoneNumber}
                              onChange={(value) =>
                                handlePhoneNumberChange(index, value)
                              }
                              placeholder={UI_TEXT.GUEST_VERIFICATION_PHONE_PLACEHOLDER}
                              enableSearch={true}
                              countryCodeEditable={false}
                            />
                          </div>
                          <button
                            onClick={() => handleVerifyGuest(index)}
                            disabled={
                              !isValidPhoneNumber(guest.phoneNumber)
                            }
                            className="px-5 py-2.5 bg-[#1b3631] text-white rounded-lg hover:bg-[#144032] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap shadow-sm hover:shadow-md"
                          >
                            {UI_TEXT.GUEST_VERIFICATION_VERIFY_BUTTON}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <PhoneInput
                              country={GUEST_VERIFICATION.DEFAULT_COUNTRY_CODE}
                              value={guest.phoneNumber}
                              disabled
                            />
                          </div>
                          {guest.aadhaarStatus !== "verified" && (
                            <button
                              onClick={() => handleChangeNumber(index)}
                              className="text-[#1b3631] hover:text-[#144032] text-sm font-medium underline-offset-2 hover:underline"
                            >
                              {UI_TEXT.GUEST_VERIFICATION_CHANGE_BUTTON}
                            </button>
                          )}
                        </div>
                      )}

                      {guest.minors.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {guest.minors.map((minor, mIdx) => (
                            <div key={mIdx} className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 group/minor">
                              <div className="bg-blue-100 p-1 rounded-full">
                                <User size={12} className="text-[#1b3631]" />
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="font-semibold text-xs">{minor.name}</span>
                                <span className="text-[10px] opacity-70">{minor.age} yrs</span>
                              </div>

                              {!guest.isVerified && (
                                <div className="flex gap-1 ml-2 border-l border-blue-200 pl-2">
                                  <button
                                    onClick={() => openEditMinorForm(index, mIdx, minor)}
                                    className="p-1 hover:bg-blue-100 rounded text-blue-500"
                                    title="Edit"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => removeMinor(index, mIdx)}
                                    className="p-1 hover:bg-red-100 rounded text-blue-400 hover:text-red-500"
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {(() => {
                        if (activeMinorForm && activeMinorForm.guestIndex === index) {
                          return (
                            <div className="flex items-center gap-2 mt-2 bg-white p-2 rounded-xl border border-blue-100 shadow-lg shadow-blue-50/50 animate-in fade-in zoom-in-95 duration-200 max-w-md ring-1 ring-[#1b3631]/20">
                              <div className="relative flex-1">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder={UI_TEXT.GUEST_VERIFICATION_CHILD_NAME_PLACEHOLDER}
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-[#1b3631]/20 text-gray-900 placeholder:text-gray-400"
                                  value={activeMinorForm.name}
                                  onChange={(e) => handleMinorInputChange("name", e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  placeholder={UI_TEXT.GUEST_VERIFICATION_AGE_PLACEHOLDER}
                                  className="w-full px-3 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-[#1b3631]/20 text-gray-900 text-center"
                                  value={activeMinorForm.age}
                                  onChange={(e) => handleMinorInputChange("age", e.target.value)}
                                />
                              </div>
                              <button
                                onClick={saveMinor}
                                className="p-2 bg-[#1b3631] text-white rounded-lg hover:bg-[#144032] transition-colors shadow-sm"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={closeMinorForm}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        }

                        if (!limitReached) {
                          return (
                            <button
                              onClick={() => openAddMinorForm(index)}
                              className="text-sm text-[#1b3631] hover:text-[#144032] font-medium flex items-center gap-2 mt-2 px-1 py-1 rounded hover:bg-blue-50/50 transition-colors w-fit"
                            >
                              <div className="bg-blue-100 text-[#1b3631] rounded-full p-0.5">
                                <Plus size={12} />
                              </div>
                              {UI_TEXT.GUEST_VERIFICATION_ADD_MINOR}
                            </button>
                          );
                        }

                        return null;
                      })()}
                    </td>

                    {guest.isVerified && (
                      <>
                        <td className="px-8 py-6" valign="top">
                          {guest.aadhaarStatus === VERIFICATION_STATUS.PROCESSING ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
                                <Clock className="w-4 h-4 animate-spin-slow" />
                                <span className="text-sm font-medium">{UI_TEXT.GUEST_VERIFICATION_PROCESSING}</span>
                              </div>
                              <button className="text-[#1b3631] hover:text-[#144032] text-xs font-medium pl-1">
                                {UI_TEXT.GUEST_VERIFICATION_RESEND_LINK}
                              </button>
                            </div>
                          ) : guest.aadhaarStatus === VERIFICATION_STATUS.VERIFIED ? (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-fit border border-green-100">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {UI_TEXT.GUEST_VERIFICATION_VERIFIED}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        <td className="px-8 py-6" valign="top">
                          {guest.faceStatus === VERIFICATION_STATUS.PROCESSING ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
                                <Clock className="w-4 h-4 animate-spin-slow" />
                                <span className="text-sm font-medium">{UI_TEXT.GUEST_VERIFICATION_PROCESSING}</span>
                              </div>
                            </div>
                          ) : guest.faceStatus === VERIFICATION_STATUS.VERIFIED ? (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-fit border border-green-100">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {UI_TEXT.GUEST_VERIFICATION_VERIFIED}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        <td className="px-8 py-6 text-gray-500" valign="top">
                          {guest.timestamp || "-"}
                        </td>

                        {hasAnyVerified && (
                          <td className="px-8 py-6" valign="top">
                            {guest.aadhaarStatus === "verified" &&
                              guest.faceStatus === "verified" ? (
                              <button
                                onClick={() => {
                                  setSelectedGuest(guest);
                                  setShowGuestModal(true);
                                }}
                                className="text-[#1b3631] hover:text-[#144032] text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                {UI_TEXT.GUEST_VERIFICATION_VIEW_DETAILS}
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex gap-4 justify-end">
            <button
              onClick={handleCancelVerification}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              {UI_TEXT.GUEST_VERIFICATION_CANCEL}
            </button>
            <button
              onClick={handleConfirmCheckIn}
              disabled={!allGuestsFullyVerified}
              className={`px-8 py-2.5 text-white font-medium rounded-lg shadow-sm transition-all
                  ${allGuestsFullyVerified
                  ? "bg-[#1b3631] hover:bg-[#144032] hover:shadow-lg hover:shadow-[#1b3631]/20 transform hover:-translate-y-0.5"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
                }`}
            >
              {UI_TEXT.GUEST_VERIFICATION_CONFIRM_CHECKIN}
            </button>
          </div>

        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        handleClose={() => setShowSuccessModal(false)}
        message={modalMessage}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal
        show={showGuestModal}
        handleClose={() => setShowGuestModal(false)}
        guest={selectedGuest}
      />
    </div>
  );
}