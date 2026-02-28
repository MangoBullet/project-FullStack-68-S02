import { useEffect, useMemo, useState } from "react";
import { load, save, uid } from "../utils/storage.js";
import { FormField, inputStyle } from "../components/FormField.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const USERS_KEY = "users";
const EQUIP_KEY = "equipment";
const BORROWS_KEY = "borrows"; // เก็บรายการยืมทั้งหมด

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Borrow() {
  // โหลด mock จาก localStorage (ที่คุณทำในหน้า Users/Equipment)
  const [users] = useState(() => load(USERS_KEY, []));
  const [equipment, setEquipment] = useState(() => load(EQUIP_KEY, []));
  const [borrows, setBorrows] = useState(() => load(BORROWS_KEY, []));

  // ฟอร์มหลัก
  const [userId, setUserId] = useState(users[0]?.id || "");
  const [borrowDate, setBorrowDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDaysISO(2));

  // เลือกอุปกรณ์เพื่อใส่ตะกร้า
  const [equipId, setEquipId] = useState(equipment[0]?.id || "");
  const [amount, setAmount] = useState(1);

  // ตะกร้า: [{ equipment_id, amount }]
  const [cart, setCart] = useState([]);

  // sync localStorage
  useEffect(() => save(EQUIP_KEY, equipment), [equipment]);
  useEffect(() => save(BORROWS_KEY, borrows), [borrows]);

  // อุปกรณ์ที่เลือกอยู่
  const selectedEquip = useMemo(
    () => equipment.find((e) => e.id === equipId),
    [equipment, equipId]
  );

  // เฉพาะอุปกรณ์ที่ “พร้อมใช้งาน” และมีของเหลือ
  const availableEquipment = useMemo(() => {
    return equipment.filter((e) => e.status === "AVAILABLE" && Number(e.quantity) > 0);
  }, [equipment]);

  // ช่วยให้ dropdown ไม่ค้างถ้า list เปลี่ยน
  useEffect(() => {
    if (!equipId && availableEquipment.length) setEquipId(availableEquipment[0].id);
    if (equipId && !equipment.some((e) => e.id === equipId)) setEquipId(availableEquipment[0]?.id || "");
  }, [equipId, equipment, availableEquipment]);

  const addToCart = () => {
    if (!equipId) return alert("ยังไม่มีอุปกรณ์ให้เลือก");
    const eq = equipment.find((e) => e.id === equipId);
    if (!eq) return alert("ไม่พบอุปกรณ์นี้");

    const qty = Number(amount);
    if (!Number.isFinite(qty) || qty <= 0) return alert("จำนวนต้องมากกว่า 0");
    if (eq.status !== "AVAILABLE") return alert("อุปกรณ์นี้ไม่พร้อมใช้งาน");
    if (qty > Number(eq.quantity)) return alert(`จำนวนไม่พอ (เหลือ ${eq.quantity})`);

    setCart((prev) => {
      const exist = prev.find((x) => x.equipment_id === equipId);
      if (exist) {
        const newAmt = exist.amount + qty;
        if (newAmt > Number(eq.quantity)) return prev; // กันเกิน
        return prev.map((x) => (x.equipment_id === equipId ? { ...x, amount: newAmt } : x));
      }
      return [...prev, { equipment_id: equipId, amount: qty }];
    });

    setAmount(1);
  };

  const removeItem = (equipment_id) => {
    setCart((prev) => prev.filter((x) => x.equipment_id !== equipment_id));
  };

  const updateCartAmount = (equipment_id, newValue) => {
    const eq = equipment.find((e) => e.id === equipment_id);
    if (!eq) return;

    const qty = Number(newValue);
    if (!Number.isFinite(qty) || qty <= 0) return;

    // จำกัดไม่ให้เกินของที่มี
    const max = Number(eq.quantity);
    const clamped = Math.min(qty, max);

    setCart((prev) =>
      prev.map((x) => (x.equipment_id === equipment_id ? { ...x, amount: clamped } : x))
    );
  };

  const validateBorrow = () => {
    if (!users.length) return "ยังไม่มีผู้ใช้ (ไปเพิ่มในหน้า Users ก่อน)";
    if (!userId) return "กรุณาเลือกผู้ยืม";
    if (!borrowDate) return "กรุณาเลือกวันยืม";
    if (!dueDate) return "กรุณาเลือกวันกำหนดคืน";
    if (new Date(dueDate) < new Date(borrowDate)) return "วันกำหนดคืนต้องไม่ก่อนวันยืม";
    if (cart.length === 0) return "กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ";

    // เช็คสต็อกอีกครั้ง
    for (const item of cart) {
      const eq = equipment.find((e) => e.id === item.equipment_id);
      if (!eq) return "มีอุปกรณ์ในตะกร้าที่ไม่พบในระบบ";
      if (eq.status !== "AVAILABLE") return `อุปกรณ์ ${eq.equipment_name} ไม่พร้อมใช้งาน`;
      if (item.amount > Number(eq.quantity)) return `อุปกรณ์ ${eq.equipment_name} จำนวนไม่พอ`;
    }
    return null;
  };

  const submitBorrow = () => {
    const err = validateBorrow();
    if (err) return alert(err);

    const borrowId = uid();

    const newBorrow = {
      id: borrowId,
      user_id: userId,
      borrow_date: borrowDate,
      due_date: dueDate,
      borrow_status: "BORROWED",
      details: cart.map((x) => ({
        id: uid(),
        borrow_id: borrowId,
        equipment_id: x.equipment_id,
        amount: x.amount,
        returned_amount: 0,
      })),
      created_at: new Date().toISOString(),
    };

    // ตัดสต็อก
    const nextEquip = equipment.map((e) => {
      const item = cart.find((x) => x.equipment_id === e.id);
      if (!item) return e;
      return { ...e, quantity: Number(e.quantity) - Number(item.amount) };
    });

    setEquipment(nextEquip);
    setBorrows([newBorrow, ...borrows]);
    setCart([]);

    alert("บันทึกรายการยืมเรียบร้อย ✅");
  };

  const getUserName = (id) => users.find((u) => u.id === id)?.full_name || "-";
  const getEquip = (id) => equipment.find((e) => e.id === id);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <div>
        <h1 style={{ margin: 0 }}>Borrow</h1>
        <div style={{ color: "#666", marginTop: 4 }}>
          สร้างรายการยืม + เลือกอุปกรณ์หลายรายการ (Mock)
        </div>
      </div>

      {/* ฟอร์มหลัก */}
      <div style={{ display: "grid", gap: 12, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="ผู้ยืม (User)">
            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={inputStyle}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.student_id})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="สถานะรายการยืม">
            <div>
              <StatusBadge value="BORROWED" />
            </div>
          </FormField>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="วันยืม">
            <input type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} style={inputStyle} />
          </FormField>

          <FormField label="วันกำหนดคืน">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
          </FormField>
        </div>
      </div>

      {/* เลือกอุปกรณ์ */}
      <div style={{ display: "grid", gap: 12, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <h3 style={{ margin: 0 }}>เลือกอุปกรณ์</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px", gap: 10, alignItems: "end" }}>
          <FormField label="อุปกรณ์ (เฉพาะที่พร้อมใช้งานและมีของ)">
            <select value={equipId} onChange={(e) => setEquipId(e.target.value)} style={inputStyle}>
              {availableEquipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.equipment_name} • {e.category} • เหลือ {e.quantity}
                </option>
              ))}
              {availableEquipment.length === 0 && <option value="">ไม่มีอุปกรณ์พร้อมใช้งาน</option>}
            </select>
          </FormField>

          <FormField label="จำนวน">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
            />
          </FormField>

          <button onClick={addToCart} disabled={!equipId} style={{ padding: 10, borderRadius: 10 }}>
            + เพิ่ม
          </button>
        </div>

        {selectedEquip && (
          <div style={{ color: "#666" }}>
            เลือกอยู่: <b>{selectedEquip.equipment_name}</b> ({selectedEquip.category}) • เหลือ {selectedEquip.quantity} •{" "}
            <StatusBadge value={selectedEquip.status} />
          </div>
        )}
      </div>

      {/* ตะกร้า */}
      <div style={{ display: "grid", gap: 10, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <h3 style={{ margin: 0 }}>ตะกร้าอุปกรณ์ที่ยืม</h3>

        {cart.length === 0 ? (
          <div style={{ color: "#666" }}>ยังไม่มีรายการในตะกร้า</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>อุปกรณ์</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>หมวดหมู่</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>สถานะ</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>จำนวน</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }} />
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const eq = getEquip(item.equipment_id);
                  if (!eq) return null;
                  return (
                    <tr key={item.equipment_id}>
                      <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{eq.equipment_name}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{eq.category}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                        <StatusBadge value={eq.status} />
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                        <input
                          type="number"
                          min={1}
                          max={eq.quantity}
                          value={item.amount}
                          onChange={(e) => updateCartAmount(item.equipment_id, e.target.value)}
                          style={{ ...inputStyle, width: 110 }}
                        />
                        <span style={{ marginLeft: 8, color: "#666" }}> (เหลือ {eq.quantity})</span>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>
                        <button onClick={() => removeItem(item.equipment_id)}>ลบ</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setCart([])} disabled={cart.length === 0}>
            ล้างตะกร้า
          </button>
          <button onClick={submitBorrow} disabled={cart.length === 0}>
            บันทึกการยืม
          </button>
        </div>
      </div>

      {/* แสดงตัวอย่างรายการที่บันทึก (optional) */}
      <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>รายการยืมล่าสุด (Mock)</h3>
        {borrows.length === 0 ? (
          <div style={{ color: "#666" }}>ยังไม่มีรายการยืม</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {borrows.slice(0, 3).map((b) => (
              <div key={b.id} style={{ padding: 12, border: "1px solid #f0f0f0", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <b>{getUserName(b.user_id)}</b>
                    <div style={{ color: "#666" }}>
                      ยืม: {b.borrow_date} • กำหนดคืน: {b.due_date}
                    </div>
                  </div>
                  <StatusBadge value={b.borrow_status} />
                </div>

                <ul style={{ margin: "10px 0 0 18px" }}>
                  {b.details.map((d) => {
                    const eq = getEquip(d.equipment_id);
                    return (
                      <li key={d.id}>
                        {eq?.equipment_name || "Unknown"} — {d.amount} ชิ้น
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}