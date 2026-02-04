import { NavLink } from "react-router-dom";
import { UI_TEXT, ROUTES } from "../constants/ui.js";

export default function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white p-5 pt-7 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-brand">{UI_TEXT.APP_NAME}</h1>
      </div>

      <div className="space-y-1">
        <NavLink
          to={ROUTES.GUEST_DETAILS}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg text-sm ${
              isActive
                ? "bg-gray-100 text-brand font-semibold"
                : "text-brand hover:bg-gray-50"
            }`
          }
        >
          <span>{UI_TEXT.NAV_GUEST_DETAILS}</span>
        </NavLink>
      </div>
    </nav>
  );
}
