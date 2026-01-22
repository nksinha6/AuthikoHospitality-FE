import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App.jsx";
import CheckIns from "./pages/CheckIns.jsx";
import AllBookings from "./pages/AllBookings.jsx";
import GuestDetails from "./pages/GuestDetails.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ROUTES } from "./constants/ui.js";
import GuestVerification from "./pages/GuestVerification.jsx";

// ✅ Compute basename as a string first
const basename = import.meta.env.DEV ? "/" : "/biz";

const routes = [
  {
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.CHECK_INS, element: <CheckIns /> },
      { path: ROUTES.GUEST_VERIFICATION, element: <GuestVerification /> },
      { path: ROUTES.ALL_BOOKINGS, element: <AllBookings /> },
      { path: ROUTES.GUEST_DETAILS, element: <GuestDetails /> },
    ],
  },
  { path: ROUTES.LOGIN, element: <Login /> },
  { path: "*", element: <Navigate to={ROUTES.LOGIN} replace /> },
];

// ✅ Pass the computed string
export const router = createBrowserRouter(routes, { basename });

export default router;
