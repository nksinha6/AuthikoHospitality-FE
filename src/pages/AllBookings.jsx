import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UI_TEXT } from "../constants/ui.js";
import DateFilter from "../components/DateHourFilter.jsx";
import Loader from "../components/Loader.jsx";
import dayjs from "dayjs";
import { FiPlus } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import UniversalTable from "../components/UniversalTable.jsx";

export default function AllBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState(null); // Store date filter state

  const today = dayjs();

  const formatShortDate = (d) => {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockBookings = [
          {
            date: dayjs("2025-12-10"),
            bookingId: "BK202509",
            ota: "ClearTrip",
            leadGuest: "Rahul Sharma",
            firstName: "Rahul",
            surname: "Sharma",
            phone: "+91-9126456780",
            guests: 2,
            adults: 1,
            minors: 1,
            checkedIn: false,
          },
          {
            date: dayjs("2025-12-10"),
            bookingId: "BK202510",
            ota: "MakeMyTrip",
            leadGuest: "Sana Khan",
            firstName: "Sana",
            surname: "Khan",
            phone: "+91-9123456960",
            guests: 1,
            adults: 1,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202501",
            ota: "MakeMyTrip",
            leadGuest: "Arjun Mehta",
            firstName: "Arjun",
            surname: "Mehta",
            phone: "+91-9876543210",
            guests: 3,
            adults: 2,
            minors: 1,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202502",
            ota: "Booking.com",
            leadGuest: "Meera Sharma",
            firstName: "Meera",
            surname: "Sharma",
            phone: "+91-9988776655",
            guests: 2,
            adults: 2,
            minors: 0,
            checkedIn: true,
          },
          {
            date: dayjs("2025-12-12"),
            bookingId: "BK202503",
            ota: "Goibibo",
            leadGuest: "Rohan Gupta",
            firstName: "Rohan",
            surname: "Gupta",
            phone: "+91-9123456780",
            guests: 1,
            adults: 1,
            minors: 0,
            checkedIn: false,
          },
          {
            date: dayjs("2025-12-14"),
            bookingId: "BK202504",
            ota: "Agoda",
            leadGuest: "Sneha Kulkarni",
            firstName: "Sneha",
            surname: "Kulkarni",
            phone: "+91-9001122334",
            guests: 4,
            adults: 2,
            minors: 2,
            checkedIn: true,
          },
          {
            date: dayjs("2025-12-15"),
            bookingId: "BK202505",
            ota: "Expedia",
            leadGuest: "Sameer Nair",
            firstName: "Sameer",
            surname: "Nair",
            phone: "+91-9334432110",
            guests: 3,
            adults: 3,
            minors: 0,
            checkedIn: false,
          },
          {
            date: dayjs("2025-12-15"),
            bookingId: "BK202506",
            ota: "Airbnb",
            leadGuest: "Kritika Jain",
            firstName: "Kritika",
            surname: "Jain",
            phone: "+91-7890023456",
            guests: 2,
            adults: 2,
            minors: 0,
            checkedIn: true,
          },
          {
            date: dayjs("2025-12-17"),
            bookingId: "BK202507",
            ota: "MakeMyTrip",
            leadGuest: "Vishal Patel",
            firstName: "Vishal",
            surname: "Patel",
            phone: "+91-9988001122",
            guests: 5,
            adults: 3,
            minors: 2,
            checkedIn: false,
          },
          {
            date: dayjs("2025-12-18"),
            bookingId: "BK202508",
            ota: "Booking.com",
            leadGuest: "Aarav Khanna",
            firstName: "Aarav",
            surname: "Khanna",
            phone: "+91-9090903030",
            guests: 2,
            adults: 2,
            minors: 0,
            checkedIn: true,
          },
        ];

        setBookings(mockBookings);
        setError(null);
      } catch {
        setError("Failed to load bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const normalizedBookings = useMemo(() => {
    return bookings.map((b) => ({
      ...b,
      date: dayjs.isDayjs(b.date)
        ? b.date.startOf("day")
        : dayjs(b.date).startOf("day"),
    }));
  }, [bookings]);

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
    const filtered = normalizedBookings.filter((b) => {
      let include = true;

      // Apply date filter if active
      if (dateFilter) {
        const bookingDate = b.date;
        const selected = dateFilter.selectedDate
          ? dayjs(dateFilter.selectedDate).startOf("day")
          : null;
        const start = dateFilter.startDate
          ? dayjs(dateFilter.startDate).startOf("day")
          : null;
        const end = dateFilter.endDate
          ? dayjs(dateFilter.endDate).endOf("day")
          : null;
        const now = dayjs().startOf("day");

        switch (dateFilter.condition) {
          case "is between":
            if (!start || !end) include = false;
            else
              include =
                (bookingDate.isAfter(start) ||
                  bookingDate.isSame(start, "day")) &&
                (bookingDate.isBefore(end) || bookingDate.isSame(end, "day"));
            break;

          case "is after":
          case "is on or after":
            if (!selected) include = false;
            else
              include =
                bookingDate.isAfter(selected) ||
                bookingDate.isSame(selected, "day");
            break;

          case "is before":
          case "is before or on":
            if (!selected) include = false;
            else
              include =
                bookingDate.isBefore(selected) ||
                bookingDate.isSame(selected, "day");
            break;

          case "is equal to":
            include = bookingDate.isSame(selected, "day");
            break;

          case "is in the last": {
            const unitValue = parseInt(dateFilter.value) || 0;
            const unit = (dateFilter.timeUnit || "days").replace(/s$/i, "");
            const lastStart = now.subtract(unitValue, unit);
            include =
              (bookingDate.isAfter(lastStart) ||
                bookingDate.isSame(lastStart, "day")) &&
              (bookingDate.isBefore(now) || bookingDate.isSame(now, "day"));
            break;
          }

          default:
            break;
        }
      }

      // Apply text filters
      if (filters.name) {
        const search = filters.name.toLowerCase();
        include =
          include &&
          (b.firstName.toLowerCase().includes(search) ||
            b.surname.toLowerCase().includes(search));
      }

      if (filters.phone) {
        const search = filters.phone.toLowerCase();
        include = include && b.phone.toLowerCase().includes(search);
      }

      if (filters.ota) {
        const search = filters.ota.toLowerCase();
        include = include && b.ota.toLowerCase().includes(search);
      }

      return include;
    });

    setFilteredBookings(filtered);
  }, [normalizedBookings, dateFilter, filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply all filters whenever any filter changes
  useEffect(() => {
    applyAllFilters();
  }, [applyAllFilters]);

  const formatPhone = (phone) => {
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
      return `+91-${digits.substring(2, 7)}-${digits.substring(7)}`;
    }

    if (digits.length === 10) {
      return `${digits.substring(0, 5)}-${digits.substring(5)}`;
    }

    return phone;
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
            onClick={() => window.location.reload()}
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
          guests: (_, row) =>
            `${row.adults} ${row.adults === 1 ? "Adult" : "Adults"}${
              row.minors > 0
                ? `, ${row.minors} ${row.minors === 1 ? "Minor" : "Minors"}`
                : ""
            }`,

          checkedIn: (value, row) => {
            if (!row.checkedIn && row.date.isBefore(dayjs(), "day")) {
              return (
                <button
                  key={`no-show-${row.bookingId}`}
                  className="flex items-center gap-2 text-gray-600 "
                >
                  <FaCircle className="text-red-500 text-xs" />
                  {UI_TEXT.BUTTON_NO_SHOW}
                </button>
              );
            }

            if (!row.checkedIn) {
              return (
                <button
                  key={`checkin-${row.bookingId}`}
                  className="flex items-center gap-2 text-gray-600 "
                >
                  <FaCircle className="text-yellow-500 text-xs" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </button>
              );
            }

            return (
              <button
                key={`details-${row.bookingId}`}
                className="flex items-center gap-2 text-gray-600 "
              >
                <FaCircle className="text-green-500 text-xs" />
                {UI_TEXT.BUTTON_VIEW_CHECKIN_DETAILS}
              </button>
            );
          },
        }}
      />
    </div>
  );
}
