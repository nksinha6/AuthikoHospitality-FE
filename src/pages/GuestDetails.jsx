// pages/GuestDetails.jsx

import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { DATE_CONDITIONS } from "../constants/ui.js";
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

const getGuestImageKey = (guest) => {
  return [
    guest.bookingId,
    guest.digiLockerReferenceId || "",
    guest.aadhaarNumber || "",
    guest.phoneCountryCode || "",
    guest.phoneNumber || guest.phone || "",
  ].join("_");
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

  /* ---------------- FETCH GUEST IMAGE ---------------- */
  const fetchGuestImage = async (guest) => {
    try {
      // Check if image is in guest data directly
      if (guest.image) {
        if (guest.image.startsWith("data:")) {
          return guest.image;
        } else {
          return `data:image/jpeg;base64,${guest.image}`;
        }
      }

      // Fallback to API
      let phoneNumber = guest.phoneNumber || guest.phone || "";
      let countryCode = guest.phoneCountryCode || "91";

      if (phoneNumber && phoneNumber.length > 10) {
        countryCode = phoneNumber.substring(0, phoneNumber.length - 10);
        phoneNumber = phoneNumber.slice(-10);
      }

      if (phoneNumber) {
        const imageData = await guestDetailsService.fetchGuestImageWithRetry(
          countryCode,
          phoneNumber,
        );

        if (imageData) {
          return imageData;
        }
      }

      return null;
    } catch (error) {
      console.error(
        `Error fetching image for guest ${guest.bookingId}:`,
        error,
      );
      return null;
    }
  };

  /* ---------------- FETCH DATA FROM API ---------------- */
  const fetchGuestDetails = useCallback(
    async (showRefreshIndicator = false) => {
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
        console.log(
          "Setting guests with count:",
          transformedData.length,
          "First guest:",
          transformedData[0],
        );
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
    },
    [],
  );

  /* ---------------- INITIAL DATA LOAD ---------------- */
  useEffect(() => {
    fetchGuestDetails();
  }, [fetchGuestDetails]);

  /* ---------------- APPLY FILTERS ---------------- */
  const applyAllFilters = useCallback(() => {
    let data = [...guests];

    // Debug: log initial data and first guest structure
    if (data.length > 0) {
      console.log("Filter Debug - First guest object:", {
        firstName: data[0].firstName,
        lastName: data[0].lastName,
        fullName: data[0].fullName,
        city: data[0].city,
        state: data[0].state,
        bookingId: data[0].bookingId,
      });
    }

    // Name filter
    if (filters.name) {
      const q = filters.name.toLowerCase();
      console.log("Filter Debug - Applying name filter:", {
        query: q,
        count: data.length,
      });
      data = data.filter(
        (g) =>
          g.firstName?.toLowerCase().includes(q) ||
          g.lastName?.toLowerCase().includes(q) ||
          g.fullName?.toLowerCase().includes(q),
      );
      console.log("Filter Debug - After name filter:", { count: data.length });
    }

    // Booking ID filter
    if (filters.bookingId) {
      console.log("Filter Debug - Applying bookingId filter:", {
        query: filters.bookingId,
        count: data.length,
      });
      data = data.filter((g) =>
        g.bookingId?.toLowerCase().includes(filters.bookingId.toLowerCase()),
      );
      console.log("Filter Debug - After bookingId filter:", {
        count: data.length,
      });
    }

    // City filter
    if (filters.city) {
      console.log("Filter Debug - Applying city filter:", {
        query: filters.city,
        count: data.length,
      });
      data = data.filter((g) =>
        g.city?.toLowerCase().includes(filters.city.toLowerCase()),
      );
      console.log("Filter Debug - After city filter:", { count: data.length });
    }

    // State filter
    if (filters.state) {
      console.log("Filter Debug - Applying state filter:", {
        query: filters.state,
        count: data.length,
      });
      data = data.filter((g) =>
        g.state?.toLowerCase().includes(filters.state.toLowerCase()),
      );
      console.log("Filter Debug - After state filter:", { count: data.length });
    }

    // Date filter - support multiple conditions
    if (dateFilter && dateFilter.condition) {
      const cond = dateFilter.condition;
      if (
        cond === DATE_CONDITIONS.BETWEEN &&
        dateFilter.startDate &&
        dateFilter.endDate
      ) {
        const start = dayjs(dateFilter.startDate).startOf("day");
        const end = dayjs(dateFilter.endDate).endOf("day");
        data = data.filter((g) => {
          const d = dayjs(g.date);
          return (
            (d.isSame(start, "day") || d.isAfter(start, "day")) &&
            (d.isSame(end, "day") || d.isBefore(end, "day"))
          );
        });
      } else if (
        cond === DATE_CONDITIONS.LAST &&
        dateFilter.value &&
        dateFilter.timeUnit
      ) {
        const amount = Number(dateFilter.value) || 0;
        const cutoff = dayjs()
          .subtract(amount, dateFilter.timeUnit)
          .startOf("day");
        data = data.filter((g) => {
          const d = dayjs(g.date);
          return d.isSame(cutoff, "day") || d.isAfter(cutoff, "day");
        });
      } else if (cond === DATE_CONDITIONS.AFTER) {
        const selected = dayjs(dateFilter.selectedDate).startOf("day");
        data = data.filter((g) => dayjs(g.date).isAfter(selected, "day"));
      } else if (cond === DATE_CONDITIONS.ON_OR_AFTER) {
        const selected = dayjs(dateFilter.selectedDate).startOf("day");
        data = data.filter((g) => {
          const d = dayjs(g.date);
          return d.isSame(selected, "day") || d.isAfter(selected, "day");
        });
      } else if (cond === DATE_CONDITIONS.BEFORE) {
        const selected = dayjs(dateFilter.selectedDate).startOf("day");
        data = data.filter((g) => dayjs(g.date).isBefore(selected, "day"));
      } else if (cond === DATE_CONDITIONS.BEFORE_OR_ON) {
        const selected = dayjs(dateFilter.selectedDate).startOf("day");
        data = data.filter((g) => {
          const d = dayjs(g.date);
          return d.isSame(selected, "day") || d.isBefore(selected, "day");
        });
      } else {
        // Default: equality (is equal to)
        const selected = dayjs(dateFilter.selectedDate).startOf("day");
        data = data.filter((g) => dayjs(g.date).isSame(selected, "day"));
      }
    }

    console.log("Filter Debug - Final filtered data:", {
      count: data.length,
      results: data.map((g) => g.fullName),
    });
    setFilteredGuests(data);
  }, [guests, filters, dateFilter]);

  useEffect(() => {
    applyAllFilters();
  }, [applyAllFilters]);

  // Helper to compute the same unique row key as UniversalTable
  const getRowKeyFromData = (row, index) =>
    row.id ?? (row.bookingId ? `${row.bookingId}_${index}` : index);

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
      setSelectedRows(filteredGuests.map((g, i) => getRowKeyFromData(g, i)));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (rowKey) => {
    setSelectedRows((prev) =>
      prev.includes(rowKey)
        ? prev.filter((id) => id !== rowKey)
        : [...prev, rowKey],
    );
  };

  const isAllSelected =
    filteredGuests.length > 0 && selectedRows.length === filteredGuests.length;

  /* ---------------- VERIFICATION STATUS BADGE ---------------- */
  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toString().trim() || "Unknown";

    const statusStyles = {
      Verified: "bg-green-100 text-green-700 border border-green-200",
      Pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      Failed: "bg-red-100 text-red-700 border border-red-200",
      Processing: "bg-blue-100 text-blue-700 border border-blue-200",
      Unknown: "bg-gray-100 text-gray-700 border border-gray-200",
    };

    const style = statusStyles[normalizedStatus] || statusStyles.Unknown;
    const displayStatus = statusStyles[normalizedStatus]
      ? normalizedStatus
      : "Unknown";

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
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

  /* ---------------- DOWNLOAD SELECTED AS PDF (ONE PAGE PER GUEST) ---------------- */
  const handleDownloadSelectedPDF = async () => {
    if (selectedRows.length === 0) return;

    setIsDownloading(true);

    try {
      const serverTime = await fetchServerTime();
      const selectedGuestsData = filteredGuests.filter((g, i) =>
        selectedRows.includes(getRowKeyFromData(g, i)),
      );

      // Fetch images for all selected guests
      const guestImages = {};
      console.log("Fetching images for selected guests...");

      for (const guest of selectedGuestsData) {
        try {
          const imageData = await fetchGuestImage(guest);
          const imageKey = getGuestImageKey(guest);

          guestImages[imageKey] = imageData || null;

          if (imageData) {
            console.log("Image fetched for:", imageKey);
          }
        } catch (error) {
          console.error(
            `Failed to fetch image for guest ${guest.bookingId}:`,
            error,
          );
        }
      }

      console.log(`Total images fetched: ${Object.keys(guestImages).length}`);

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const contentStartX = margin + 6;

      /* ---------------- HELPER FUNCTIONS ---------------- */
      const calculateAgeFromVerification = (dob, verificationTimestamp) => {
        if (!dob || !verificationTimestamp) return "N/A";

        const birthDate = dayjs(dob);
        const verificationDate = dayjs(verificationTimestamp);

        if (!birthDate.isValid() || !verificationDate.isValid()) return "N/A";

        let age = verificationDate.year() - birthDate.year();

        // If birthday hasn't occurred yet in verification year
        if (
          verificationDate.month() < birthDate.month() ||
          (verificationDate.month() === birthDate.month() &&
            verificationDate.date() < birthDate.date())
        ) {
          age--;
        }

        return age >= 0 ? `${age} Years` : "N/A";
      };

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

      const drawTrafficLightStatus = (status, referenceId, x, y) => {
        const normalized = status?.toLowerCase() || "unknown";

        const statusMap = {
          verified: { label: "Verified", color: [34, 197, 94] },
          pending: { label: "Pending", color: [234, 179, 8] },
          failed: { label: "Failed", color: [239, 68, 68] },
          processing: { label: "Processing", color: [59, 130, 246] },
        };

        const cfg = statusMap[normalized] || {
          label: "Unknown",
          color: [156, 163, 175],
        };

        /* ---- Traffic light dot ---- */
        doc.setFillColor(...cfg.color);
        doc.circle(x + 1.5, y - 1.2, 1.1, "F");

        /* ---- Status text ---- */
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...cfg.color);
        doc.text(cfg.label, x + 5, y);
      };

      const addFieldLabel = (label, x, y) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(label, x, y);
      };

      const addFieldValue = (value, x, y, maxWidth = 80) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(value || "N/A", maxWidth);
        doc.text(lines, x, y);
        return lines.length * 4;
      };

      const addSectionHeader = (title, y) => {
        doc.setFillColor(27, 54, 49);
        doc.rect(margin, y, 2.5, 6, "F");
        addText(title, contentStartX, y + 4.5, {
          fontSize: 10,
          fontStyle: "bold",
        });
        return y + 10;
      };

      /* ---------------- GENERATE ONE PAGE PER GUEST ---------------- */
      selectedGuestsData.forEach((guest, guestIndex) => {
        if (guestIndex > 0) {
          doc.addPage();
        }

        const col1X = contentStartX;
        const col2X = pageWidth / 2 + 5;
        const colWidth = (contentWidth - 20) / 2;

        const fullName =
          guest.fullName || `${guest.firstName} ${guest.lastName}`;
        // const guestImage = guestImages[guest.bookingId];
        const imageKey = getGuestImageKey(guest);
        const guestImage = guestImages[imageKey];
        const hasImage = !!guestImage;
        const imageWidth = 28;
        const imageHeight = 35;

        // ==================== HEADER ====================
        doc.setFillColor(27, 54, 49);
        doc.rect(0, 0, pageWidth, 32, "F");

        addText("Guest Details Report", margin, 12, {
          fontSize: 16,
          fontStyle: "bold",
          color: [255, 255, 255],
        });
        addText(`Booking ID: ${guest.bookingId}`, margin, 20, {
          fontSize: 10,
          color: [200, 220, 210],
        });
        addText(
          `Guest ${guestIndex + 1} of ${selectedGuestsData.length}`,
          margin,
          27,
          {
            fontSize: 8,
            color: [180, 200, 190],
          },
        );

        let yPos = 38;

        // ==================== SECTION A: GUEST IDENTITY DETAILS ====================
        yPos = addSectionHeader("A. Guest Identity Details", yPos);

        // Background for section A
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos - 2, contentWidth, hasImage ? 48 : 40, "F");

        // Add guest image if available
        if (hasImage) {
          try {
            doc.addImage(
              guestImage,
              "JPEG",
              col1X,
              yPos,
              imageWidth,
              imageHeight,
            );
          } catch (e) {
            console.error("Error adding image to PDF:", e);
          }
        }

        // Adjust field positions based on image presence
        const identityCol1X = hasImage ? col1X + imageWidth + 5 : col1X;

        // Row 1: Full Name & Date of Birth
        addFieldLabel("Full Name", identityCol1X, yPos + 3);
        addFieldValue(
          fullName,
          identityCol1X,
          yPos + 7,
          colWidth - (hasImage ? imageWidth : 0),
        );

        addFieldLabel("Age (Years)", col2X, yPos + 3);
        addFieldValue(
          calculateAgeFromVerification(
            guest.dateOfBirth,
            guest.aadhaarVerificationTimestamp,
          ),
          col2X,
          yPos + 7,
        );

        // Row 2: Gender & Nationality
        addFieldLabel("Gender", identityCol1X, yPos + 15);
        addFieldValue(guest.gender || "N/A", identityCol1X, yPos + 19);

        addFieldLabel("Nationality", col2X, yPos + 15);
        addFieldValue(guest.nationality || "Indian", col2X, yPos + 19);

        // Row 3: Verification Status & DigiLocker Reference ID
        addFieldLabel("Verification Status", identityCol1X, yPos + 27);
        drawTrafficLightStatus(
          guest.verificationStatus,
          null, // ❌ remove inline ref from traffic light
          identityCol1X,
          yPos + 32,
        );

        // Right side — DigiLocker Reference ID
        addFieldLabel("DigiLocker Reference ID", col2X, yPos + 27);
        addFieldValue(guest.digiLockerReferenceId || "N/A", col2X, yPos + 32);

        yPos += hasImage ? 50 : 40;

        // Row 4: Aadhaar & Verification Timestamp (full width)
        addFieldLabel("Masked Aadhaar Number", col1X, yPos);
        addFieldValue(maskAadhaar(guest.aadhaarNumber), col1X, yPos + 4);

        addFieldLabel("Verification Timestamp", col2X, yPos);
        addFieldValue(
          guest.aadhaarVerificationTimestamp || "N/A",
          col2X,
          yPos + 4,
        );

        yPos += 12;
        drawHorizontalLine(yPos);
        yPos += 6;

        // ==================== SECTION B: CONTACT INFORMATION ====================
        yPos = addSectionHeader("B. Contact Information", yPos);

        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos - 2, contentWidth, 45, "F");

        // Row 1: Mobile & Email
        addFieldLabel("Mobile Number", col1X, yPos + 3);
        addFieldValue(maskPhone(guest.phone), col1X, yPos + 7);

        addFieldLabel("Email ID", col2X, yPos + 3);
        const emailDisplay =
          guest.email && guest.email.length > 30
            ? guest.email.substring(0, 30) + "..."
            : guest.email || "N/A";
        addFieldValue(emailDisplay, col2X, yPos + 7);

        // Row 2: City, State & PIN
        addFieldLabel("City", col1X, yPos + 15);
        addFieldValue(guest.city || "N/A", col1X, yPos + 19);

        addFieldLabel("State", col2X - 30, yPos + 15);
        addFieldValue(guest.state || "N/A", col2X - 30, yPos + 19);

        addFieldLabel("PIN Code", col2X + 30, yPos + 15);
        addFieldValue(guest.pinCode || "N/A", col2X + 30, yPos + 19);

        yPos += 28;
        drawHorizontalLine(yPos);
        yPos += 6;

        // ==================== SECTION C: BOOKING & STAY DETAILS ====================
        yPos = addSectionHeader("C. Booking & Stay Details", yPos);

        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos - 2, contentWidth, 25, "F");

        // Row 1: Booking ID & Booking Source
        addFieldLabel("Booking ID", col1X, yPos + 3);
        addFieldValue(guest.bookingId || "N/A", col1X, yPos + 7);

        addFieldLabel("Booking Source", col2X, yPos + 3);
        addFieldValue(guest.bookingSource || "N/A", col2X, yPos + 7);

        // Row 2: Check-in Date & Time
        addFieldLabel("Check-in Date & Time", col1X, yPos + 15);
        addFieldValue(guest.checkInDateTime || "N/A", col1X, yPos + 19);

        // ==================== FOOTER ====================
        doc.setFillColor(249, 250, 251);
        doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(
          "Confidential - Guest Details Report",
          margin,
          pageHeight - 10,
        );
        doc.text(
          `Page ${guestIndex + 1} of ${selectedGuestsData.length}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" },
        );
        doc.text(
          `Report Generated: ${serverTime}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" },
        );
      });

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
            <h2 className="text-2xl font-semibold text-[#1b3631]">
              Guest Details
            </h2>
            <p className="text-gray-600 mt-1">
              View and manage guest information
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-red-50 rounded-full p-4 mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Guest Details
          </h3>
          <p className="text-gray-600 mb-4 text-center max-w-md">
            {error.message}
          </p>
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
          <h2 className="text-2xl font-semibold text-[#1b3631]">
            Guest Details
          </h2>
          <p className="text-gray-600 mt-1">
            View and manage guest information
          </p>
        </div>
        <button
          onClick={() => fetchGuestDetails(true)}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-colors ${
            isRefreshing ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          <FiRefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && guests.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
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
        {(filters.name ||
          filters.bookingId ||
          filters.city ||
          filters.state) && (
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
              checked={selectedRows.includes(row.__rowKey)}
              onChange={() => handleSelectRow(row.__rowKey)}
              className="w-4 h-4 rounded border-gray-300 text-[#1b3631] focus:ring-[#1b3631] cursor-pointer"
            />
          ),
          checkInDate: (_, row) => formatShortDate(row.date),
          maskedAadhaar: (_, row) => maskAadhaar(row.aadhaarNumber),
          verificationStatus: (status, row) => {
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
