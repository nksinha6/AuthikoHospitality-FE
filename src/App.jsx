import { useCallback, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { UI_TEXT, ROUTES } from "./constants/ui.js";

export default function App() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  const isActiveRoute = useCallback(
    (path) => {
      return location.pathname === path;
    },
    [location.pathname]
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar - Fixed position */}
      <nav className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white p-5 pt-7 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#1b3631]">
            {UI_TEXT.APP_NAME}
          </h1>
        </div>
        <div className="space-y-1">
          <NavLink
            to={ROUTES.TODAYS_BOOKINGS}
            className={`flex items-center px-3 py-2 rounded-lg ${
              isActiveRoute(ROUTES.TODAYS_BOOKINGS)
                ? "bg-gray-100 text-[#1b3631] font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{UI_TEXT.NAV_TODAYS_BOOKINGS}</span>
          </NavLink>

          <NavLink
            to={ROUTES.ALL_BOOKINGS}
            className={`flex items-center px-3 py-2 rounded-lg ${
              isActiveRoute(ROUTES.ALL_BOOKINGS)
                ? "bg-gray-100 text-[#1b3631] font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{UI_TEXT.NAV_ALL_BOOKINGS}</span>
          </NavLink>

          <NavLink
            to={ROUTES.CHECK_INS}
            className={`flex items-center px-3 py-2 rounded-lg ${
              isActiveRoute(ROUTES.CHECK_INS)
                ? "bg-gray-100 text-[#1b3631] font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{UI_TEXT.NAV_CHECK_INS}</span>
          </NavLink>
        </div>
      </nav>

      {/* Main Content - Offset by sidebar width */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Topbar - Fixed position */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg w-96">
              <i className="ri-search-line text-gray-500 mr-2"></i>
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent border-none outline-none w-full"
              />
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-6">
              <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
                <i className="ri-question-line text-xl"></i>
              </button>
              <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
                <i className="ri-notification-3-line text-xl"></i>
              </button>
              <div className="relative">
                <button
                  className="text-gray-600 hover:text-gray-900 cursor-pointer" 
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  <i className="ri-user-line text-xl"></i>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {UI_TEXT.BUTTON_LOGOUT}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto px-6 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
