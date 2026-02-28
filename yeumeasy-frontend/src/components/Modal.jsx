export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 96vw)",
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: "6px 10px" }}>
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>{children}</div>

        {footer && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}