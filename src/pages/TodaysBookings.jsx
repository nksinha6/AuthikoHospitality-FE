// ========== COMMENTED OUT - ONLY LOGIN PAGE IS ACTIVE ==========
// This page has been commented out. Only the Login page is currently active.
// To re-enable this page, uncomment the entire file content below.
/*
import { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import { UI_TEXT } from "../constants/ui.js";
import { FiPlus, FiDownload } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import UniversalTable from "../components/UniversalTable.jsx";
import Loader from "../components/Loader.jsx";
import {
  getFullHeaderDate,
  formatShortDate,
  filterBookings,
  formatPhone,
  formatGuests,
  normalizeBookings,
} from "../utility/bookingUtils.js";
import { bookingReadService } from "../services/bookingService.js";

export default function TodaysBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);

  // ✅ SAME AS OLD CODE (REQUIRED FOR DROPDOWN)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [filters, setFilters] = useState({
    guest: "",
    phone: "",
    ota: "",
    status: "not-checked-in", // SAME AS OLD UI
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const response = await bookingReadService.fetchAllBookings();
      const data = Array.isArray(response) ? response : response?.data || [];

      // normalize backend response
      const normalized = normalizeBookings(data);

      // ONLY TODAY'S BOOKINGS
      const todays = normalized.filter((b) => b.date.isSame(dayjs(), "day"));

      setBookings(todays);
      setError(null);
    } catch (err) {
      setError(
        err.message || "Failed to load today's bookings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  );

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={fetchBookings}
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
          <h2 className="text-2xl font-semibold text-gray-900">
            {UI_TEXT.TODAYS_TITLE}
          </h2>
          <p className="text-gray-600 mt-1">{getFullHeaderDate()}</p>
        </div>

        <button className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 cursor-pointer">
          <FiPlus className="text-lg" />
          {UI_TEXT.BUTTON_CREATE_WALKIN}
        </button>
      </div>

      {/* FILTERS INPUT ROW - FIRST LINE (UNCHANGED) */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder={UI_TEXT.FILTER_GUEST_NAME}
          value={filters.guest}
          onChange={(e) => updateFilter("guest", e.target.value)}
          className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent hover:bg-gray-50 hover:border-gray-400"
        />

        <input
          type="text"
          placeholder={UI_TEXT.FILTER_PHONE}
          value={filters.phone}
          onChange={(e) => updateFilter("phone", e.target.value)}
          className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent hover:bg-gray-50 hover:border-gray-400"
        />

        <input
          type="text"
          placeholder={UI_TEXT.FILTER_OTA}
          value={filters.ota}
          onChange={(e) => updateFilter("ota", e.target.value)}
          className="flex-1 text-sm max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent hover:bg-gray-50 hover:border-gray-400"
        />
      </div>

      {/* FILTERS INPUT ROW - SECOND LINE (UNCHANGED UI) */}
      <div className="flex justify-between items-center mb-6">
        {/* STATUS DROPDOWN */}
        <div className="relative">
          <button
            className="flex items-center text-sm text-gray-500 justify-between w-45 h-8 px-4 border border-gray-300 rounded-full bg-white cursor-pointer select-none transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
            onClick={() => setShowStatusDropdown((prev) => !prev)}
          >
            <span>
              {filters.status === ""
                ? UI_TEXT.FILTER_STATUS
                : filters.status === "checked-in"
                  ? "Checked In"
                  : "Not Checked In"}
            </span>
          </button>

          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  updateFilter("status", "");
                  setShowStatusDropdown(false);
                }}
              >
                {UI_TEXT.FILTER_STATUS}
              </div>

              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  updateFilter("status", "checked-in");
                  setShowStatusDropdown(false);
                }}
              >
                Checked In
              </div>

              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  updateFilter("status", "not-checked-in");
                  setShowStatusDropdown(false);
                }}
              >
                Not Checked In
              </div>
            </div>
          )}
        </div>

        {/* EXPORT BUTTONS */}
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

      {/* BOOKINGS TABLE (UI UNCHANGED) */}
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

          // ✅ LOGIC UPDATED, UI SAME
          checkedIn: (_, row) => {
            if (!row.windowEnd) {
              return (
                <div className="flex items-center gap-2 text-gray-600 leading-none">
                  <FaCircle className="text-yellow-500 text-xs mt-[1px]" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </div>
              );
            }

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
*/

// Placeholder export to prevent import errors
export default function TodaysBookings() {
  return <div>TodaysBookings Page - Commented Out</div>;
}
