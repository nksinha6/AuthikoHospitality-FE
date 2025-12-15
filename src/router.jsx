import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App.jsx";
import CheckIns from "./pages/CheckIns.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import TodaysBookings from "./pages/TodaysBookings.jsx";
// import AllBookings from "./pages/AllBookings.jsx";
import { ROUTES } from "./constants/ui.js";

export const router = createBrowserRouter([
  {
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.TODAYS_BOOKINGS, element: <TodaysBookings /> },
      { path: ROUTES.CHECK_INS, element: <CheckIns /> },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: "*",
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
]);

export default router;
