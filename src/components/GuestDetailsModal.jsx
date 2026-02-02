// components/GuestDetailsModal.jsx

import React, { useState, useEffect } from "react";
import { X, User, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { guestDetailsService } from "../services/guestDetailsService";

const GuestDetailsModal = ({ show, handleClose, guest }) => {
  const [guestImage, setGuestImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch guest image when modal opens
  useEffect(() => {
    const fetchImage = async () => {
      if (!show || !guest) return;

      setGuestImage(null);
      setIsLoadingImage(true);
      setImageError(false);

      try {
        // Check if image is in guest data directly
        if (guest.image) {
          // Convert base64 to data URL if needed
          if (guest.image.startsWith("data:")) {
            setGuestImage(guest.image);
          } else {
            setGuestImage(`data:image/jpeg;base64,${guest.image}`);
          }
        } else {
          // Fallback to API
          let phoneNumber = guest.phoneNumber || guest.phone || "";
          let countryCode = guest.phoneCountryCode || "91";

          if (phoneNumber && phoneNumber.length > 10) {
            countryCode = phoneNumber.substring(0, phoneNumber.length - 10);
            phoneNumber = phoneNumber.slice(-10);
          }

          if (phoneNumber) {
            const imageData =
              await guestDetailsService.fetchGuestImageWithRetry(
                countryCode,
                phoneNumber,
              );

            if (imageData) {
              setGuestImage(imageData);
            } else {
              setImageError(true);
            }
          } else {
            setImageError(true);
          }
        }
      } catch (error) {
        console.error("Error fetching guest image:", error);
        setImageError(true);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchImage();
  }, [show, guest]);

  if (!show || !guest) return null;

  // Utility function to mask Aadhaar number
  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return "XXXX-XXXX-XXXX";
    if (aadhaar.toLowerCase().includes("x")) {
      const cleanAadhaar = aadhaar.replace(/[^0-9x]/gi, "");
      if (cleanAadhaar.length >= 12) {
        return `${cleanAadhaar.slice(0, 4)}-${cleanAadhaar.slice(4, 8)}-${cleanAadhaar.slice(8, 12)}`;
      }
      return aadhaar;
    }
    if (aadhaar.length === 12) {
      const lastFour = aadhaar.slice(-4);
      return `XXXX-XXXX-${lastFour}`;
    }
    return "XXXX-XXXX-XXXX";
  };

  // Utility function to mask phone number
  const maskPhone = (phone) => {
    if (!phone || phone.length < 10) return phone || "N/A";
    const last4 = phone.slice(-4);
    const first3 = phone.slice(0, 3);
    return `${first3}XXXXX${last4}`;
  };

  // Get status badge color
  const getStatusBadgeStyle = (status) => {
    const styles = {
      Verified: "bg-green-100 text-green-700",
      Pending: "bg-yellow-100 text-yellow-700",
      Failed: "bg-red-100 text-red-700",
      Processing: "bg-blue-100 text-blue-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format datetime for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return dateTimeString;
    }
  };

  // Guest data with proper fallbacks
  const guestData = {
    fullName:
      guest.fullName ||
      (guest.firstName && guest.lastName
        ? `${guest.firstName} ${guest.lastName}`
        : "N/A"),
    firstName: guest.firstName || "N/A",
    lastName: guest.lastName || "N/A",
    dateOfBirth: formatDate(guest.dateOfBirth) || "N/A",
    gender: guest.gender || "N/A",
    nationality: guest.nationality || "Indian",
    aadhaarNumber: guest.aadhaarNumber || guest.uid || "",
    aadhaarVerificationTimestamp:
      formatDateTime(guest.aadhaarVerificationTimestamp) ||
      formatDateTime(guest.checkInDateTime) ||
      "N/A",
    digiLockerReferenceId:
      guest.digiLockerReferenceId || guest.referenceId || "N/A",
    verificationStatus: guest.verificationStatus || "Pending",
    mobileNumber: guest.phone || guest.phoneNumber || "N/A",
    phoneCountryCode: guest.phoneCountryCode || "91",
    emailId: guest.email || "N/A",
    addressFromAadhaar: guest.address || "N/A",
    city: guest.city || "N/A",
    state: guest.state || "N/A",
    pinCode: guest.pinCode || "N/A",
    bookingId: guest.bookingId || "N/A",
    bookingSource: guest.bookingSource || "N/A",
    checkInDateTime:
      formatDateTime(guest.checkInDateTime) ||
      `${guest.date || ""} ${guest.time || ""}`.trim() ||
      "N/A",
    propertyName: guest.propertyName || "-",
    correspondingPoliceStation: guest.policeStation || "-",
    deskId: guest.deskId || "-",
    receptionUserId: guest.receptionUserId || "-",
    lastUpdatedTimestamp: formatDateTime(guest.lastUpdatedTimestamp) || "-",
    verificationId: guest.verificationId || "-",
  };

  // Clean PDF Download Function - Matching the image layout
  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      let yPos = margin;

      // ==================== HEADER ====================
      doc.setFillColor(27, 54, 49);
      doc.rect(0, 0, pageWidth, 25, "F");

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Guest Details Report", margin, 14);

      doc.setFontSize(9);
      doc.setTextColor(200, 220, 210);
      doc.text(`Booking ID: ${guestData.bookingId}`, margin, 21);

      yPos = 32;

      // ==================== SECTION A: GUEST IDENTITY DETAILS ====================
      // Section Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 54, 49);
      doc.text("A. Guest Identity Details", margin, yPos);
      yPos += 8;

      // Guest Image
      if (guestImage) {
        try {
          doc.addImage(guestImage, "JPEG", margin, yPos, 30, 38);
        } catch (e) {
          console.error("Error adding image:", e);
        }
      }

      // Guest Info Column 1 (next to image if present)
      const infoCol1X = guestImage ? margin + 35 : margin;

      // Full Name
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Full Name", infoCol1X, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.fullName, infoCol1X, yPos + 5);

      // Gender
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Gender", infoCol1X, yPos + 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.gender, infoCol1X, yPos + 17);

      // Nationality
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Nationality", infoCol1X, yPos + 24);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.nationality, infoCol1X, yPos + 29);

      // Guest Info Column 2 (right side)
      const infoCol2X = pageWidth / 2 + 10;

      // Date of Birth
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Date of Birth", infoCol2X, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.dateOfBirth, infoCol2X, yPos + 5);

      // Verification Status
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Verification Status", infoCol2X, yPos + 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.verificationStatus, infoCol2X, yPos + 17);

      yPos += 45;

      // Horizontal line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Aadhaar and Verification details
      // Masked Aadhaar Number
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Masked Aadhaar Number", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(maskAadhaar(guestData.aadhaarNumber), margin, yPos + 5);

      // Verification Timestamp
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Verification Timestamp", pageWidth / 2 + 10, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        guestData.aadhaarVerificationTimestamp,
        pageWidth / 2 + 10,
        yPos + 5,
      );

      yPos += 15;

      // DigiLocker Ref ID
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("DigiLocker Ref ID", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.digiLockerReferenceId, margin, yPos + 5);

      yPos += 15;

      // ==================== SECTION B: CONTACT INFORMATION ====================
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 54, 49);
      doc.text("B. Contact Information", margin, yPos);
      yPos += 8;

      // Mobile Number
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Mobile Number", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(maskPhone(guestData.mobileNumber), margin, yPos + 5);

      // Email ID
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Email ID", pageWidth / 2 + 10, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const email =
        guestData.emailId.length > 25
          ? guestData.emailId.substring(0, 25) + "..."
          : guestData.emailId;
      doc.text(email, pageWidth / 2 + 10, yPos + 5);

      yPos += 15;

      // PIN Code
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("PIN Code", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.pinCode, margin, yPos + 5);

      yPos += 15;

      // Address (From Aadhaar)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Address (From Aadhaar)", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      // Split address into lines if too long
      const addressLines = doc.splitTextToSize(
        guestData.addressFromAadhaar,
        contentWidth - 10,
      );
      doc.text(addressLines, margin, yPos + 5);
      yPos += 5 + addressLines.length * 5;

      // City and State
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("City", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.city, margin, yPos + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("State", pageWidth / 2 + 10, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.state, pageWidth / 2 + 10, yPos + 5);

      yPos += 15;

      // ==================== SECTION C: BOOKING & STAY DETAILS ====================
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 54, 49);
      doc.text("C. Booking & Stay Details", margin, yPos);
      yPos += 8;

      // Booking ID
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Booking ID", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.bookingId, margin, yPos + 5);

      // Booking Source
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Booking Source", pageWidth / 2 + 10, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.bookingSource, pageWidth / 2 + 10, yPos + 5);

      yPos += 15;

      // Check-in Date & Time
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Check-in Date & Time", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.checkInDateTime, margin, yPos + 5);

      yPos += 15;

      // ==================== SECTION D: METADATA ====================
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 54, 49);
      doc.text("D. Metadata", margin, yPos);
      yPos += 8;

      // Property Name
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Property Name", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.propertyName, margin, yPos + 5);

      // Police Station
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Police Station", pageWidth / 2 + 10, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        guestData.correspondingPoliceStation,
        pageWidth / 2 + 10,
        yPos + 5,
      );

      yPos += 15;

      // Desk ID
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Desk ID", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.deskId, margin, yPos + 5);

      // Reception User ID
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Reception User ID", pageWidth / 2 + 10, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(guestData.receptionUserId, pageWidth / 2 + 10, yPos + 5);

      yPos += 15;

      // Verification ID
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Verification ID", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const verificationId =
        guestData.verificationId.length > 30
          ? guestData.verificationId.substring(0, 30) + "..."
          : guestData.verificationId;
      doc.text(verificationId, margin, yPos + 5);

      // ==================== FOOTER ====================
      yPos = pageHeight - 15;

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");

      // Generated timestamp
      doc.text(
        `Generated: ${new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        margin,
        yPos,
      );

      // Page number
      doc.text("Page 1 of 1", pageWidth - margin, yPos, { align: "right" });

      // ==================== SAVE PDF ====================
      const fileName = `Guest_Details_${guestData.bookingId}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1b3631] px-6 py-4 text-white flex items-center justify-between border-b">
          <div>
            <h3 className="text-xl font-bold">Guest Details</h3>
            <p className="text-sm text-green-100 mt-1">
              Booking ID: {guestData.bookingId}
            </p>
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
          {/* Verification Status Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(
                guestData.verificationStatus,
              )}`}
            >
              {guestData.verificationStatus}
            </span>
          </div>
          {/* A. Guest Identity Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#1b3631] rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-800">
                A. Guest Identity Details
              </h4>
            </div>

            <div className="bg-gray-50 rounded-lg p-5">
              <div className="flex gap-6">
                {/* Guest Image */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-40 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {isLoadingImage ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                        <p className="text-xs text-gray-400 mt-2">Loading...</p>
                      </div>
                    ) : guestImage ? (
                      <img
                        src={guestImage}
                        alt="Guest"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          console.error("Image failed to load");
                          e.target.style.display = "none";
                          setGuestImage(null);
                          setImageError(true);
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <User className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-400 mt-1">
                          {imageError ? "No Image" : "Guest Photo"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Information */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-800">
                      {guestData.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium text-gray-800">
                      {guestData.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium text-gray-800">
                      {guestData.nationality}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-800">
                      {guestData.dateOfBirth}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Verification Status</p>
                    <p className="font-medium text-gray-800">
                      {guestData.verificationStatus}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Masked Aadhaar Number</p>
                  <p className="font-medium text-gray-800 font-mono">
                    {maskAadhaar(guestData.aadhaarNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Verification Timestamp
                  </p>
                  <p className="font-medium text-gray-800">
                    {guestData.aadhaarVerificationTimestamp}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">DigiLocker Ref ID</p>
                  <p className="font-medium text-gray-800 font-mono">
                    {guestData.digiLockerReferenceId}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          {/* B. Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#1b3631] rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-800">
                B. Contact Information
              </h4>
            </div>

            <div className="bg-gray-50 rounded-lg p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="font-medium text-gray-800">
                    {maskPhone(guestData.mobileNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email ID</p>
                  <p className="font-medium text-gray-800 break-all">
                    {guestData.emailId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PIN Code</p>
                  <p className="font-medium text-gray-800">
                    {guestData.pinCode}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">
                    Address (From Aadhaar)
                  </p>
                  <p className="font-medium text-gray-800">
                    {guestData.addressFromAadhaar}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium text-gray-800">{guestData.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="font-medium text-gray-800">{guestData.state}</p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          {/* C. Booking & Stay Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#1b3631] rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-800">
                C. Booking & Stay Details
              </h4>
            </div>

            <div className="bg-gray-50 rounded-lg p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium text-gray-800 font-mono">
                    {guestData.bookingId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking Source</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {guestData.bookingSource}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Check-in Date & Time</p>
                  <p className="font-medium text-gray-800">
                    {guestData.checkInDateTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          {/* D. Metadata */}
          {/* Teprary Comment Out Section D  */}
          {/* <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#1b3631] rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-800">D. Metadata</h4>
            </div>

            <div className="bg-gray-50 rounded-lg p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Property Name</p>
                  <p className="font-medium text-gray-800">{guestData.propertyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Police Station</p>
                  <p className="font-medium text-gray-800">{guestData.correspondingPoliceStation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Desk ID</p>
                  <p className="font-medium text-gray-800 font-mono">{guestData.deskId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reception User ID</p>
                  <p className="font-medium text-gray-800 font-mono">{guestData.receptionUserId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verification ID</p>
                  <p className="font-medium text-gray-800 font-mono">{guestData.verificationId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-800">{guestData.lastUpdatedTimestamp}</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`px-4 py-2 text-sm font-medium text-white bg-[#1b3631] rounded-lg transition-colors flex items-center gap-2 ${
              isDownloading
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-[#2a4a43]"
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsModal;
