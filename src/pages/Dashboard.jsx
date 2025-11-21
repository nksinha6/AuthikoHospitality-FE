const cards = [
  {
    title: "Currently Checked in Guests",
    value: "48",
    description: "Active check-ins right now",
  },
  {
    title: "Total Bookings",
    value: "70",
    description: "Total bookings this month",
  },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="h-page-title">Dashboard</h1>
      <p className="text-muted" style={{ marginTop: "8px", marginBottom: "24px" }}>
        Overview of your OnePass operations
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {cards.map((card) => (
          <div key={card.title} className="card">
            <div className="text-meta" style={{ marginBottom: "8px" }}>
              {card.title}
            </div>
            <div className="card-metric-main">{card.value}</div>
            <div className="card-metric-secondary">{card.description}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="h-card-title">Recent Activity</h2>
        </div>
        <div className="text-body" style={{ color: "var(--color-text-muted)" }}>
          No recent activity to display
        </div>
      </div>
    </div>
  );
}

