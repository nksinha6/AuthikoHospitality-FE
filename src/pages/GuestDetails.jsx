import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { FiDownload } from "react-icons/fi";
import UniversalTable from "../components/UniversalTable.jsx";
import DateFilter from "../components/DateHourFilter.jsx";
import GuestDetailsModal from "../components/GuestDetailsModal.jsx";
import { formatShortDate, formatPhone } from "../utility/bookingUtils.js";
import { exportToPDF, exportToExcel } from "../utility/exportUtils";

/* ---------------- DUMMY DATA ---------------- */
const DUMMY_GUESTS = [
  {
    date: "2026-01-18",
    time: "10:30 AM",
    bookingId: "BK001",
    firstName: "Hafiz",
    lastName: "Shaikh",
    phone: "919586023883",
    city: "Mumbai",
    state: "Maharashtra",
  },
  {
    date: "2026-01-19",
    time: "02:15 PM",
    bookingId: "BK002",
    firstName: "Ayaan",
    lastName: "Khan",
    phone: "919876543210",
    city: "Delhi",
    state: "Delhi",
  },
  {
    date: "2026-01-20",
    time: "11:00 AM",
    bookingId: "BK003",
    firstName: "Sara",
    lastName: "Ali",
    phone: "919123456789",
    city: "Bengaluru",
    state: "Karnataka",
  },
];

export default function GuestDetails() {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [dateFilter, setDateFilter] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const GUEST_COLUMNS = [
    { key: "dateTime", label: "Date / Time" },
    { key: "bookingId", label: "Booking ID" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "phone", label: "Phone Number" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
  ];

  const exportData = filteredGuests.map((g) => ({
    ...g,
    dateTime: `${formatShortDate(g.date)} • ${g.time}`,
  }));

  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
  });

  /* ---------------- LOAD DUMMY DATA ---------------- */
  useEffect(() => {
    setGuests(DUMMY_GUESTS);
  }, []);

  /* ---------------- APPLY FILTERS ---------------- */
  const applyAllFilters = useCallback(() => {
    let data = [...guests];

    // Name filter
    if (filters.name) {
      const q = filters.name.toLowerCase();
      data = data.filter(
        (g) =>
          g.firstName.toLowerCase().includes(q) ||
          g.lastName.toLowerCase().includes(q),
      );
    }

    // Phone filter
    if (filters.phone) {
      data = data.filter((g) => g.phone.includes(filters.phone));
    }

    // City filter
    if (filters.city) {
      data = data.filter((g) =>
        g.city.toLowerCase().includes(filters.city.toLowerCase()),
      );
    }

    // State filter
    if (filters.state) {
      data = data.filter((g) =>
        g.state.toLowerCase().includes(filters.state.toLowerCase()),
      );
    }

    // Date filter
    if (dateFilter?.selectedDate) {
      const selected = dayjs(dateFilter.selectedDate).startOf("day");
      data = data.filter((g) => dayjs(g.date).isSame(selected, "day"));
    }

    setFilteredGuests(data);
  }, [guests, filters, dateFilter]);

  useEffect(() => {
    applyAllFilters();
  }, [applyAllFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand">Guest Details</h2>
          <p className="text-gray-600 mt-1">
            View and manage guest information
          </p>
        </div>
      </div>

      {/* FILTERS */}
      {/* FILTERS */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Guest Name"
            value={filters.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={filters.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
          />

          <input
            type="text"
            name="city"
            placeholder="City"
            value={filters.city}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
          />

          <input
            type="text"
            name="state"
            placeholder="State"
            value={filters.state}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <DateFilter onApply={setDateFilter} />
        <div className="flex align-center justify-end gap-3">
          <button
            onClick={() =>
              exportToPDF({
                fileName: "Guest_Details",
                columns: GUEST_COLUMNS,
                data: exportData,
              })
            }
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg"
          >
            <FiDownload />
            Export PDF
          </button>

          <button
            onClick={() =>
              exportToExcel({
                fileName: "Guest_Details",
                columns: GUEST_COLUMNS,
                data: exportData,
              })
            }
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg"
          >
            <FiDownload />
            Export EXL
          </button>
        </div>
      </div>

      {/* TABLE */}
      <UniversalTable
        columns={[
          { key: "dateTime", label: "Date / Time" },
          { key: "bookingId", label: "Booking ID" },
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Last Name" },
          { key: "phone", label: "Phone Number" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "actions", label: "More Details" },
        ]}
        data={filteredGuests}
        emptyMessage="No guests found."
        format={{
          dateTime: (_, row) => `${formatShortDate(row.date)} • ${row.time}`,
          phone: (p) => formatPhone(p),
          actions: (_, row) => (
            <button 
              className="text-brand text-sm font-medium hover:underline"
              onClick={() => {
                setSelectedGuest(row);
                setShowModal(true);
              }}
            >
              View
            </button>
          ),
        }}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal 
        show={showModal} 
        handleClose={() => setShowModal(false)} 
        guest={selectedGuest} 
      />
    </div>
  );
}
