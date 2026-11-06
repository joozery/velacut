export type HistoryKind = "topup" | "poster" | "transfer" | "reward";
export type HistoryStatus = "completed" | "pending" | "failed";
export type HistoryRecord = {
  id: string;
  kind: HistoryKind;
  status: HistoryStatus;
  title: string;
  description: string;
  date: string;
  coins: number;
  baht?: number;
  note: string;
};

/** รายการสำหรับแสดง UI เท่านั้น ยังไม่ได้เชื่อมประวัติธุรกรรมจริง */
export const SAMPLE_HISTORY: HistoryRecord[] = [
  { id: "DEMO-TU-0108", kind: "topup", status: "completed", title: "เติมคอยน์ 200 บาท", description: "PromptPay · รวมโบนัส 55 คอยน์", date: "2026-11-06T13:42:00+07:00", coins: 255, baht: 200, note: "คอยน์หลัก 200 + โบนัสแพ็กเกจ 15 + โบนัสเติมครั้งแรก 40 คอยน์" },
  { id: "DEMO-PS-0107", kind: "poster", status: "completed", title: "สร้างป้าย Mobile Legends", description: "เทมเพลต B · 25 สกิน", date: "2026-11-06T12:18:00+07:00", coins: -32.5, note: "ตัวอย่างค่าจัดสกินและเทมเพลตแบบไม่มีลายน้ำ" },
  { id: "DEMO-RW-0106", kind: "reward", status: "completed", title: "รับรางวัลเช็กอิน", description: "รางวัลเช็กอินวันที่ 5", date: "2026-11-06T09:05:00+07:00", coins: 1, note: "คอยน์โบนัสใช้สร้างป้ายได้ แต่ไม่สามารถโอนให้ผู้อื่นได้" },
  { id: "DEMO-TU-0105", kind: "topup", status: "pending", title: "เติมคอยน์ 50 บาท", description: "PromptPay · รอตรวจสอบการชำระ", date: "2026-11-05T18:24:00+07:00", coins: 50, baht: 50, note: "รายการตัวอย่างที่ยังไม่สำเร็จ ยอดนี้ยังไม่รวมในคอยน์คงเหลือ" },
  { id: "DEMO-TR-0104", kind: "transfer", status: "completed", title: "โอนคอยน์ให้เพื่อน", description: "ผู้รับ m•••@example.com", date: "2026-11-05T14:10:00+07:00", coins: -20, note: "ตัวอย่างการโอนเฉพาะคอยน์ที่โอนได้ ไม่รวมคอยน์โบนัส" },
  { id: "DEMO-PS-0103", kind: "poster", status: "completed", title: "สร้างป้าย Mobile Legends", description: "เทมเพลต A · 12 สกิน", date: "2026-11-04T16:35:00+07:00", coins: -18.6, note: "ตัวอย่างค่าจัดสกินและเทมเพลตแบบไม่มีลายน้ำ" },
  { id: "DEMO-TU-0102", kind: "topup", status: "failed", title: "เติมคอยน์ 100 บาท", description: "PromptPay · รายการหมดอายุ", date: "2026-11-03T11:50:00+07:00", coins: 105, baht: 100, note: "รายการตัวอย่างหมดอายุ ไม่มีคอยน์เพิ่มและไม่มีการตัดยอด" },
  { id: "DEMO-RW-0101", kind: "reward", status: "completed", title: "รับรางวัลเช็กอิน", description: "รางวัลเช็กอินวันที่ 4", date: "2026-11-03T08:30:00+07:00", coins: 0.5, note: "คอยน์โบนัสใช้สร้างป้ายได้ แต่ไม่สามารถโอนให้ผู้อื่นได้" },
];
