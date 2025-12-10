// import React, { useState } from "react";
// import { UI_TEXT } from "../constants/ui.js";
// import DateFilter from "../components/DateHourFilter.jsx";
// import "../styles/TodaysBookings.css";
// import dayjs from "dayjs";

// export default function AllGuests() {
//   const today = dayjs();

//   const bookings = [
//     {
//       date: today,
//       bookingId: "BK202501",
//       ota: "MakeMyTrip",
//       leadGuest: "Arjun Mehta",
//       firstName: "Arjun",
//       surname: "Mehta",
//       phone: "+91-9876543210",
//       guests: 3,
//       adults: 2,
//       minors: 1,
//       checkedIn: false,
//     },
//     {
//       date: today,
//       bookingId: "BK202502",
//       ota: "Booking.com",
//       leadGuest: "Meera Sharma",
//       firstName: "Meera",
//       surname: "Sharma",
//       phone: "+91-9988776655",
//       guests: 2,
//       adults: 2,
//       minors: 0,
//       checkedIn: true,
//     },
//     {
//       date: dayjs("2025-12-12"),
//       bookingId: "BK202503",
//       ota: "Goibibo",
//       leadGuest: "Rohan Gupta",
//       firstName: "Rohan",
//       surname: "Gupta",
//       phone: "+91-9123456780",
//       guests: 1,
//       adults: 1,
//       minors: 0,
//       checkedIn: false,
//     },
//     {
//       date: dayjs("2025-12-14"),
//       bookingId: "BK202504",
//       ota: "Agoda",
//       leadGuest: "Sneha Kulkarni",
//       firstName: "Sneha",
//       surname: "Kulkarni",
//       phone: "+91-9001122334",
//       guests: 4,
//       adults: 2,
//       minors: 2,
//       checkedIn: true,
//     },
//     {
//       date: dayjs("2025-12-15"),
//       bookingId: "BK202505",
//       ota: "Expedia",
//       leadGuest: "Sameer Nair",
//       firstName: "Sameer",
//       surname: "Nair",
//       phone: "+91-9334432110",
//       guests: 3,
//       adults: 3,
//       minors: 0,
//       checkedIn: false,
//     },
//     {
//       date: dayjs("2025-12-15"),
//       bookingId: "BK202506",
//       ota: "Airbnb",
//       leadGuest: "Kritika Jain",
//       firstName: "Kritika",
//       surname: "Jain",
//       phone: "+91-7890023456",
//       guests: 2,
//       adults: 2,
//       minors: 0,
//       checkedIn: true,
//     },
//     {
//       date: dayjs("2025-12-17"),
//       bookingId: "BK202507",
//       ota: "MakeMyTrip",
//       leadGuest: "Vishal Patel",
//       firstName: "Vishal",
//       surname: "Patel",
//       phone: "+91-9988001122",
//       guests: 5,
//       adults: 3,
//       minors: 2,
//       checkedIn: false,
//     },
//     {
//       date: dayjs("2025-12-18"),
//       bookingId: "BK202508",
//       ota: "Booking.com",
//       leadGuest: "Aarav Khanna",
//       firstName: "Aarav",
//       surname: "Khanna",
//       phone: "+91-9090903030",
//       guests: 2,
//       adults: 2,
//       minors: 0,
//       checkedIn: true,
//     },
//   ];

//   const normalizedBookings = bookings.map((b) => ({
//     ...b,
//     date: dayjs.isDayjs(b.date)
//       ? b.date.startOf("day")
//       : dayjs(b.date).startOf("day"),
//   }));

//   const [filteredBookings, setFilteredBookings] = useState(normalizedBookings);

//   const handleDateFilterApply = ({
//     condition,
//     selectedDate,
//     startDate,
//     endDate,
//     value,
//     timeUnit,
//   }) => {
//     const filtered = normalizedBookings.filter((b) => {
//       const bookingDate = b.date;

//       const selected = selectedDate ? dayjs(selectedDate).startOf("day") : null;
//       const start = startDate ? dayjs(startDate).startOf("day") : null;
//       const end = endDate ? dayjs(endDate).endOf("day") : null;
//       const now = dayjs().startOf("day");

//       switch (condition) {
//         case "is between":
//           if (!start || !end) return false;
//           return (
//             (bookingDate.isAfter(start) || bookingDate.isSame(start, "day")) &&
//             (bookingDate.isBefore(end) || bookingDate.isSame(end, "day"))
//           );

//         case "is after":
//         case "is on or after":
//           if (!selected) return false;
//           return (
//             bookingDate.isAfter(selected) || bookingDate.isSame(selected, "day")
//           );

//         case "is before":
//         case "is before or on":
//           if (!selected) return false;
//           return (
//             bookingDate.isBefore(selected) ||
//             bookingDate.isSame(selected, "day")
//           );

