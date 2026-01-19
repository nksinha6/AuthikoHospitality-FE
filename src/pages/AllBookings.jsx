import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UI_TEXT } from "../constants/ui.js";
import DateFilter from "../components/DateHourFilter.jsx";
import Loader from "../components/Loader.jsx";
import dayjs from "dayjs";
import { FiPlus, FiDownload } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import UniversalTable from "../components/UniversalTable.jsx";
import { bookingService } from "../services/bookingService.js";
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
        <button className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90">
          <FiPlus className="text-lg" />
          {UI_TEXT.BUTTON_CREATE_WALKIN}
        </button>
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
          { key: "bookingId", label: UI_TEXT.TABLE_BOOKING_ID },
          { key: "ota", label: UI_TEXT.TABLE_OTA },
          { key: "firstName", label: UI_TEXT.TABLE_FIRST_NAME },
          { key: "surname", label: UI_TEXT.TABLE_SURNAME },
          { key: "phone", label: UI_TEXT.TABLE_PHONE },
          { key: "guests", label: UI_TEXT.TABLE_NUM_GUESTS },
          { key: "checkedIn", label: UI_TEXT.TABLE_STATUS },
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
                  <FaCircle className="text-yellow-500 text-xs mt-[1px]" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </div>
              );
            }

            // 🟢 Completed → View Verification
            return (
              <div className="flex items-center gap-2 text-gray-600 leading-none">
                <FaCircle className="text-green-500 text-xs mt-[1px]" />
                {UI_TEXT.BUTTON_VIEW_CHECKEDIN}
              </div>
            );
          },
        }}
      />
    </div>
  );
}
