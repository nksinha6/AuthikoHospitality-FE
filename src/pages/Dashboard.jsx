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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {UI_TEXT.DASHBOARD_TITLE}
        </h1>
        <p className="text-gray-600 mt-2">{UI_TEXT.DASHBOARD_SUBTITLE}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {DASHBOARD_CARDS.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6"
          >
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              {card.title}
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {card.value}
            </div>
            <div className="text-sm text-gray-600">{card.description}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {UI_TEXT.DASHBOARD_RECENT_ACTIVITY}
          </h2>
        </div>
        <div className="text-gray-600">{UI_TEXT.DASHBOARD_NO_ACTIVITY}</div>
      </div>
    </div>
  );
}
