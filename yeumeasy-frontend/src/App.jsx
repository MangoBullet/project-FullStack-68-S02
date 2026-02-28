import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Equipment from "./pages/Equipment.jsx";
import Borrow from "./pages/Borrow.jsx";
import BorrowHistory from "./pages/BorrowHistory.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/borrow" element={<Borrow />} />
        <Route path="/history" element={<BorrowHistory />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}