import { useLocation, useNavigate } from "react-router-dom";
import { UI_TEXT, ROUTES } from "../constants/ui.js";
import {
  Calendar,
  User,
  Phone,
  Users,
  CheckCircle,
  ArrowLeft,
  Shield,
} from "lucide-react";

export default function GuestVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData;

  const handleConfirmCheckIn = () => {
    alert("Guest check-in successful! Starting verification process...");

    navigate("/guest-phone-entry", {
      state: {
        bookingId: `WALKIN-${Date.now().toString().slice(-6)}`,
        guestName: `${formData.firstName} ${formData.surname}`,
        totalGuests: formData.totalGuests,
        adults: formData.adults,
        minors: formData.minors,
        phoneNumber: formData.phone,
        isWalkIn: true, //true
      },
    });
  };

  const handleBack = () => {
    navigate(ROUTES.CHECK_INS);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="text-center p-8">
            <div className="flex justify-center mb-4">
              <Shield className="text-brand" size={48} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Guest Verification
            </h2>
            <p className="text-gray-600">
              Review and verify guest details before check-in
            </p>
          </div>

          {/* Form Card */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Verification Summary
              </h3>
              <p className="text-gray-600">
                Review all guest information before proceeding
              </p>
            </div>

            {formData ? (
              <div>
                {/* Summary Section */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-500" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Guest Information Summary
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Ready for Verification
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="space-y-4">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Date */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={18} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Date
                          </span>
                        </div>
                        <div className="text-gray-900 font-medium">
                          {formData.date}
                        </div>
                      </div>

                      {/* Lead Guest Name */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={18} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Lead Guest
                          </span>
                        </div>
                        <div className="text-gray-900 font-medium">
                          {formData.firstName} {formData.surname}
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone size={18} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Phone Number
                          </span>
                        </div>
                        <div className="text-gray-900 font-medium">
                          {formData.phone}
                        </div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Adults Count */}
                      <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={18} className="text-blue-500" />
                          <span className="text-sm font-medium text-gray-600">
                            Adults
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {formData.adults}
                          </span>
                          <span className="text-sm text-gray-500">Persons</span>
                        </div>
                      </div>

                      {/* Minors Count */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={18} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            Minors
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {formData.minors}
                          </span>
                          <span className="text-sm text-gray-500">Persons</span>
                        </div>
                      </div>

                      {/* Total Guests */}
                      <div className="bg-brand p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={20} className="text-white" />
                          <span className="text-sm font-medium text-white">
                            Total Guests
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">
                            {formData.totalGuests}
                          </span>
                          <span className="text-sm text-white/80">Persons</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        Important Verification Notes
                      </h5>
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <span className="text-yellow-600">•</span>
                          <span className="text-yellow-700">
                            All adult guests will need to complete Aadhaar
                            verification
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-yellow-600">•</span>
                          <span className="text-yellow-700">
                            Face ID matching will be performed for each adult
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-yellow-600">•</span>
                          <span className="text-yellow-700">
                            Verification links will be sent to provided phone
                            numbers
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-yellow-600">•</span>
                          <span className="text-yellow-700">
                            Minors do not require separate verification
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmCheckIn}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-3 px-6 rounded-lg font-semibold hover:bg-brand/90"
                  >
                    <CheckCircle size={18} />
                    Confirm & Start Verification
                    <span className="text-lg">→</span>
                  </button>
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    <ArrowLeft size={18} />
                    Back to Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  No Guest Data Provided
                </h4>
                <p className="text-gray-600 mb-4">
                  Please go back to create a walk-in booking first.
                </p>
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 mx-auto px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  <ArrowLeft size={18} />
                  Back to Create Walk-in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
