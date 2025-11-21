import { useState } from "react";

export default function CheckIns() {
  const [formState, setFormState] = useState({
    bookingId: "",
    guestName: "",
    numberOfGuests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    // Reset form or show success message
    setFormState({ bookingId: "", guestName: "", numberOfGuests: "" });
  };

  return (
    <div>
      <h1 className="h-page-title">Check-ins</h1>
      <p className="text-muted" style={{ marginTop: "8px", marginBottom: "24px" }}>
        Process guest check-ins by entering booking details
      </p>

      <div className="card" style={{ maxWidth: "600px" }}>
        <div className="card-header">
          <h2 className="h-card-title">New Check-in</h2>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="bookingId" className="text-meta" style={{ display: "block", marginBottom: "6px",fontWeight:600,color:"black" }}>
              Booking ID
            </label>
            <input
              id="bookingId"
              name="bookingId"
              type="text"
              className="input"
              required
              placeholder="Enter booking ID"
              value={formState.bookingId}
              onChange={onChange}
            />
          </div>

          <div>
            <label htmlFor="guestName" className="text-meta" style={{ display: "block", marginBottom: "6px",fontWeight:600,color:"black" }}>
              Guest Name
            </label>
            <input
              id="guestName"
              name="guestName"
              type="text"
              className="input"
              required
              placeholder="Enter guest name"
              value={formState.guestName}
              onChange={onChange}
            />
          </div>

          <div>
            <label htmlFor="numberOfGuests" className="text-meta" style={{ display: "block", marginBottom: "6px",fontWeight:600,color:"black" }}>
              Number of Guests
            </label>
            <input
              id="numberOfGuests"
              name="numberOfGuests"
              type="number"
              className="input"
              required
              min="1"
              placeholder="Enter number of guests"
              value={formState.numberOfGuests}
              onChange={onChange}
            />
          </div>

          <div style={{ marginTop: "8px" }}>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Check In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

