import { useState, useEffect, useMemo } from "react";
import { UI_TEXT } from "../constants/ui.js";
import CheckInForm from "../components/CheckInForm.jsx";
import DateFilter from "../components/DateFilter.jsx";
import { useSearch } from "../context/SearchContext.jsx";

// Mock data - Replace with API call later
const MOCK_BOOKINGS = [
  {
    id: "BK001",
    bookingId: "BK-2024-001",
    guestName: "John Doe",
    numberOfGuests: 2,
    status: "checked_in",
    checkInDate: new Date(2024, 10, 15), // Nov 15, 2024
  },
  {
    id: "BK002",
    bookingId: "BK-2024-002",
    guestName: "Jane Smith",
    numberOfGuests: 4,
    status: "not_checked_in",
    checkInDate: new Date(2024, 10, 20), // Nov 20, 2024
  },
  {
    id: "BK003",
    bookingId: "BK-2024-003",
    guestName: "Robert Johnson",
    numberOfGuests: 1,
    status: "not_checked_in",
    checkInDate: new Date(2024, 10, 25), // Nov 25, 2024
  },
  {
    id: "BK004",
    bookingId: "BK-2024-004",
    guestName: "Emily Davis",
    numberOfGuests: 3,
    status: "checked_in",
    checkInDate: new Date(2024, 10, 30), // Nov 30, 2024
  },
  {
    id: "BK005",
    bookingId: "BK-2024-005",
    guestName: "Michael Brown",
    numberOfGuests: 2,
    status: "not_checked_in",
    checkInDate: new Date(2024, 11, 5), // Dec 5, 2024
  },
];

export default function Bookings() {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const { searchTerm, setIsSearchEnabled } = useSearch();

  // Enable search when component mounts
  useEffect(() => {
    setIsSearchEnabled(true);
    return () => {
      setIsSearchEnabled(false);
    };
  }, [setIsSearchEnabled]);

  // Filter bookings by guestName (case-insensitive) and date filter
  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((booking) =>
        booking.guestName.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filter
    if (dateFilter && dateFilter.field === "checkInDate") {
      result = result.filter((booking) => {
        if (!booking.checkInDate) return false;
        const bookingDate = new Date(booking.checkInDate);
        bookingDate.setHours(0, 0, 0, 0);

        if (dateFilter.condition === "is after") {
          const filterDate = new Date(dateFilter.dateValue);
          filterDate.setHours(0, 0, 0, 0);
          return bookingDate > filterDate;
        } else if (dateFilter.condition === "is before") {
          const filterDate = new Date(dateFilter.dateValue);
          filterDate.setHours(0, 0, 0, 0);
          return bookingDate < filterDate;
        } else if (dateFilter.condition === "is equal to") {
          const filterDate = new Date(dateFilter.dateValue);
          filterDate.setHours(0, 0, 0, 0);
          return (
            bookingDate.getTime() === filterDate.getTime()
          );
        } else if (dateFilter.condition === "is on or after") {
          const filterDate = new Date(dateFilter.dateValue);
          filterDate.setHours(0, 0, 0, 0);
          return bookingDate >= filterDate;
        } else if (dateFilter.condition === "is before or on") {
          const filterDate = new Date(dateFilter.dateValue);
          filterDate.setHours(0, 0, 0, 0);
          return bookingDate <= filterDate;
        } else if (dateFilter.condition === "is in the last") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysAgo = new Date(today);
          daysAgo.setDate(today.getDate() - dateFilter.daysValue);
          return bookingDate >= daysAgo && bookingDate <= today;
        } else if (dateFilter.condition === "is between") {
          const fromDate = new Date(dateFilter.fromDate);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateFilter.toDate);
          toDate.setHours(0, 0, 0, 0);
          return bookingDate >= fromDate && bookingDate <= toDate;
        }

        return true;
      });
    }

    return result;
  }, [bookings, searchTerm, dateFilter]);

  const handleViewDetails = (bookingId) => {
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setIsModalOpen(true);
    }
  };

  const handleCheckInComplete = (bookingId) => {
    // Update booking status to checked_in
    setBookings((prev) =>
      prev.map((booking) =>
        booking.bookingId === bookingId || booking.id === bookingId
          ? { ...booking, status: "checked_in" }
          : booking
      )
    );
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="h-page-title">{UI_TEXT.BOOKINGS_TITLE}</h1>
        <p className="text-muted page-subtitle" >{UI_TEXT.BOOKINGS_SUBTITLE}</p>
      </div>

      <div className="date-filter-wrapper">
          <DateFilter
        label="Check-in date"
        field="checkInDate"
        value={dateFilter}
        onChange={setDateFilter}
      />
      </div>

      

      <div className="card">
        <div className="card-header">
          <h2 className="h-card-title">{UI_TEXT.BOOKINGS_LIST_TITLE}</h2>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-body text-muted empty-state">
            {UI_TEXT.BOOKINGS_EMPTY}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{UI_TEXT.BOOKINGS_COLUMN_BOOKING_ID}</th>
                  <th>{UI_TEXT.BOOKINGS_COLUMN_GUEST_NAME}</th>
                  <th className="table-num table-num-column">{UI_TEXT.BOOKINGS_COLUMN_NUMBER_OF_GUESTS}</th>
                  <th className="table-actions-column"></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <span className="text-body booking-id">
                        {booking.bookingId}
                      </span>
                    </td>
                    <td>
                      <span className="text-body">{booking.guestName}</span>
                    </td>
                    <td className="table-num table-num-column">
                      <span className="text-body">{booking.numberOfGuests}</span>
                    </td>
                    <td style={{ 'width':'140px','white-space':'no-wrap'}}>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => handleViewDetails(booking.bookingId)}
                        aria-label={`${UI_TEXT.BOOKINGS_VIEW_DETAILS} ${booking.bookingId}`}
                      >
                        {UI_TEXT.BOOKINGS_CHECK_IN}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CheckInForm
          booking={selectedBooking}
          isModal={true}
          onClose={handleCloseModal}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
    </div>
  );
}

