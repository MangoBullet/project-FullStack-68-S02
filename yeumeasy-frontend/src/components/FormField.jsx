export function FormField({ label, children, hint }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 14, color: "#333" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 12, color: "#777" }}>{hint}</span>}
    </label>
  );
}

export const inputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
};