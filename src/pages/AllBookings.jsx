// ========== COMMENTED OUT - ONLY LOGIN PAGE IS ACTIVE ==========
// This page has been commented out. Only the Login page is currently active.
// To re-enable this page, uncomment the entire file content below.
/*
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UI_TEXT } from "../constants/ui.js";
import DateFilter from "../components/DateHourFilter.jsx";
import Loader from "../components/Loader.jsx";
import dayjs from "dayjs";
import { FiPlus, FiDownload } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import GuestDetailsModal from "../components/GuestDetailsModal.jsx";
import UniversalTable from "../components/UniversalTable.jsx";
import {
  formatShortDate,
  formatPhone,
  formatGuests,
  normalizeBookings,
  applyBookingFilters,
} from "../utility/bookingUtils.js";

import { bookingReadService } from "../services/bookingService.js";

export default function AllBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null); // ADD THIS
  const [showModal, setShowModal] = useState(false); // ADD THIS

  // ✅ UPDATED: fetch from real API + log response
  const fetchAllBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await bookingReadService.fetchAllBookings();

      // 🔹 LOG API RESPONSE
      console.log("📦 All Bookings API Response:", response);

      // Handle different response shapes
      const bookingsData = Array.isArray(response)
        ? response
        : response?.data || [];

      setBookings(bookingsData);
    } catch (err) {
      console.error("❌ Fetch bookings error:", err);
      setError(err.message || "Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  const normalizedBookings = useMemo(
    () => normalizeBookings(bookings),
    [bookings],
  );

  const [filteredBookings, setFilteredBookings] = useState([]);

  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    ota: "",
  });

  const handleDateFilterApply = (filterData) => {
    setDateFilter(filterData || null);
  };

  const applyAllFilters = useCallback(() => {
    const filtered = applyBookingFilters({
      bookings: normalizedBookings,
      dateFilter,
      filters,
    });

    setFilteredBookings(filtered);
  }, [normalizedBookings, dateFilter, filters]);

  useEffect(() => {
    applyAllFilters();
  }, [applyAllFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const prepareGuestDataForModal = (row) => {
    // Extract time from date if available, or use current time
    const time = row.time || dayjs().format("hh:mm A");
    
    return {
      date: row.date ? dayjs(row.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      time: time,
      bookingId: row.bookingId || "N/A",
      firstName: row.firstName || "N/A",
      lastName: row.surname || "N/A",
      phone: row.phone || "N/A",
      city: row.city || "N/A",
      state: row.state || "N/A",
      // Add any other fields you want to show in modal
      ota: row.ota || "N/A",
      adults: row.adults || 0,
      minors: row.minors || 0,
      checkedInStatus: row.windowEnd ? "Checked In" : "Pending",
    };
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={fetchAllBookings}
            className="bg-brand text-white px-4 py-2 rounded hover:bg-brand/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand">
            {UI_TEXT.ALL_BOOKINGS_TITLE}
          </h2>
          <p className="text-gray-600 mt-1">{UI_TEXT.ALL_BOOKINGS_SUBTITLE}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-6">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_GUEST_NAME}
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          />
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_PHONE}
            name="phone"
            value={filters.phone}
            onChange={handleInputChange}
            className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          />
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_OTA}
            name="ota"
            value={filters.ota}
            onChange={handleInputChange}
            className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <DateFilter onApply={handleDateFilterApply} />
        <div className="flex gap-3">
          <button className="flex text-sm items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FiDownload /> Export PDF
          </button>
          <button className="flex text-sm items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FiDownload /> Export EXL
          </button>
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      <UniversalTable
        columns={[
          { key: "date", label: UI_TEXT.TABLE_DATE },
          { key: "firstName", label: UI_TEXT.TABLE_FIRST_NAME },
          { key: "surname", label: UI_TEXT.TABLE_SURNAME },
          { key: "phone", label: UI_TEXT.TABLE_PHONE },
          { key: "ota", label: UI_TEXT.TABLE_OTA },
          { key: "bookingId", label: UI_TEXT.TABLE_BOOKING_ID },
          { key: "checkedIn", label: UI_TEXT.TABLE_STATUS },
          // { key: "guests", label: UI_TEXT.TABLE_NUM_GUESTS },
          // { key: "actions", label: "More Details" },
        ]}
        data={filteredBookings}
        emptyMessage="No bookings match your filters."
        format={{
          date: (d) => formatShortDate(d),
          phone: (p) => formatPhone(p),
          guests: (_, row) => formatGuests(row.adults, row.minors),
          checkedIn: (_, row) => {
            // 🔴 No-show (past date + not completed)
            if (!row.windowEnd && row.date.isBefore(dayjs(), "day")) {
              return (
                <div className="flex items-center gap-2 text-gray-600">
                  <FaCircle className="text-red-500 text-xs" />
                  {UI_TEXT.BUTTON_NO_SHOW}
                </div>
              );
            }

            // 🟡 Pending → Start Verification
            if (!row.windowEnd) {
              return (
                <div className="flex items-center gap-2 text-gray-600 leading-none">
                  <FaCircle className="text-yellow-500 text-xs mt-px" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </div>
              );
            }

            // 🟢 Completed → View Verification
            return (
              <div className="flex items-center gap-2 text-gray-600 leading-none">
                <FaCircle className="text-green-500 text-xs mt-px" />
                {UI_TEXT.BUTTON_VIEW_CHECKEDIN}
              </div>
            );
          },
          actions: (_, row) => ( // ADD THIS FORMATTER
            <button 
              className="text-brand text-sm font-medium hover:underline"
              onClick={() => {
                setSelectedGuest(prepareGuestDataForModal(row));
                setShowModal(true);
              }}
            >
              View
            </button>
          ),
        }}
      />

      <GuestDetailsModal 
        show={showModal} 
        handleClose={() => setShowModal(false)} 
        guest={selectedGuest} 
      />
    </div>
  );
}
*/

// Placeholder export to prevent import errors
export default function AllBookings() {
  return <div>AllBookings Page - Commented Out</div>;
}
