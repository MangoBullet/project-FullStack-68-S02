import { useEffect, useMemo, useState } from "react";
import { load, save } from "../utils/storage.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import { inputStyle } from "../components/FormField.jsx";

const USERS_KEY = "users";
const EQUIP_KEY = "equipment";
const BORROWS_KEY = "borrows";

function fmt(dt) {
  // dt: "YYYY-MM-DD"
  return dt || "-";
}

export default function BorrowHistory() {
  const [users] = useState(() => load(USERS_KEY, []));
  const [equipment, setEquipment] = useState(() => load(EQUIP_KEY, []));
  const [borrows, setBorrows] = useState(() => load(BORROWS_KEY, []));

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | BORROWED | RETURNED
  const [open, setOpen] = useState(false);
  const [activeBorrowId, setActiveBorrowId] = useState("");

  // สำหรับ modal คืนของ: map equipment_id -> returnQty
  const [returnMap, setReturnMap] = useState({});

  useEffect(() => save(EQUIP_KEY, equipment), [equipment]);
  useEffect(() => save(BORROWS_KEY, borrows), [borrows]);

  const getUserName = (id) => users.find((u) => u.id === id)?.full_name || "-";
  const getEquip = (id) => equipment.find((e) => e.id === id);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return borrows.filter((b) => {
      const matchFilter = filter === "ALL" || b.borrow_status === filter;
      const userName = getUserName(b.user_id).toLowerCase();
      const matchText =
        !s ||
        userName.includes(s) ||
        String(b.id || "").toLowerCase().includes(s) ||
        (b.details || []).some((d) => (getEquip(d.equipment_id)?.equipment_name || "").toLowerCase().includes(s));

      return matchFilter && matchText;
    });
  }, [borrows, q, filter, users, equipment]);

  const openReturnModal = (borrowId) => {
    const b = borrows.find((x) => x.id === borrowId);
    if (!b) return;

    // ตั้งค่าเริ่มต้น: คืนให้เท่าที่ "ยังไม่คืน"
    const init = {};
    for (const d of b.details) {
      const remaining = Number(d.amount) - Number(d.returned_amount || 0);
      init[d.equipment_id] = remaining > 0 ? remaining : 0;
    }

    setReturnMap(init);
    setActiveBorrowId(borrowId);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setActiveBorrowId("");
    setReturnMap({});
  };

  const activeBorrow = useMemo(
    () => borrows.find((b) => b.id === activeBorrowId),
    [borrows, activeBorrowId]
  );

  const setReturnQty = (equipment_id, value) => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    setReturnMap((prev) => ({ ...prev, [equipment_id]: qty }));
  };

  const applyReturn = () => {
    if (!activeBorrow) return;

    // validate: returnQty ต้องไม่เกิน remaining
    for (const d of activeBorrow.details) {
      const remaining = Number(d.amount) - Number(d.returned_amount || 0);
      const rq = Number(returnMap[d.equipment_id] || 0);
      if (rq > remaining) {
        const eqName = getEquip(d.equipment_id)?.equipment_name || "Unknown";
        return alert(`คืนเกินจำนวนที่เหลือของ ${eqName}`);
      }
    }

    // 1) อัปเดต borrows.details.returned_amount
    const nextBorrows = borrows.map((b) => {
      if (b.id !== activeBorrow.id) return b;

      const nextDetails = b.details.map((d) => {
        const rq = Number(returnMap[d.equipment_id] || 0);
        return {
          ...d,
          returned_amount: Number(d.returned_amount || 0) + rq,
        };
      });

      // ถ้าคืนครบทุกชิ้น -> RETURNED
      const allReturned = nextDetails.every(
        (d) => Number(d.returned_amount || 0) >= Number(d.amount)
      );

      return {
        ...b,
        borrow_status: allReturned ? "RETURNED" : "BORROWED",
        details: nextDetails,
      };
    });

    // 2) คืนสต็อกกลับไปที่ equipment.quantity
    const nextEquip = equipment.map((e) => {
      const rq = Number(returnMap[e.id] || 0); // คืนตาม equipment_id
      if (!rq) return e;
      return { ...e, quantity: Number(e.quantity) + rq };
    });

    setBorrows(nextBorrows);
    setEquipment(nextEquip);
    closeModal();
    alert("บันทึกการคืนเรียบร้อย ✅");
  };

  const deleteBorrow = (id) => {
    if (!confirm("ลบประวัติรายการนี้? (ไม่คืนสต็อกให้อัตโนมัติ)")) return;
    setBorrows(borrows.filter((b) => b.id !== id));
  };

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 1100 }}>
      <div>
        <h1 style={{ margin: 0 }}>History</h1>
        <div style={{ color: "#666", marginTop: 4 }}>
          ประวัติการยืม-คืน และคืนอุปกรณ์ (Mock)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10 }}>
        <input
          placeholder="ค้นหา ผู้ยืม / ชื่ออุปกรณ์ / id..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={inputStyle}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={inputStyle}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="BORROWED">กำลังยืม</option>
          <option value="RETURNED">คืนแล้ว</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12, color: "#666" }}>
          ยังไม่มีประวัติรายการยืม
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((b) => (
            <div key={b.id} style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{getUserName(b.user_id)}</div>
                  <div style={{ color: "#666", marginTop: 4 }}>
                    ยืม: {fmt(b.borrow_date)} • กำหนดคืน: {fmt(b.due_date)} • รายการ: {b.details?.length || 0}
                  </div>
                  <div style={{ color: "#999", marginTop: 4, fontSize: 12 }}>Borrow ID: {b.id}</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusBadge value={b.borrow_status} />
                  {b.borrow_status !== "RETURNED" && (
                    <button onClick={() => openReturnModal(b.id)}>คืนของ</button>
                  )}
                  <button onClick={() => deleteBorrow(b.id)}>ลบ</button>
                </div>
              </div>

              <div style={{ marginTop: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>อุปกรณ์</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>จำนวนยืม</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>คืนแล้ว</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>ค้างคืน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.details.map((d) => {
                      const eq = getEquip(d.equipment_id);
                      const returned = Number(d.returned_amount || 0);
                      const total = Number(d.amount || 0);
                      const remaining = Math.max(total - returned, 0);

                      return (
                        <tr key={d.id}>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                            {eq?.equipment_name || "Unknown"}{" "}
                            <span style={{ color: "#777" }}>({eq?.category || "-"})</span>
                          </td>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{total}</td>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{returned}</td>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{remaining}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal คืนของ */}
      <Modal
        open={open}
        title="คืนอุปกรณ์"
        onClose={closeModal}
        footer={
          <>
            <button onClick={closeModal}>Cancel</button>
            <button onClick={applyReturn}>Confirm Return</button>
          </>
        }
      >
        {!activeBorrow ? (
          <div style={{ color: "#666" }}>ไม่พบรายการยืม</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{getUserName(activeBorrow.user_id)}</div>
                <div style={{ color: "#666" }}>
                  ยืม: {fmt(activeBorrow.borrow_date)} • กำหนดคืน: {fmt(activeBorrow.due_date)}
                </div>
              </div>
              <StatusBadge value={activeBorrow.borrow_status} />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>อุปกรณ์</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>ยืม</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>คืนแล้ว</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>คืนครั้งนี้</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBorrow.details.map((d) => {
                    const eq = getEquip(d.equipment_id);
                    const total = Number(d.amount || 0);
                    const returned = Number(d.returned_amount || 0);
                    const remaining = Math.max(total - returned, 0);
                    const rq = Number(returnMap[d.equipment_id] || 0);

                    return (
                      <tr key={d.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                          {eq?.equipment_name || "Unknown"}{" "}
                          <span style={{ color: "#777" }}>({eq?.category || "-"})</span>
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{total}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{returned}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={rq}
                            onChange={(e) => setReturnQty(d.equipment_id, e.target.value)}
                            style={{ ...inputStyle, width: 120 }}
                          />
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                          {Math.max(remaining - rq, 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ color: "#666", fontSize: 12 }}>
              * เมื่อกดยืนยัน ระบบจะเพิ่มสต็อกกลับเข้า Equipment และถ้าคืนครบทุกชิ้น สถานะจะเป็น “คืนแล้ว”
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}