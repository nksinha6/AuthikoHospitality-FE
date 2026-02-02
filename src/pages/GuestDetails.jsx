// pages/GuestDetails.jsx

import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { FiDownload, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { jsPDF } from "jspdf";
import UniversalTable from "../components/UniversalTable.jsx";
import DateFilter from "../components/DateHourFilter.jsx";
import GuestDetailsModal from "../components/GuestDetailsModal.jsx";
import { formatShortDate } from "../utility/bookingUtils.js";
import { exportToPDF, exportToExcel } from "../utility/exportUtils";
import { guestDetailsService } from "../services/guestDetailsService";
import { transformGuestsArray } from "../utility/guestDataTransformer";

/* ---------------- PROPERTY DETAILS ---------------- */
const PROPERTY_DETAILS = {
  propertyName: "Silver Sands Resort & Spa",
  propertyAddress:
    "Plot No. 45, Banjara Hills, Road No. 12, Hyderabad, Telangana - 500034",
  correspondingPoliceStation: "Banjara Hills Police Station, Hyderabad",
};

/* ---------------- UTILITY FUNCTIONS ---------------- */
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

const maskPhone = (phone) => {
  if (!phone || phone.length < 10) return phone || "N/A";
  const last4 = phone.slice(-4);
  const first3 = phone.slice(0, 3);
  return `${first3}XXXXX${last4}`;
};

export default function GuestDetails() {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const GUEST_COLUMNS = [
    { key: "checkInDate", label: "Check-in Date" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Surname" },
    { key: "bookingId", label: "Booking ID" },
    { key: "maskedAadhaar", label: "Aadhaar Number" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "verificationStatus", label: "Verification Status" },
  ];

  const exportData = filteredGuests.map((g) => ({
    ...g,
    checkInDate: formatShortDate(g.date),
    maskedAadhaar: maskAadhaar(g.aadhaarNumber),
  }));

  const [filters, setFilters] = useState({
    name: "",
    bookingId: "",
    city: "",
    state: "",
  });

  /* ---------------- FETCH DATA FROM API ---------------- */
  const fetchGuestDetails = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await guestDetailsService.fetchBookingGuestDetails();
      console.log("API Response:", response);
      const transformedData = transformGuestsArray(response);
      console.log("Transformed Data:", transformedData);
      setGuests(transformedData);
    } catch (err) {
      console.error("Error fetching guest details:", err);
      setError({
        code: err.code || "UNKNOWN",
        message: err.message || "Failed to fetch guest details",
      });
      setGuests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /* ---------------- INITIAL DATA LOAD ---------------- */
  useEffect(() => {
    fetchGuestDetails();
  }, [fetchGuestDetails]);

  /* ---------------- APPLY FILTERS ---------------- */
  const applyAllFilters = useCallback(() => {
    let data = [...guests];

    // Name filter
    if (filters.name) {
      const q = filters.name.toLowerCase();
      data = data.filter(
        (g) =>
          g.firstName?.toLowerCase().includes(q) ||
          g.lastName?.toLowerCase().includes(q) ||
          g.fullName?.toLowerCase().includes(q)
      );
    }

    // Booking ID filter
    if (filters.bookingId) {
      data = data.filter((g) =>
        g.bookingId?.toLowerCase().includes(filters.bookingId.toLowerCase())
      );
    }

    // City filter
    if (filters.city) {
      data = data.filter((g) =>
        g.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // State filter
    if (filters.state) {
      data = data.filter((g) =>
        g.state?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter?.selectedDate) {
      const selected = dayjs(dateFilter.selectedDate).startOf("day");
      data = data.filter((g) => dayjs(g.date).isSame(selected, "day"));
    }

    setFilteredGuests(data);
  }, [guests, filters, dateFilter]);

  useEffect(() => {
    applyAllFilters();
  }, [applyAllFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      bookingId: "",
      city: "",
      state: "",
    });
    setDateFilter(null);
  };

  /* ---------------- ROW SELECTION HANDLERS ---------------- */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredGuests.map((g) => g.bookingId));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (bookingId) => {
    setSelectedRows((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const isAllSelected =
    filteredGuests.length > 0 && selectedRows.length === filteredGuests.length;

  /* ---------------- VERIFICATION STATUS BADGE ---------------- */
  const getStatusBadge = (status) => {
    // Normalize status to handle different cases
    const normalizedStatus = status?.toString().trim() || "Unknown";
    
    const statusStyles = {
      Verified: "bg-green-100 text-green-700 border border-green-200",
      Pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      Failed: "bg-red-100 text-red-700 border border-red-200",
      Processing: "bg-blue-100 text-blue-700 border border-blue-200",
      Unknown: "bg-gray-100 text-gray-700 border border-gray-200",
    };

    // Get the style, fallback to Unknown if status not found
    const style = statusStyles[normalizedStatus] || statusStyles.Unknown;
    const displayStatus = statusStyles[normalizedStatus] ? normalizedStatus : "Unknown";

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}
      >
        {displayStatus}
      </span>
    );
  };

  /* ---------------- FETCH SERVER TIME ---------------- */
  const fetchServerTime = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    } catch (error) {
      console.error("Error fetching server time:", error);
      return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    }
  };

  /* ---------------- DOWNLOAD SELECTED AS PDF ---------------- */
  const handleDownloadSelectedPDF = async () => {
    if (selectedRows.length === 0) return;

    setIsDownloading(true);

    try {
      const serverTime = await fetchServerTime();
      const selectedGuestsData = filteredGuests.filter((g) =>
        selectedRows.includes(g.bookingId)
      );

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const footerHeight = 25;
      const headerHeight = 45;
      const usableHeight = pageHeight - footerHeight;
      const contentWidth = pageWidth - 2 * margin;

      /* ---------------- HELPER FUNCTIONS ---------------- */
      const addText = (text, x, y, options = {}) => {
        const {
          fontSize = 10,
          fontStyle = "normal",
          color = [0, 0, 0],
          align = "left",
        } = options;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);
        doc.setTextColor(...color);
        doc.text(text || "N/A", x, y, { align });
      };

      const drawHorizontalLine = (y) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
      };

      const addMainHeader = (guest, guestIndex, totalGuests) => {
        doc.setFillColor(27, 54, 49);
        doc.rect(0, 0, pageWidth, 40, "F");
        addText("Guest Details Report", margin, 15, {
          fontSize: 18,
          fontStyle: "bold",
          color: [255, 255, 255],
        });
        addText(`Booking ID: ${guest.bookingId}`, margin, 24, {
          fontSize: 11,
          color: [200, 220, 210],
        });
        addText(`Guest ${guestIndex + 1} of ${totalGuests}`, margin, 32, {
          fontSize: 9,
          color: [180, 200, 190],
        });
      };

      const addPropertyBox = (yPos) => {
        doc.setFillColor(240, 253, 244);
        doc.rect(margin, yPos - 3, contentWidth, 30, "F");
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos - 3, contentWidth, 30, "S");
        const col1X = margin + 3;
        addText("Property Information", col1X, yPos + 2, {
          fontSize: 10,
          fontStyle: "bold",
          color: [22, 101, 52],
        });
        addText(`Property: ${PROPERTY_DETAILS.propertyName}`, col1X, yPos + 10, {
          fontSize: 9,
        });
        addText(`Address: ${PROPERTY_DETAILS.propertyAddress}`, col1X, yPos + 17, {
          fontSize: 9,
        });
        addText(
          `Police Station: ${PROPERTY_DETAILS.correspondingPoliceStation}`,
          col1X,
          yPos + 24,
          { fontSize: 9 }
        );
        return yPos + 35;
      };

      const addSectionHeader = (title, y) => {
        doc.setFillColor(27, 54, 49);
        doc.rect(margin, y, 3, 7, "F");
        addText(title, margin + 6, y + 5, { fontSize: 11, fontStyle: "bold" });
        return y + 12;
      };

      const addField = (label, value, x, y) => {
        addText(label, x, y, { fontSize: 9, color: [100, 100, 100] });
        addText(value || "N/A", x, y + 5, { fontSize: 10, fontStyle: "normal" });
        return 14;
      };

      const addFieldRow = (fields, y, col1X, col2X) => {
        fields.forEach((field, index) => {
          const x = index === 0 ? col1X : col2X;
          addField(field.label, field.value, x, y);
        });
        return 14;
      };

      const checkAndAddPage = (currentY, requiredHeight, guest, sectionName) => {
        if (currentY + requiredHeight > usableHeight) {
          doc.addPage();
          doc.setFillColor(27, 54, 49);
          doc.rect(0, 0, pageWidth, 30, "F");
          addText("Guest Details Report (Continued)", margin, 12, {
            fontSize: 14,
            fontStyle: "bold",
            color: [255, 255, 255],
          });
          addText(
            `Booking ID: ${guest.bookingId} | Continuing: ${sectionName}`,
            margin,
            22,
            { fontSize: 10, color: [200, 220, 210] }
          );
          let newY = 38;
          newY = addPropertyBox(newY);
          return newY;
        }
        return currentY;
      };

      const addVerificationStatusBox = (guest, yPos) => {
        const status = guest.verificationStatus || "Unknown";
        
        const statusColor = {
          Verified: [34, 197, 94],
          Pending: [234, 179, 8],
          Failed: [239, 68, 68],
          Processing: [59, 130, 246],
          Unknown: [156, 163, 175],
        };
        const bgColor = {
          Verified: [240, 253, 244],
          Pending: [254, 252, 232],
          Failed: [254, 242, 242],
          Processing: [239, 246, 255],
          Unknown: [249, 250, 251],
        };
        
        doc.setFillColor(...(bgColor[status] || bgColor.Unknown));
        doc.rect(margin, yPos, contentWidth, 15, "F");
        doc.setDrawColor(...(statusColor[status] || statusColor.Unknown));
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos, contentWidth, 15, "S");
        addText("Verification Status:", margin + 5, yPos + 9, {
          fontSize: 10,
          fontStyle: "bold",
        });
        addText(status, margin + 50, yPos + 9, {
          fontSize: 10,
          fontStyle: "bold",
          color: statusColor[status] || statusColor.Unknown,
        });
        return yPos + 20;
      };

      /* ---------------- GENERATE PDF FOR EACH GUEST ---------------- */
      selectedGuestsData.forEach((guest, guestIndex) => {
        if (guestIndex > 0) {
          doc.addPage();
        }
        const col1X = margin + 3;
        const col2X = pageWidth / 2 + 5;
        const fullName = guest.fullName || `${guest.firstName} ${guest.lastName}`;

        addMainHeader(guest, guestIndex, selectedGuestsData.length);
        let yPosition = headerHeight;
        yPosition = addPropertyBox(yPosition);
        yPosition += 5;

        // Section A
        yPosition = checkAndAddPage(yPosition, 70, guest, "Section A");
        yPosition = addSectionHeader("A. Guest Identity Details", yPosition);
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition - 2, contentWidth, 55, "F");

        yPosition += addFieldRow(
          [
            { label: "Full Name (as per credential)", value: fullName },
            { label: "Date of Birth", value: guest.dateOfBirth },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [
            { label: "Gender", value: guest.gender },
            { label: "Nationality", value: guest.nationality },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [
            { label: "Masked Aadhaar Number", value: maskAadhaar(guest.aadhaarNumber) },
            { label: "Verification Timestamp", value: guest.aadhaarVerificationTimestamp },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [{ label: "DigiLocker Reference ID", value: guest.digiLockerReferenceId }],
          yPosition,
          col1X,
          col2X
        );

        yPosition += 8;
        drawHorizontalLine(yPosition);
        yPosition += 10;

        // Section B
        yPosition = checkAndAddPage(yPosition, 75, guest, "Section B");
        yPosition = addSectionHeader("B. Contact Information", yPosition);
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition - 2, contentWidth, 55, "F");

        yPosition += addFieldRow(
          [
            { label: "Mobile Number", value: maskPhone(guest.phone) },
            { label: "Email ID", value: guest.email },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [{ label: "Address (From Aadhaar)", value: guest.address }],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [
            { label: "City", value: guest.city },
            { label: "State", value: guest.state },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [{ label: "PIN Code", value: guest.pinCode }],
          yPosition,
          col1X,
          col2X
        );

        yPosition += 8;
        drawHorizontalLine(yPosition);
        yPosition += 10;

        // Section C
        yPosition = checkAndAddPage(yPosition, 45, guest, "Section C");
        yPosition = addSectionHeader("C. Booking & Stay Details", yPosition);
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition - 2, contentWidth, 30, "F");

        yPosition += addFieldRow(
          [
            { label: "Booking ID", value: guest.bookingId },
            { label: "Booking Source", value: guest.bookingSource },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [{ label: "Check-in Date & Time", value: guest.checkInDateTime }],
          yPosition,
          col1X,
          col2X
        );

        yPosition += 8;
        drawHorizontalLine(yPosition);
        yPosition += 10;

        // Section D
        yPosition = checkAndAddPage(yPosition, 60, guest, "Section D");
        yPosition = addSectionHeader("D. Metadata", yPosition);
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPosition - 2, contentWidth, 42, "F");

        yPosition += addFieldRow(
          [
            { label: "Property Name", value: PROPERTY_DETAILS.propertyName },
            { label: "Police Station", value: PROPERTY_DETAILS.correspondingPoliceStation },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [
            { label: "Desk ID", value: guest.deskId },
            { label: "Reception User ID", value: guest.receptionUserId },
          ],
          yPosition,
          col1X,
          col2X
        );
        yPosition += addFieldRow(
          [{ label: "Last Updated Timestamp", value: guest.lastUpdatedTimestamp }],
          yPosition,
          col1X,
          col2X
        );

        yPosition += 10;
        yPosition = checkAndAddPage(yPosition, 25, guest, "Verification Status");
        yPosition = addVerificationStatusBox(guest, yPosition);
      });

      // Add footer to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(249, 250, 251);
        doc.rect(0, pageHeight - 22, pageWidth, 22, "F");
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("Confidential - Guest Details Report", margin, pageHeight - 14);
        doc.text(
          `${PROPERTY_DETAILS.propertyName} | ${PROPERTY_DETAILS.correspondingPoliceStation}`,
          pageWidth / 2,
          pageHeight - 14,
          { align: "center" }
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 14, {
          align: "right",
        });
        doc.text(`Report Generated: ${serverTime}`, pageWidth / 2, pageHeight - 7, {
          align: "center",
        });
      }

      const fileName =
        selectedGuestsData.length === 1
          ? `Guest_Details_${selectedGuestsData[0].bookingId}_${dayjs().format("YYYY-MM-DD")}.pdf`
          : `Guest_Details_${selectedGuestsData.length}_Guests_${dayjs().format("YYYY-MM-DD_HH-mm")}.pdf`;

      doc.save(fileName);
      setSelectedRows([]);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  /* ---------------- LOADING STATE ---------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b3631] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guest details...</p>
        </div>
      </div>
    );
  }

  /* ---------------- ERROR STATE ---------------- */
  if (error && guests.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#1b3631]">Guest Details</h2>
            <p className="text-gray-600 mt-1">View and manage guest information</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-red-50 rounded-full p-4 mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Guest Details
          </h3>
          <p className="text-gray-600 mb-4 text-center max-w-md">{error.message}</p>
          <button
            onClick={() => fetchGuestDetails()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1b3631] text-white rounded-lg hover:bg-[#2a4a43] transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#1b3631]">Guest Details</h2>
          <p className="text-gray-600 mt-1">View and manage guest information</p>
        </div>
        <button
          onClick={() => fetchGuestDetails(true)}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-colors ${
            isRefreshing ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && guests.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 text-sm">{error.message}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-yellow-600 hover:text-yellow-800"
          >
            ×
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Guest Name"
            value={filters.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b3631] focus:border-[#1b3631]"
          />
          <input
            type="text"
            name="bookingId"
            placeholder="Booking ID"
            value={filters.bookingId}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b3631] focus:border-[#1b3631]"
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={filters.city}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b3631] focus:border-[#1b3631]"
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={filters.state}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b3631] focus:border-[#1b3631]"
          />
        </div>
        {(filters.name || filters.bookingId || filters.city || filters.state) && (
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-[#1b3631] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <DateFilter onApply={setDateFilter} />
        <div className="flex align-center justify-end gap-3">
          <button
            onClick={() =>
              exportToPDF({
                fileName: "Guest_Details",
                columns: GUEST_COLUMNS,
                data: exportData,
              })
            }
            disabled={filteredGuests.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload />
            Export PDF
          </button>
          <button
            onClick={() =>
              exportToExcel({
                fileName: "Guest_Details",
                columns: GUEST_COLUMNS,
                data: exportData,
              })
            }
            disabled={filteredGuests.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload />
            Export EXL
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredGuests.length} of {guests.length} guests
      </div>

      {/* SELECTED COUNT & DOWNLOAD BUTTON */}
      {selectedRows.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-700 font-medium">
              {selectedRows.length} guest(s) selected
            </span>
            <button
              onClick={() => setSelectedRows([])}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={handleDownloadSelectedPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDownloading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#1b3631] hover:bg-[#2a4a43]"
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <FiDownload />
                Download Selected ({selectedRows.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* TABLE */}
      <UniversalTable
        columns={[
          {
            key: "selector",
            label: (
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                disabled={filteredGuests.length === 0}
                className="w-4 h-4 rounded border-gray-300 text-[#1b3631] focus:ring-[#1b3631] cursor-pointer disabled:cursor-not-allowed"
              />
            ),
          },
          { key: "checkInDate", label: "Check-in Date" },
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Surname" },
          { key: "bookingId", label: "Booking ID" },
          { key: "maskedAadhaar", label: "Aadhaar Number" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "verificationStatus", label: "Verification Status" },
          { key: "actions", label: "More Details" },
        ]}
        data={filteredGuests}
        emptyMessage="No guests found."
        format={{
          selector: (_, row) => (
            <input
              type="checkbox"
              checked={selectedRows.includes(row.bookingId)}
              onChange={() => handleSelectRow(row.bookingId)}
              className="w-4 h-4 rounded border-gray-300 text-[#1b3631] focus:ring-[#1b3631] cursor-pointer"
            />
          ),
          checkInDate: (_, row) => formatShortDate(row.date),
          maskedAadhaar: (_, row) => maskAadhaar(row.aadhaarNumber),
          verificationStatus: (status, row) => {
            // Use the status from the row which should be the transformed string
            const displayStatus = row.verificationStatus || status || "Unknown";
            return getStatusBadge(displayStatus);
          },
          actions: (_, row) => (
            <button
              className="text-[#1b3631] text-sm font-medium hover:underline"
              onClick={() => {
                setSelectedGuest(row);
                setShowModal(true);
              }}
            >
              View more
            </button>
          ),
        }}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        guest={selectedGuest}
      />
    </div>
  );
}