//         case "is equal to":
//           return bookingDate.isSame(selected, "day");

//         case "is in the last": {
//           const unitValue = parseInt(value) || 0;
//           // normalize time unit to singular form accepted by dayjs (e.g. "months" -> "month")
//           const unit = (timeUnit || "days").replace(/s$/i, "");
//           const lastStart = now.subtract(unitValue, unit); // unit is 'day', 'month', 'year', etc.
//           return (
//             (bookingDate.isAfter(lastStart) ||
//               bookingDate.isSame(lastStart, "day")) &&
//             (bookingDate.isBefore(now) || bookingDate.isSame(now, "day"))
//           );
//         }

//         default:
//           return true;
//       }
//     });

//     setFilteredBookings(filtered);
//   };

//   return (
//     <div className="todays-container">
//       {/* PAGE HEADER */}
//       <div className="todays-header">
//         <div>
//           <h2 className="page-title">{UI_TEXT.ALL_BOOKINGS_TITLE}</h2>
//           <p className="page-subtitle">{UI_TEXT.ALL_BOOKINGS_SUBTITLE}</p>
//         </div>
//         <button className="btn-walkin">{UI_TEXT.BUTTON_CREATE_WALKIN}</button>
//       </div>

//       {/* DATE FILTER COMPONENT */}
//       <DateFilter onApply={handleDateFilterApply} />

//       {/* BOOKINGS TABLE */}
//       <div className="table-wrapper">
//         <table>
//           <thead>
//             <tr>
//               <th>{UI_TEXT.TABLE_DATE}</th>
//               <th>{UI_TEXT.TABLE_BOOKING_ID}</th>
//               <th>{UI_TEXT.TABLE_OTA}</th>
//               <th>{UI_TEXT.TABLE_FIRST_NAME}</th>
//               <th>{UI_TEXT.TABLE_SURNAME}</th>
//               <th>{UI_TEXT.TABLE_PHONE}</th>
//               <th>{UI_TEXT.TABLE_NUM_GUESTS}</th>
//               <th>{UI_TEXT.TABLE_STATUS}</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredBookings.map((item, idx) => (
//               <tr key={idx}>
//                 <td>{item.date.format("DD MMM YYYY")}</td>
//                 <td>{item.bookingId}</td>
//                 <td>{item.ota}</td>
//                 <td>{item.firstName}</td>
//                 <td>{item.surname}</td>
//                 <td>{item.phone}</td>
//                 <td>
//                   {item.adults} Adults
//                   {item.minors > 0 && `, ${item.minors} Minors`}
//                 </td>
//                 <td className="status-cell">
//                   {!item.checkedIn ? (
//                     <a className="link">{UI_TEXT.BUTTON_START_CHECKIN}</a>
//                   ) : (
//                     <a className="link">
//                       {UI_TEXT.BUTTON_VIEW_CHECKIN_DETAILS}
//                     </a>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

//-------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { UI_TEXT } from "../constants/ui.js";
import DateFilter from "../components/DateHourFilter.jsx";
import "../styles/TodaysBookings.css";
import dayjs from "dayjs";

export default function AllGuests() {
  const today = dayjs();

  const bookings = [
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

  return (
    <div className="todays-container">
      {/* PAGE HEADER */}
      <div className="todays-header">
        <div>
          <h2 className="page-title">{UI_TEXT.ALL_BOOKINGS_TITLE}</h2>
          <p className="page-subtitle">{UI_TEXT.ALL_BOOKINGS_SUBTITLE}</p>
        </div>
        <button className="btn-walkin">{UI_TEXT.BUTTON_CREATE_WALKIN}</button>
      </div>

      {/* FILTER INPUTS */}
      {/* <div className="filter-row">
        <input
          type="text"
          placeholder={UI_TEXT.FILTER_GUEST_NAME}
          name="name"
          value={filters.name}
          onChange={handleInputChange}
        />
        <input
          type="text"
          placeholder={UI_TEXT.FILTER_PHONE}
          name="phone"
          value={filters.phone}
          onChange={handleInputChange}
        />
        <input
          type="text"
          placeholder={UI_TEXT.FILTER_OTA}
          name="ota"
          value={filters.ota}
          onChange={handleInputChange}
        />
      </div> */}

      {/* DATE FILTER COMPONENT */}
      {/* <DateFilter onApply={handleDateFilterApply} /> */}

      <div className="filters-wrapper">
        {/* DATE FILTER COMPONENT */}
        <div className="date-filter-wrapper">
          <DateFilter onApply={handleDateFilterApply} />
        </div>

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
            {filteredBookings.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date.format("DD MMM YYYY")}</td>
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
                    <a className="link">{UI_TEXT.BUTTON_START_CHECKIN}</a>
                  ) : (
                    <a className="link">
                      {UI_TEXT.BUTTON_VIEW_CHECKIN_DETAILS}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
