// AppLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-6 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
