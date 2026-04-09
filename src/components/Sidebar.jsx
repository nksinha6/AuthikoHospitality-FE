import { NavLink } from "react-router-dom";
import { UI_TEXT, ROUTES } from "../constants/ui.js";
import { useAuth } from "../context/AuthContext.jsx";
import logoOnePass from "../assets/images/1pass_logo.jpg";

export default function Sidebar() {
  const { tenantDetails, propertyDetails, userData } = useAuth();
  const logoSrc = tenantDetails?.logo || propertyDetails?.logo;

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white p-5 pt-7 overflow-y-auto">
      <div className="mb-8 flex items-center gap-3">
        <img
          src={logoOnePass}
          className="w-12 h-12"
          style={{ borderRadius: "9px" }}
        ></img>
        {logoSrc && (
          <img
            src={
              logoSrc.startsWith("data:")
                ? logoSrc
                : `data:image/png;base64,${logoSrc}`
            }
            alt="Logo"
            className="w-10 h-10 object-contain rounded-lg shadow-sm"
          />
        )}
      </div>

      <div className="space-y-1">
        <NavLink
          to={ROUTES.CHECK_INS}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg text-sm ${
              isActive
                ? "bg-gray-100 text-brand font-semibold"
                : "text-brand hover:bg-gray-50"
            }`
          }
        >
          <span>{UI_TEXT.NAV_CHECK_INS}</span>
        </NavLink>

        {/* <NavLink
          to={ROUTES.TODAYS_BOOKINGS}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg text-sm ${
              isActive
                ? "bg-gray-100 text-brand font-semibold"
                : "text-brand hover:bg-gray-50"
            }`
          }
        >
          <span>{UI_TEXT.NAV_TODAYS_BOOKINGS}</span>
        </NavLink> */}

        {/* <NavLink
          to={ROUTES.ALL_BOOKINGS}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg text-sm ${
              isActive
                ? "bg-gray-100 text-brand font-semibold"
                : "text-brand hover:bg-gray-50"
            }`
          }
        >
          <span>{UI_TEXT.NAV_ALL_BOOKINGS}</span>
        </NavLink> */}

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

        {userData?.tier?.toLowerCase() === "enterprise" && (
          <NavLink
            to={ROUTES.VENDOR_ENTRY}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? "bg-gray-100 text-brand font-semibold"
                  : "text-brand hover:bg-gray-50"
              }`
            }
          >
            <span>{UI_TEXT.NAV_VENDOR_ENTRY}</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
