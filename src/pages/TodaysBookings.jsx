import { useMemo, useState, useEffect } from "react";
import { UI_TEXT } from "../constants/ui.js";
import { FiPlus } from "react-icons/fi";
import { FaCircle } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import UniversalTable from "../components/UniversalTable.jsx";
import Loader from "../components/Loader.jsx";

const getTodayDateFormatted = () => {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFullHeaderDate = () => {
  const date = new Date();
  const dayName = date.toLocaleDateString("en-IN", { weekday: "long" });
  const shortDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  return `${dayName} / ${shortDate}`;
};

const formatShortDate = (d) => {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const today = getTodayDateFormatted();

  const [filters, setFilters] = useState({
    guest: "",
    phone: "",
    ota: "",
    status: "not-checked-in",
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockBookings = [
          {
            date: today,
            bookingId: "BK202503",
            ota: "MakeMyTrip",
            leadGuest: "Rahul Verma",
            firstName: "Rahul",
            surname: "Verma",
            phone: "+91-9123456780",
            guests: 4,
            adults: 3,
            minors: 1,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202504",
            ota: "Agoda",
            leadGuest: "Sneha Patel",
            firstName: "Sneha",
            surname: "Patel",
            phone: "+91-9876501234",
            guests: 2,
            adults: 2,
            minors: 0,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202505",
            ota: "Booking.com",
            leadGuest: "Amit Shah",
            firstName: "Amit",
            surname: "Shah",
            phone: "+91-9001122334",
            guests: 3,
            adults: 2,
            minors: 1,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202506",
            ota: "Goibibo",
            leadGuest: "Pooja Singh",
            firstName: "Pooja",
            surname: "Singh",
            phone: "+91-9887766554",
            guests: 1,
            adults: 1,
            minors: 0,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202507",
            ota: "MakeMyTrip",
            leadGuest: "Karan Malhotra",
            firstName: "Karan",
            surname: "Malhotra",
            phone: "+91-9765432109",
            guests: 5,
            adults: 4,
            minors: 1,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202508",
            ota: "Booking.com",
            leadGuest: "Neha Joshi",
            firstName: "Neha",
            surname: "Joshi",
            phone: "+91-9876123456",
            guests: 2,
            adults: 1,
            minors: 1,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202509",
            ota: "Agoda",
            leadGuest: "Suresh Kumar",
            firstName: "Suresh",
            surname: "Kumar",
            phone: "+91-9012345678",
            guests: 3,
            adults: 3,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202510",
            ota: "Goibibo",
            leadGuest: "Ritika Arora",
            firstName: "Ritika",
            surname: "Arora",
            phone: "+91-9345678123",
            guests: 4,
            adults: 2,
            minors: 2,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202511",
            ota: "MakeMyTrip",
            leadGuest: "Vikas Yadav",
            firstName: "Vikas",
            surname: "Yadav",
            phone: "+91-9988112233",
            guests: 2,
            adults: 2,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202512",
            ota: "Booking.com",
            leadGuest: "Anjali Desai",
            firstName: "Anjali",
            surname: "Desai",
            phone: "+91-9877012345",
            guests: 3,
            adults: 2,
            minors: 1,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202513",
            ota: "Agoda",
            leadGuest: "Rohit Jain",
            firstName: "Rohit",
            surname: "Jain",
            phone: "+91-9898989898",
            guests: 1,
            adults: 1,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202514",
            ota: "Goibibo",
            leadGuest: "Nisha Kapoor",
            firstName: "Nisha",
            surname: "Kapoor",
            phone: "+91-9123987654",
            guests: 4,
            adults: 3,
            minors: 1,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202515",
            ota: "MakeMyTrip",
            leadGuest: "Manish Gupta",
            firstName: "Manish",
            surname: "Gupta",
            phone: "+91-9009009009",
            guests: 2,
            adults: 2,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202516",
            ota: "Booking.com",
            leadGuest: "Swati Mishra",
            firstName: "Swati",
            surname: "Mishra",
            phone: "+91-9765123487",
            guests: 3,
            adults: 2,
            minors: 1,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202517",
            ota: "Agoda",
            leadGuest: "Deepak Rana",
            firstName: "Deepak",
            surname: "Rana",
            phone: "+91-9876547890",
            guests: 5,
            adults: 4,
            minors: 1,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202518",
            ota: "Goibibo",
            leadGuest: "Isha Khanna",
            firstName: "Isha",
            surname: "Khanna",
            phone: "+91-9011223344",
            guests: 2,
            adults: 1,
            minors: 1,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202519",
            ota: "MakeMyTrip",
            leadGuest: "Sanjay Bansal",
            firstName: "Sanjay",
            surname: "Bansal",
            phone: "+91-9888771234",
            guests: 3,
            adults: 3,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202520",
            ota: "Booking.com",
            leadGuest: "Kavita Nair",
            firstName: "Kavita",
            surname: "Nair",
            phone: "+91-9823456712",
            guests: 4,
            adults: 2,
            minors: 2,
            checkedIn: false,
          },
          {
            date: today,
            bookingId: "BK202521",
            ota: "Agoda",
            leadGuest: "Pranav Kulkarni",
            firstName: "Pranav",
            surname: "Kulkarni",
            phone: "+91-9090909090",
            guests: 1,
            adults: 1,
            minors: 0,
            checkedIn: true,
          },
          {
            date: today,
            bookingId: "BK202522",
            ota: "Goibibo",
            leadGuest: "Ayesha Khan",
            firstName: "Ayesha",
            surname: "Khan",
            phone: "+91-9871234567",
            guests: 3,
            adults: 2,
            minors: 1,
            checkedIn: false,
          },
        ];

        setBookings(mockBookings);
        setError(null);
      } catch {
        setError("Failed to load today's bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters]
  );

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

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
            className="bg-[#1b3631] text-white px-4 py-2 rounded hover:bg-[#1b3631]/90"
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

        <button className="flex items-center gap-2 bg-[#1b3631] text-white px-4 py-2 rounded-lg hover:bg-[#1b3631]/90 cursor-pointer">
          <FiPlus className="text-lg" />
          {UI_TEXT.BUTTON_CREATE_WALKIN}
        </button>
      </div>

      {/* FILTERS INPUT ROW - FIRST LINE */}
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

      {/* FILTERS INPUT ROW - SECOND LINE */}
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
        <div className="flex gap-3 ">
          <button className="flex text-sm items-center gap-2 px-4 py-2 border! border-gray-300! rounded-lg hover:bg-gray-50 cursor-pointer">
            <FiDownload />
            Export PDF
          </button>

          <button className="flex text-sm items-center gap-2 px-4 py-2 border! border-gray-300! rounded-lg hover:bg-gray-50 cursor-pointer">
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
          checkedIn: (_, row) => {
            if (!row.checkedIn) {
              return (
                <div className="flex items-center gap-2 text-gray-600">
                  <FaCircle className="text-yellow-500 text-xs" />
                  {UI_TEXT.BUTTON_START_CHECKIN}
                </div>
              );
            }

            return (
              <div className="flex items-center gap-2 text-gray-600">
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
