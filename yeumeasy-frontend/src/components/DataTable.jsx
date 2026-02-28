export default function DataTable({ columns, rows, renderActions }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #eaeaea", borderRadius: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: 12,
                  borderBottom: "1px solid #eaeaea",
                  background: "#fafafa",
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </th>
            ))}
            {renderActions && (
              <th
                style={{
                  padding: 12,
                  borderBottom: "1px solid #eaeaea",
                  background: "#fafafa",
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
              {renderActions && (
                <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" }}>
                  {renderActions(r)}
                </td>
              )}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (renderActions ? 1 : 0)}
                style={{ padding: 16, color: "#666" }}
              >
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}