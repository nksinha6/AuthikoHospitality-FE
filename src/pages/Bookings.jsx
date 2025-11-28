import { useState } from "react";
import { UI_TEXT } from "../constants/ui.js";
import CheckInModal from "../components/CheckInModal.jsx";

// Mock data - Replace with API call later
const MOCK_BOOKINGS = [
  {
    id: "BK001",
    bookingId: "BK-2024-001",
    guestName: "John Doe",
    numberOfGuests: 2,
    status: "checked_in",
  },
  {
    id: "BK002",
    bookingId: "BK-2024-002",
    guestName: "Jane Smith",
    numberOfGuests: 4,
    status: "not_checked_in",
  },
  {
    id: "BK003",
    bookingId: "BK-2024-003",
    guestName: "Robert Johnson",
    numberOfGuests: 1,
    status: "not_checked_in",
  },
  {
    id: "BK004",
    bookingId: "BK-2024-004",
    guestName: "Emily Davis",
    numberOfGuests: 3,
    status: "checked_in",
  },
  {
    id: "BK005",
    bookingId: "BK-2024-005",
    guestName: "Michael Brown",
    numberOfGuests: 2,
    status: "not_checked_in",
  },
];

export default function Bookings() {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      <div className="card">
        <div className="card-header">
          <h2 className="h-card-title">{UI_TEXT.BOOKINGS_LIST_TITLE}</h2>
        </div>

        {bookings.length === 0 ? (
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
                  <th>{UI_TEXT.BOOKINGS_COLUMN_STATUS}</th>
                  <th className="table-actions-column"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
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
                    <td style={{ 'width':'140px','white-space':'no-wrap'}} >
                      <span className={`tag ${booking.status === "checked_in" ? "tag--strong" : ""}`}>
                        {booking.status === "checked_in" ? UI_TEXT.BOOKINGS_STATUS_CHECKED_IN : UI_TEXT.BOOKINGS_STATUS_NOT_CHECKED_IN}
                      </span>
                    </td>
                    <td style={{ 'width':'140px','white-space':'no-wrap'}}>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => handleViewDetails(booking.bookingId)}
                        aria-label={`${UI_TEXT.BOOKINGS_VIEW_DETAILS} ${booking.bookingId}`}
                      >
                        {UI_TEXT.BOOKINGS_VIEW_DETAILS}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CheckInModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCheckInComplete={handleCheckInComplete}
      />
    </div>
  );
}

