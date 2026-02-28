import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { FormField, inputStyle } from "../components/FormField.jsx";
import { load, save, uid } from "../utils/storage.js";

const STORAGE_KEY = "users";

const seedUsers = [
  { id: uid(), full_name: "นาย เจตริล เจริญทอง", student_id: "6706022510425", phone: "09xxxxxxxx" },
  { id: uid(), full_name: "นาย ธนพัฒน์ นิลคูหา", student_id: "6706022510441", phone: "09xxxxxxxx" },
  { id: uid(), full_name: "นาย บวร ลิ้มประเสริฐ", student_id: "6706022510450", phone: "09xxxxxxxx" },
  { id: uid(), full_name: "นาย ชนาธิป จุรุเทียบ", student_id: "6706022510468", phone: "09xxxxxxxx" },
];

export default function Users() {
  const [rows, setRows] = useState(() => load(STORAGE_KEY, seedUsers));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [form, setForm] = useState({ id: "", full_name: "", student_id: "", phone: "" });

  useEffect(() => {
    save(STORAGE_KEY, rows);
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      return (
        (r.full_name || "").toLowerCase().includes(s) ||
        (r.student_id || "").toLowerCase().includes(s) ||
        (r.phone || "").toLowerCase().includes(s)
      );
    });
  }, [rows, q]);

  const openCreate = () => {
    setMode("create");
    setForm({ id: "", full_name: "", student_id: "", phone: "" });
    setOpen(true);
  };

  const openEdit = (r) => {
    setMode("edit");
    setForm({ ...r });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const validate = () => {
    if (!form.full_name.trim()) return "กรุณากรอกชื่อ-สกุล";
    if (!form.student_id.trim()) return "กรุณากรอกรหัสนักศึกษา";
    // กัน student_id ซ้ำ
    const dup = rows.find(
      (x) => x.student_id === form.student_id && x.id !== form.id
    );
    if (dup) return "รหัสนักศึกษานี้มีอยู่แล้ว";
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) return alert(err);

    if (mode === "create") {
      const newRow = { ...form, id: uid() };
      setRows([newRow, ...rows]);
    } else {
      setRows(rows.map((r) => (r.id === form.id ? form : r)));
    }
    setOpen(false);
  };

  const onDelete = (id) => {
    if (!confirm("ต้องการลบผู้ใช้นี้หรือไม่?")) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const onResetMock = () => {
    if (!confirm("รีเซ็ตเป็นข้อมูลตัวอย่าง? (ข้อมูลที่เพิ่มเองจะหาย)")) return;
    setRows(seedUsers);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Users</h1>
          <div style={{ color: "#666", marginTop: 4 }}>จัดการข้อมูลผู้ยืม</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onResetMock}>Reset Mock</button>
          <button onClick={openCreate}>+ Add User</button>
        </div>
      </div>

      <input
        placeholder="ค้นหา ชื่อ/รหัส/โทร..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={inputStyle}
      />

      <DataTable
        columns={[
          { key: "full_name", label: "ชื่อ-สกุล" },
          { key: "student_id", label: "รหัสนักศึกษา" },
          { key: "phone", label: "เบอร์โทร" },
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
        title={mode === "create" ? "Add User" : "Edit User"}
        onClose={close}
        footer={
          <>
            <button onClick={close}>Cancel</button>
            <button onClick={onSave}>Save</button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <FormField label="ชื่อ-สกุล">
            <input
              style={inputStyle}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="เช่น นาย ก"
            />
          </FormField>

          <FormField label="รหัสนักศึกษา">
            <input
              style={inputStyle}
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              placeholder="เช่น 6706..."
            />
          </FormField>

          <FormField label="เบอร์โทร">
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="เช่น 09xxxxxxxx"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}