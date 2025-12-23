import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UI_TEXT } from "../constants/ui.js";
import DateFilter from "../components/DateHourFilter.jsx";
import Loader from "../components/Loader.jsx";
import dayjs from "dayjs";
import { FiPlus } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import UniversalTable from "../components/UniversalTable.jsx";
import {
  formatShortDate,
  formatPhone,
  formatGuests,
  normalizeBookings,
  applyBookingFilters,
} from "../utility/BookingUtils.js";
import { bookingService } from "../services/BookingService.js";

export default function AllBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState(null); // Store date filter state

  const fetchAllBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await bookingService.fetchBookings();
      setBookings(data);
    } catch (err) {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const normalizedBookings = useMemo(
    () => normalizeBookings(bookings),
    [bookings]
  );

  const [filteredBookings, setFilteredBookings] = useState([]);

  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    ota: "",
  });

  const handleDateFilterApply = (filterData) => {
    // Handle both apply and clear actions
    if (!filterData) {
      // Clear filter
      setDateFilter(null);
    } else {
      // Apply filter
      setDateFilter(filterData);
    }
  };

  const applyAllFilters = useCallback(() => {
    const filtered = applyBookingFilters({
      bookings: normalizedBookings,
      dateFilter,
      filters,
    });

    setFilteredBookings(filtered);
  }, [normalizedBookings, dateFilter, filters]);

  // Apply all filters whenever any filter changes
  useEffect(() => {
    applyAllFilters();
  }, [applyAllFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <Loader />;
  }

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
        <button className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 cursor-pointer">
          <FiPlus className="text-lg" />
          {UI_TEXT.BUTTON_CREATE_WALKIN}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_GUEST_NAME}
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent hover:bg-gray-50 hover:border-gray-400"
          />
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_PHONE}
            name="phone"
            value={filters.phone}
            onChange={handleInputChange}
            className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent hover:bg-gray-50 hover:border-gray-400"
          />
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_OTA}
            name="ota"
            value={filters.ota}
            onChange={handleInputChange}
            className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent hover:bg-gray-50 hover:border-gray-400"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <DateFilter onApply={handleDateFilterApply} />
        <div className="flex gap-3">
          <button className="flex text-sm items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <FiDownload />
            Export PDF
          </button>
          <button className="flex text-sm items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <FiDownload />
            Export EXL
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

          checkedIn: (value, row) => {
            if (!row.checkedIn && row.date.isBefore(dayjs(), "day")) {
              return (
                <div className="flex items-center gap-2 text-gray-600 ">
                  <FaCircle className="text-red-500 text-xs" />
                  {UI_TEXT.BUTTON_NO_SHOW}
                </div>
              );
            }

            if (!row.checkedIn) {
              return (
                <div className="flex items-center gap-2 text-gray-600 ">
                  <FaCircle className="text-yellow-500 text-xs" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </div>
              );
            }

            return (
              <div className="flex items-center gap-2 text-gray-600 ">
                <FaCircle className="text-green-500 text-xs" />
                {UI_TEXT.BUTTON_VIEW_CHECKIN_DETAILS}
              </div>
            );
          },
        }}
      />
    </div>
  );
}
