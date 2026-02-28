export default function StatusBadge({ value }) {
  const map = {
    AVAILABLE: { text: "พร้อมใช้งาน", bg: "#dcfce7", fg: "#166534", bd: "#86efac" },
    MAINTENANCE: { text: "ซ่อม/ชำรุด", bg: "#fef9c3", fg: "#854d0e", bd: "#fde047" },
    DISPOSED: { text: "จำหน่าย", bg: "#fee2e2", fg: "#991b1b", bd: "#fecaca" },
  };

  const s = map[value] || { text: value || "-", bg: "#f3f4f6", fg: "#374151", bd: "#e5e7eb" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: s.fg, opacity: 0.85 }} />
      {s.text}
    </span>
  );
}