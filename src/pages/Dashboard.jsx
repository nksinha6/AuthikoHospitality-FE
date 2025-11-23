import { UI_TEXT } from "../constants/ui.js";

const DASHBOARD_CARDS = [
  {
    id: "checked-in",
    title: UI_TEXT.DASHBOARD_CARD_CHECKED_IN,
    value: "48",
    description: UI_TEXT.DASHBOARD_CARD_CHECKED_IN_DESC,
  },
  {
    id: "total-bookings",
    title: UI_TEXT.DASHBOARD_CARD_TOTAL_BOOKINGS,
    value: "70",
    description: UI_TEXT.DASHBOARD_CARD_TOTAL_BOOKINGS_DESC,
  },
];

export default function Dashboard() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="h-page-title">{UI_TEXT.DASHBOARD_TITLE}</h1>
        <p className="text-muted page-subtitle">{UI_TEXT.DASHBOARD_SUBTITLE}</p>
      </div>

      <div className="grid-cards">
        {DASHBOARD_CARDS.map((card) => (
          <div key={card.id} className="card">
            <div className="text-meta mb-2">{card.title}</div>
            <div className="card-metric-main">{card.value}</div>
            <div className="card-metric-secondary">{card.description}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="h-card-title">{UI_TEXT.DASHBOARD_RECENT_ACTIVITY}</h2>
        </div>
        <div className="text-body text-muted">
          {UI_TEXT.DASHBOARD_NO_ACTIVITY}
        </div>
      </div>
    </div>
  );
}
