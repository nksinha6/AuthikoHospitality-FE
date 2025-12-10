import { useMemo, useState } from "react";
import { UI_TEXT } from "../constants/ui.js";
import "../styles/TodaysBookings.css";

// Utility: Format today's date in Indian format
const getTodayDateFormatted = () => {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Utility: Apply all active filters to bookings
const filterBookings = (bookings, filters) => {
  const guestQuery = filters.guest.toLowerCase();
  const otaQuery = filters.ota.toLowerCase();

  return bookings.filter((b) => {
    const matchesGuest = b.leadGuest.toLowerCase().includes(guestQuery);

    const matchesPhone = b.phone.includes(filters.phone);

    const matchesOta = b.ota.toLowerCase().includes(otaQuery);

    const matchesStatus =
      filters.status === ""
        ? true
        : filters.status === "checked-in"
        ? b.checkedIn === true
        : b.checkedIn === false;

    return matchesGuest && matchesPhone && matchesOta && matchesStatus;
  });
};

export default function TodaysBookings() {
  const today = getTodayDateFormatted();

  // State: Filter inputs
  const [filters, setFilters] = useState({
    guest: "",
    phone: "",
    ota: "",
    status: "",
  });

  // Dummy Bookings Data (Static)
  const bookings = useMemo(
    () => [
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
        date: today,
        bookingId: "BK202503",
        ota: "Agoda",
        leadGuest: "Ravi Verma",
        firstName: "Ravi",
        surname: "Verma",
        phone: "+91-9123456780",
        guests: 1,
        adults: 1,
        minors: 0,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202504",
        ota: "Airbnb",
        leadGuest: "Sara Fernandes",
        firstName: "Sara",
        surname: "Fernandes",
        phone: "+91-9001122334",
        guests: 4,
        adults: 2,
        minors: 2,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202505",
        ota: "GoIbibo",
        leadGuest: "Kunal Singh",
        firstName: "Kunal",
        surname: "Singh",
        phone: "+91-9090909090",
        guests: 2,
        adults: 1,
        minors: 1,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202506",
        ota: "Cleartrip",
        leadGuest: "Nisha Patel",
        firstName: "Nisha",
        surname: "Patel",
        phone: "+91-9801234567",
        guests: 3,
        adults: 3,
        minors: 0,
        checkedIn: true,
      },
      {
        date: today,
        bookingId: "BK202507",
        ota: "MakeMyTrip",
        leadGuest: "Aditya Rao",
        firstName: "Aditya",
        surname: "Rao",
        phone: "+91-9554433221",
        guests: 1,
        adults: 1,
        minors: 0,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202508",
        ota: "Booking.com",
        leadGuest: "Ishita Malhotra",
        firstName: "Ishita",
        surname: "Malhotra",
        phone: "+91-9345678123",
        guests: 5,
        adults: 2,
        minors: 3,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202509",
        ota: "Agoda",
        leadGuest: "George Mathew",
        firstName: "George",
        surname: "Mathew",
        phone: "+91-9223344556",
        guests: 2,
        adults: 2,
        minors: 0,
        checkedIn: true,
      },
      {
        date: today,
        bookingId: "BK202510",
        ota: "Airbnb",
        leadGuest: "Pooja Nair",
        firstName: "Pooja",
        surname: "Nair",
        phone: "+91-9667788990",
        guests: 3,
        adults: 2,
        minors: 1,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202511",
        ota: "GoIbibo",
        leadGuest: "Varun Kapoor",
        firstName: "Varun",
        surname: "Kapoor",
        phone: "+91-9145236780",
        guests: 2,
        adults: 2,
        minors: 0,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202512",
        ota: "Cleartrip",
        leadGuest: "Angela D’Souza",
        firstName: "Angela",
        surname: "D’Souza",
        phone: "+91-9012345678",
        guests: 4,
        adults: 3,
        minors: 1,
        checkedIn: true,
      },
      {
        date: today,
        bookingId: "BK202513",
        ota: "MakeMyTrip",
        leadGuest: "Harish Kumar",
        firstName: "Harish",
        surname: "Kumar",
        phone: "+91-9778899001",
        guests: 1,
        adults: 1,
        minors: 0,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202514",
        ota: "Agoda",
        leadGuest: "Lina Kurien",
        firstName: "Lina",
        surname: "Kurien",
        phone: "+91-9887766554",
        guests: 6,
        adults: 4,
        minors: 2,
        checkedIn: false,
      },
      {
        date: today,
        bookingId: "BK202515",
        ota: "Booking.com",
        leadGuest: "Rahul Deshpande",
        firstName: "Rahul",
        surname: "Deshpande",
        phone: "+91-9234567891",
        guests: 2,
        adults: 1,
        minors: 1,
        checkedIn: true,
      },
      {
        date: today,
        bookingId: "BK202516",
        ota: "Airbnb",
        leadGuest: "Sanya Gill",
        firstName: "Sanya",
        surname: "Gill",
        phone: "+91-9004455663",
        guests: 3,
        adults: 2,
        minors: 1,
        checkedIn: false,
      },
    ],
    [today]
  );

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters]
  );

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="todays-container">
      {/* PAGE HEADER */}
      <header className="todays-header">
        <div>
          <h2 className="page-title">{UI_TEXT.TODAYS_TITLE}</h2>
          <p className="page-subtitle">
            {UI_TEXT.TODAYS_SUBTITLE} | <strong>{today}</strong>
          </p>
        </div>

        <button className="btn-walkin">{UI_TEXT.BUTTON_CREATE_WALKIN}</button>
      </header>

      {/* FILTERS INPUT ROW */}
      <div className="filter-row">
        <input
          type="text"
          placeholder={UI_TEXT.FILTER_GUEST_NAME}
          value={filters.guest}
          onChange={(e) => updateFilter("guest", e.target.value)}
        />

        <input
          type="text"
          placeholder={UI_TEXT.FILTER_PHONE}
          value={filters.phone}
          onChange={(e) => updateFilter("phone", e.target.value)}
        />

        <input
          type="text"
          placeholder={UI_TEXT.FILTER_OTA}
          value={filters.ota}
          onChange={(e) => updateFilter("ota", e.target.value)}
        />

        <select
          className="filter-input"
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">{UI_TEXT.FILTER_STATUS}</option>
          <option value="checked-in">Checked In</option>
          <option value="not-checked-in">Not Checked In</option>
        </select>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{UI_TEXT.TABLE_DATE}</th>
              <th>{UI_TEXT.TABLE_BOOKING_ID}</th>
              <th>{UI_TEXT.TABLE_OTA}</th>
              <th>{UI_TEXT.TABLE_FIRST_NAME}</th>
              <th>{UI_TEXT.TABLE_SURNAME}</th>
              <th>{UI_TEXT.TABLE_PHONE}</th>
              <th>{UI_TEXT.TABLE_NUM_GUESTS}</th>
              <th>{UI_TEXT.TABLE_STATUS}</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No bookings match your filters.
                </td>
              </tr>
            ) : (
              filteredBookings.map((item) => (
                <tr key={item.bookingId}>
                  <td>{item.date}</td>
                  <td>{item.bookingId}</td>
                  <td>{item.ota}</td>
                  <td>{item.firstName}</td>
                  <td>{item.surname}</td>
                  <td>{item.phone}</td>
                  <td>
                    {item.adults} Adults
                    {item.minors > 0 && `, ${item.minors} Minors`}
                  </td>
                  <td className="status-cell">
                    {!item.checkedIn ? (
                      <button className="link">
                        {UI_TEXT.BUTTON_START_CHECKIN}
                      </button>
                    ) : (
                      <button className="link">
                        {UI_TEXT.BUTTON_VIEW_CHECKIN_DETAILS}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
