// Topbar.jsx
import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { UI_TEXT, ROUTES } from "../constants/ui.js";

export default function Topbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <SearchInput />

        <div className="flex items-center gap-6">
          <HelpButton />
          <NotificationsButton />
          <UserDropdown
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
          />
        </div>
      </div>
    </header>
  );
}

// Search Input Component
function SearchInput() {
  return (
    <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg w-96">
      <i className="ri-search-line text-gray-500 mr-2"></i>
      <input
        type="text"
        placeholder="Search"
        className="bg-transparent border-none outline-none w-full"
      />
    </div>
  );
}

// Help Button Component
function HelpButton() {
  return (
    <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
      <i className="ri-question-line text-xl"></i>
    </button>
  );
}

// Notifications Button Component
function NotificationsButton() {
  return (
    <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
      <i className="ri-notification-3-line text-xl"></i>
    </button>
  );
}

// User Dropdown Component
function UserDropdown({ showDropdown, setShowDropdown }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
    setShowDropdown(false);
  }, [logout, navigate, setShowDropdown]);

  return (
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
  );
}
