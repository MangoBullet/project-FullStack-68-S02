import { useMemo, useState } from "react";
import { load } from "../utils/storage.js";
import { inputStyle } from "../components/FormField.jsx";

const USERS_KEY = "users";
const EQUIP_KEY = "equipment";
const BORROWS_KEY = "borrows";

function toDateOnly(x) {
  if (!x) return "";
  if (typeof x === "string" && x.includes("T")) return x.slice(0, 10);
  return String(x).slice(0, 10);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  return toDateOnly(new Date().toISOString());
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthsAgoYM(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; // YYYY-MM
}

function ym(dateStr) {
  // "YYYY-MM-DD" -> "YYYY-MM"
  if (!dateStr) return "";
  return dateStr.slice(0, 7);
}

function inRange(dateStr, start, end) {
  // string compare works for YYYY-MM-DD
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}

function BarChart({ data, mode, height = 160 }) {
  // data: [{label, value}]
  const max = Math.max(1, ...data.map((d) => d.value));

  const shortLabel = (label) => {
    if (mode === "DAY") return label.slice(5); // MM-DD
    // MONTH
    return label; // YYYY-MM
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "end", gap: 6, height }}>
        {data.map((d) => {
          const h = Math.round((d.value / max) * (height - 10));
          return (
            <div key={d.label} style={{ flex: 1, minWidth: 10 }}>
              <div
                title={`${d.label}: ${d.value}`}
                style={{
                  height: h,
                  borderRadius: 10,
                  background: "#111827",
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${data.length}, 1fr)`,
          gap: 6,
          marginTop: 10,
          fontSize: 11,
          color: "#666",
        }}
      >
        {data.map((d) => (
          <div key={d.label} style={{ textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}>
            {shortLabel(d.label)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reports() {
  const users = useMemo(() => load(USERS_KEY, []), []);
  const equipment = useMemo(() => load(EQUIP_KEY, []), []);
  const borrows = useMemo(() => load(BORROWS_KEY, []), []);

  // ===== Report 1 controls =====
  const [aggMode, setAggMode] = useState("DAY"); // DAY | MONTH

  const [rangeDays, setRangeDays] = useState(30); // for DAY
  const [rangeMonths, setRangeMonths] = useState(12); // for MONTH

  const endDay = todayISO();
  const startDay = daysAgoISO(rangeDays - 1);

  const endYM = ym(endDay); // YYYY-MM
  const startYM = monthsAgoYM(rangeMonths - 1); // YYYY-MM

  // ===== Report 2 controls =====
  const [topN, setTopN] = useState(10);

  const equipNameById = useMemo(() => {
    const map = {};
    for (const e of equipment) map[e.id] = e.equipment_name;
    return map;
  }, [equipment]);

  const equipCategoryById = useMemo(() => {
    const map = {};
    for (const e of equipment) map[e.id] = e.category;
    return map;
  }, [equipment]);

  // =========================
  // Report 1: Borrow by time
  // =========================
  const borrowTimeline = useMemo(() => {
    if (aggMode === "DAY") {
      // สร้างแกนวันให้ครบ
      const dayMap = {};
      const data = [];

      const startD = new Date(startDay);
      const endD = new Date(endDay);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        dayMap[key] = 0;
      }

      for (const b of borrows) {
        const day = toDateOnly(b.borrow_date);
        if (inRange(day, startDay, endDay) && dayMap[day] !== undefined) {
          dayMap[day] += 1; // 1 borrow = 1 record
        }
      }

      for (const [label, value] of Object.entries(dayMap)) {
        data.push({ label, value });
      }
      return data;
    }

    // MONTH
    // สร้างแกนเดือนให้ครบ
    const monthMap = {};
    const data = [];

    // สร้างรายการเดือนจาก startYM -> endYM
    const [sy, sm] = startYM.split("-").map(Number);
    const [ey, em] = endYM.split("-").map(Number);
    const cur = new Date(sy, sm - 1, 1);
    const endDate = new Date(ey, em - 1, 1);

    while (cur <= endDate) {
      const key = `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}`;
      monthMap[key] = 0;
      cur.setMonth(cur.getMonth() + 1);
    }

    for (const b of borrows) {
      const day = toDateOnly(b.borrow_date);
      const m = ym(day);
      if (m >= startYM && m <= endYM && monthMap[m] !== undefined) {
        monthMap[m] += 1;
      }
    }

    for (const [label, value] of Object.entries(monthMap)) {
      data.push({ label, value });
    }
    return data;
  }, [aggMode, borrows, startDay, endDay, startYM, endYM]);

  const totalBorrowInRange = useMemo(
    () => borrowTimeline.reduce((sum, d) => sum + d.value, 0),
    [borrowTimeline]
  );

  const timelineSubtitle = useMemo(() => {
    if (aggMode === "DAY") return `ช่วง: ${startDay} ถึง ${endDay}`;
    return `ช่วง: ${startYM} ถึง ${endYM}`;
  }, [aggMode, startDay, endDay, startYM, endYM]);

  // =====================================
  // Report 2: Most borrowed equipment
  // =====================================
  const topBorrowed = useMemo(() => {
    const stats = {}; // equipment_id -> { times, total_amount }

    for (const b of borrows) {
      const seenInThisBorrow = new Set();
      for (const d of b.details || []) {
        if (!stats[d.equipment_id]) stats[d.equipment_id] = { times: 0, total_amount: 0 };
        stats[d.equipment_id].total_amount += Number(d.amount || 0);

        if (!seenInThisBorrow.has(d.equipment_id)) {
          stats[d.equipment_id].times += 1;
          seenInThisBorrow.add(d.equipment_id);
        }
      }
    }

    const list = Object.entries(stats).map(([equipment_id, v]) => ({
      equipment_id,
      equipment_name: equipNameById[equipment_id] || "Unknown",
      category: equipCategoryById[equipment_id] || "-",
      times: v.times,
      total_amount: v.total_amount,
    }));

    list.sort((a, b) => b.total_amount - a.total_amount);
    return list.slice(0, Number(topN));
  }, [borrows, topN, equipNameById, equipCategoryById]);

  const summary = useMemo(() => {
    return { userCount: users.length, equipCount: equipment.length, borrowCount: borrows.length };
  }, [users, equipment, borrows]);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      <div>
        <h1 style={{ margin: 0 }}>Reports</h1>
        <div style={{ color: "#666", marginTop: 4 }}>
          รายงานการยืมตามช่วงเวลา (รายวัน/รายเดือน) + อุปกรณ์ที่ถูกยืมมากที่สุด (Mock)
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {[
          { label: "Users", value: summary.userCount },
          { label: "Equipment", value: summary.equipCount },
          { label: "Borrow Records", value: summary.borrowCount },
        ].map((x) => (
          <div key={x.label} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ color: "#666", fontSize: 13 }}>{x.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{x.value}</div>
          </div>
        ))}
      </div>

      {/* Report 1 */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>รายงานการยืมตามช่วงเวลา</h2>
            <div style={{ color: "#666", marginTop: 4 }}>
              {timelineSubtitle} • รวม {totalBorrowInRange} รายการ
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "#666" }}>มุมมอง</span>
            <select value={aggMode} onChange={(e) => setAggMode(e.target.value)} style={inputStyle}>
              <option value="DAY">รายวัน</option>
              <option value="MONTH">รายเดือน</option>
            </select>

            {aggMode === "DAY" ? (
              <>
                <span style={{ color: "#666" }}>ช่วง</span>
                <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} style={inputStyle}>
                  <option value={7}>7 วัน</option>
                  <option value={30}>30 วัน</option>
                  <option value={90}>90 วัน</option>
                </select>
              </>
            ) : (
              <>
                <span style={{ color: "#666" }}>ช่วง</span>
                <select value={rangeMonths} onChange={(e) => setRangeMonths(Number(e.target.value))} style={inputStyle}>
                  <option value={6}>6 เดือน</option>
                  <option value={12}>12 เดือน</option>
                  <option value={24}>24 เดือน</option>
                </select>
              </>
            )}
          </div>
        </div>

        {borrowTimeline.length === 0 ? <div style={{ color: "#666" }}>ยังไม่มีข้อมูล</div> : <BarChart data={borrowTimeline} mode={aggMode} />}

        <div style={{ color: "#666", fontSize: 12 }}>
          * นับจำนวน “รายการยืม” จากวันที่ borrow_date (1 รายการ = 1 borrow) และ aggregate ตาม {aggMode === "DAY" ? "วัน" : "เดือน"}
        </div>
      </div>

      {/* Report 2 */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>รายงานอุปกรณ์ที่ถูกยืมมากที่สุด</h2>
            <div style={{ color: "#666", marginTop: 4 }}>
              จัดอันดับจาก “จำนวนชิ้นรวมที่ถูกยืม” (total_amount)
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#666" }}>Top</span>
            <select value={topN} onChange={(e) => setTopN(Number(e.target.value))} style={inputStyle}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {topBorrowed.length === 0 ? (
          <div style={{ color: "#666" }}>ยังไม่มีข้อมูลการยืม</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>อันดับ</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>อุปกรณ์</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>หมวดหมู่</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>จำนวนครั้งที่ถูกยืม</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>จำนวนชิ้นรวมที่ถูกยืม</th>
                </tr>
              </thead>
              <tbody>
                {topBorrowed.map((x, idx) => (
                  <tr key={x.equipment_id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{idx + 1}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2", fontWeight: 700 }}>{x.equipment_name}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{x.category}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{x.times}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{x.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ color: "#666", fontSize: 12 }}>
          * “จำนวนครั้งที่ถูกยืม” นับ 1 ครั้งต่อ 1 รายการยืม (Borrow) ที่มีอุปกรณ์นั้นอยู่ในรายละเอียด
        </div>
      </div>
    </div>
  );
}