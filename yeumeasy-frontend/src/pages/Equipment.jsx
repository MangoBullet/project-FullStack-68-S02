import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { FormField, inputStyle } from "../components/FormField.jsx";
import { load, save, uid } from "../utils/storage.js";

const STORAGE_KEY = "equipment";

const seedEquipment = [
  { id: uid(), equipment_name: "Router", category: "Network", quantity: 5, status: "AVAILABLE" },
  { id: uid(), equipment_name: "Switch", category: "Network", quantity: 8, status: "AVAILABLE" },
  { id: uid(), equipment_name: "LAN Cable", category: "Accessory", quantity: 50, status: "AVAILABLE" },
  { id: uid(), equipment_name: "Notebook", category: "IT", quantity: 3, status: "MAINTENANCE" },
];

const statusLabel = {
  AVAILABLE: "พร้อมใช้งาน",
  MAINTENANCE: "ชำรุด/ซ่อม",
  DISPOSED: "จำหน่ายออก",
};

export default function Equipment() {
  const [rows, setRows] = useState(() => load(STORAGE_KEY, seedEquipment));
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({
    id: "",
    equipment_name: "",
    category: "",
    quantity: 1,
    status: "AVAILABLE",
  });

  useEffect(() => save(STORAGE_KEY, rows), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchText =
        !s ||
        (r.equipment_name || "").toLowerCase().includes(s) ||
        (r.category || "").toLowerCase().includes(s);

      const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
      return matchText && matchStatus;
    });
  }, [rows, q, filterStatus]);

  const openCreate = () => {
    setMode("create");
    setForm({ id: "", equipment_name: "", category: "", quantity: 1, status: "AVAILABLE" });
    setOpen(true);
  };

  const openEdit = (r) => {
    setMode("edit");
    setForm({ ...r });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const validate = () => {
    if (!form.equipment_name.trim()) return "กรุณากรอกชื่ออุปกรณ์";
    if (!form.category.trim()) return "กรุณากรอกหมวดหมู่";
    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty < 0) return "จำนวนต้องเป็นตัวเลขและห้ามติดลบ";
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) return alert(err);

    const clean = { ...form, quantity: Number(form.quantity) };

    if (mode === "create") {
      setRows([{ ...clean, id: uid() }, ...rows]);
    } else {
      setRows(rows.map((r) => (r.id === clean.id ? clean : r)));
    }
    setOpen(false);
  };

  const onDelete = (id) => {
    if (!confirm("ต้องการลบอุปกรณ์นี้หรือไม่?")) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const onResetMock = () => {
    if (!confirm("รีเซ็ตเป็นข้อมูลตัวอย่าง? (ข้อมูลที่เพิ่มเองจะหาย)")) return;
    setRows(seedEquipment);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Equipment</h1>
          <div style={{ color: "#666", marginTop: 4 }}>จัดการอุปกรณ์ในห้อง/คณะ</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onResetMock}>Reset Mock</button>
          <button onClick={openCreate}>+ Add Equipment</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10 }}>
        <input
          placeholder="ค้นหา ชื่ออุปกรณ์/หมวดหมู่..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={inputStyle}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={inputStyle}
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="AVAILABLE">พร้อมใช้งาน</option>
          <option value="MAINTENANCE">ชำรุด/ซ่อม</option>
          <option value="DISPOSED">จำหน่ายออก</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: "equipment_name", label: "ชื่ออุปกรณ์" },
          { key: "category", label: "หมวดหมู่" },
          { key: "quantity", label: "จำนวน" },
          { key: "status", label: "สถานะ", render: (r) => statusLabel[r.status] || r.status },
        ]}
        rows={filtered}
        renderActions={(r) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => openEdit(r)}>Edit</button>
            <button onClick={() => onDelete(r.id)}>Delete</button>
          </div>
        )}
      />

      <Modal
        open={open}
        title={mode === "create" ? "Add Equipment" : "Edit Equipment"}
        onClose={close}
        footer={
          <>
            <button onClick={close}>Cancel</button>
            <button onClick={onSave}>Save</button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <FormField label="ชื่ออุปกรณ์">
            <input
              style={inputStyle}
              value={form.equipment_name}
              onChange={(e) => setForm({ ...form, equipment_name: e.target.value })}
              placeholder="เช่น Router"
            />
          </FormField>

          <FormField label="หมวดหมู่">
            <input
              style={inputStyle}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="เช่น Network"
            />
          </FormField>

          <FormField label="จำนวน">
            <input
              style={inputStyle}
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              min={0}
            />
          </FormField>

          <FormField label="สถานะ">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={inputStyle}
            >
              <option value="AVAILABLE">พร้อมใช้งาน</option>
              <option value="MAINTENANCE">ชำรุด/ซ่อม</option>
              <option value="DISPOSED">จำหน่ายออก</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}