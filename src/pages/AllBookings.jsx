import React, { useState, useEffect } from "react";
import { UI_TEXT } from "../constants/ui.js";
import DateFilter from "../components/DateHourFilter.jsx";
import "../styles/TodaysBookings.css";
import dayjs from "dayjs";
import { FiPlus } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import UniversalTable from "../components/UniversalTable.jsx";

export default function AllGuests() {
  const today = dayjs();

  const formatShortDate = (d) => {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const bookings = [
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

  const normalizedBookings = bookings.map((b) => ({
    ...b,
    date: dayjs.isDayjs(b.date)
      ? b.date.startOf("day")
      : dayjs(b.date).startOf("day"),
  }));

  const [filteredBookings, setFilteredBookings] = useState(normalizedBookings);

  // Filters
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    ota: "",
  });

  const handleDateFilterApply = ({
    condition,
    selectedDate,
    startDate,
    endDate,
    value,
    timeUnit,
  }) => {
    applyFilters({
      dateFilter: {
        condition,
        selectedDate,
        startDate,
        endDate,
        value,
        timeUnit,
      },
    });
  };

  const applyFilters = ({ dateFilter } = {}) => {
    const filtered = normalizedBookings.filter((b) => {
      let include = true;

      // Date filter
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

      // Name filter (firstName or surname)
      if (filters.name) {
        const search = filters.name.toLowerCase();
        include =
          include &&
          (b.firstName.toLowerCase().includes(search) ||
            b.surname.toLowerCase().includes(search));
      }

      // Phone filter
      if (filters.phone) {
        const search = filters.phone.toLowerCase();
        include = include && b.phone.toLowerCase().includes(search);
      }

      // OTA filter
      if (filters.ota) {
        const search = filters.ota.toLowerCase();
        include = include && b.ota.toLowerCase().includes(search);
      }

      return include;
    });

    setFilteredBookings(filtered);
  };

  // Update input filters
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Reapply filters whenever any input changes
  useEffect(() => {
    applyFilters();
  }, [filters]);

  const formatPhone = (phone) => {
    // Remove everything except numbers
    const digits = phone.replace(/\D/g, "");

    // If Indian number with 12 digits (+91xxxxxxxxxx)
    if (digits.length === 12 && digits.startsWith("91")) {
      return `+91-${digits.substring(2, 7)}-${digits.substring(7)}`;
    }

    // If Indian number without +91 (10 digits)
    if (digits.length === 10) {
      return `${digits.substring(0, 5)}-${digits.substring(5)}`;
    }

    // Fallback
    return phone;
  };

  return (
    <div className="todays-container">
      {/* PAGE HEADER */}
      <div className="todays-header">
        <div>
          <h2 className="page-title">{UI_TEXT.ALL_BOOKINGS_TITLE}</h2>
          <p className="page-subtitle">{UI_TEXT.ALL_BOOKINGS_SUBTITLE}</p>
        </div>
        <button className="btn-walkin">
          <FiPlus className="walkin-icon" />
          {UI_TEXT.BUTTON_CREATE_WALKIN}
        </button>
      </div>

      {/* Filters Component  */}

      <div className="filters-wrapper">
        <div className="filters-row">
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_GUEST_NAME}
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            className="filter-input"
          />
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_PHONE}
            name="phone"
            value={filters.phone}
            onChange={handleInputChange}
            className="filter-input"
          />
          <input
            type="text"
            placeholder={UI_TEXT.FILTER_OTA}
            name="ota"
            value={filters.ota}
            onChange={handleInputChange}
            className="filter-input"
          />
        </div>
      </div>

      <div className="date-filter-wrapper">
        <DateFilter onApply={handleDateFilterApply} />
        <div className="export-buttons">
          <button className="export-btn">
            <FiDownload className="export-icon" />
            Export PDF
          </button>

          <button className="export-btn">
            <FiDownload className="export-icon" />
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
            // No-show condition
            if (!row.checkedIn && row.date.isBefore(dayjs(), "day")) {
              return (
                <button className="link status-btn no-show">
                  <FaCircle className="status-icon red" />
                  {UI_TEXT.BUTTON_NO_SHOW}
                </button>
              );
            }

            // Start check-in
            if (!row.checkedIn) {
              return (
                <button className="link status-btn">
                  <FaCircle className="status-icon yellow" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </button>
              );
            }

            // View details (checked-in)
            return (
              <button className="link status-btn">
                <FaCircle className="status-icon green" />
                {UI_TEXT.BUTTON_VIEW_CHECKIN_DETAILS}
              </button>
            );
          },
        }}
      />
    </div>
  );
}
