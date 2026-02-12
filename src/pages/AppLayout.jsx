// AppLayout.jsx
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import { useEffect, useState } from "react";
import { ROUTES } from "../constants/ui.js";

export default function AppLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Responsive logic: 
  // Desktop: No Walk-in Check-ins (redirect to Guest Details)
  // Mobile: No Guest Details (redirect to Check-ins)

  if (!isMobile && location.pathname === ROUTES.CHECK_INS) {
    return <Navigate to={ROUTES.GUEST_DETAILS} replace />;
  }

  if (isMobile && location.pathname === ROUTES.GUEST_DETAILS) {
    return <Navigate to={ROUTES.CHECK_INS} replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 lg:bg-white overflow-x-hidden">
      {!isMobile && <Sidebar />}

      <div className={`flex-1 flex flex-col ${!isMobile ? "ml-64" : ""}`}>
        {!isMobile && <Topbar />}

        <main className={`flex-1 overflow-y-auto ${isMobile ? "p-0" : "px-6 py-4"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
