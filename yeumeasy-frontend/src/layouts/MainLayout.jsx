import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  padding: "10px 12px",
  display: "block",
  textDecoration: "none",
  borderRadius: 10,
  background: isActive ? "#1f2937" : "transparent",
  color: isActive ? "white" : "#111827",
});

export default function MainLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0 }}>YeumEasy</h2>

        <nav style={{ display: "grid", gap: 8 }}>
          <NavLink to="/" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/users" style={linkStyle}>Users</NavLink>
          <NavLink to="/equipment" style={linkStyle}>Equipment</NavLink>
          <NavLink to="/borrow" style={linkStyle}>Borrow</NavLink>
          <NavLink to="/history" style={linkStyle}>History</NavLink>
          <NavLink to="/reports" style={linkStyle}>Reports</NavLink>
        </nav>
      </aside>

      <main style={{ padding: 18 }}>
        <Outlet />
      </main>
    </div>
  );
}