# Candidate Checker — บันทึกการพัฒนา

## 2026-06-12

### Feature: ระบุรูปแบบสัมภาษณ์ Online/Onsite ในหน้านัดหมายสัมภาษณ์

- หน้านัดหมาย (`?schedule=`) เพิ่มปุ่มเลือก **สัมภาษณ์ Online / สัมภาษณ์ Onsite** (กดซ้ำเพื่อยกเลิกการเลือก)
  - เลือก Online → มีช่องกรอก **Link สัมภาษณ์** (เช่น Google Meet)
  - เลือก Onsite → มีช่องกรอก **สถานที่สัมภาษณ์** (เช่น ระบุสาขา)
- fields ใหม่ใน Firestore: `interviewMode` (`Online`/`Onsite`/`''`), `interviewLink`, `interviewPlace` — ตอนบันทึกจะเคลียร์ field ฝั่งที่ไม่ได้เลือกเป็นค่าว่างเสมอ
- จุดแสดงผล: ตารางหลัก (Agency เห็น badge + Link คลิกได้/สถานที่ ใต้วันเวลานัด), ปฏิทินสาธารณะ (day view + การ์ด), หน้า `?interview=`, CSV export (คอลัมน์ "รูปแบบสัมภาษณ์" + "Link/สถานที่สัมภาษณ์")
- Admin แก้ไขรูปแบบ/Link/สถานที่ได้จาก inline edit ในตารางหลัก
- ฝั่ง `hr-portal` อัปเดตคู่กัน: ตารางปฏิทินเพิ่มคอลัมน์ "รูปแบบ" + modal แก้ไขมี dropdown รูปแบบสัมภาษณ์
- **หมายเหตุ:** ข้อความในช่องหมายเหตุ (`interviewComment`) และข้อมูลรูปแบบสัมภาษณ์ทั้งหมด แสดงให้ Agency เห็นในตารางหลักด้วย

## 2026-06-11

### Feature: ส่ง Email แจ้งอัตโนมัติเมื่อผู้สมัครผ่าน AI Prescreen (PR #25, #28)

- หน้าเว็บเรียก Google Apps Script (`action: "notifyHrPass"`) อัตโนมัติเมื่อ (1) Agency อัปโหลด resume แล้ว AI ให้ผล "ผ่าน" หรือ (2) Admin แก้ผล AI เป็น "ผ่าน" ด้วยตนเอง
- ฝั่ง Apps Script: ไฟล์ `apps-script/notifyHrPass.gs` + คู่มือติดตั้ง `apps-script/README.md`
- หา email ผู้รับจาก Google Sheet **Manpower_Status** (ID `1od3mh-iw2POMD-e7E_4P7S0FtFUNeBoRj643TqF_4EI`) คอลัมน์ `Store_No` ↔ `HR_Email` — `location` ของผู้สมัครรูปแบบ `"1-Lardprao"` ตัดเอารหัสหน้า `-`
- **แยกผู้รับตามตำแหน่ง (PR #28):**
  - `Sales Executive` → HR สาขา (lookup จากชีต)
  - ตำแหน่งอื่นๆ → `Recruit_Operations@cpaxtra.co.th` (ค่าคงที่ `RECRUIT_OPS_EMAIL`)
- ใช้ `MailApp.sendEmail` — โควต้า Gmail ทั่วไป ~100 ฉบับ/วัน
- หลังแก้ `.gs` ทุกครั้งต้อง **Deploy → New version** (ใช้ deployment เดิม URL ไม่เปลี่ยน)

### Feature: หน้าลงเวลานัดหมายสัมภาษณ์สำหรับ HR (ไม่ต้อง Login) (PR #26, #27)

- เปิดผ่าน URL `?schedule=<candidateDocId>` — ลิงก์แนบท้าย email แจ้ง HR
- ฟอร์มกรอก: วันสัมภาษณ์ / เวลา / ผู้สัมภาษณ์ / หมายเหตุ → บันทึกลง Firestore (`updateDoc`) ผ่าน `signInAnonymously`
- Fix (PR #27): `?schedule=` ค่าว่างต้องคืน `null` ไม่ใช่ string ว่าง — กันตกไปหน้า login

### โครงสร้างระบบที่เกี่ยวข้อง

- Firebase Firestore โปรเจกต์ `recruit-operation-project`, collection `candidates` — ใช้ร่วมกับ repo `hr-portal` (tab ปฏิทินสัมภาษณ์) แบบ real-time ผ่าน `onSnapshot`
- fields สัมภาษณ์: `interviewDate`, `interviewTime`, `interviewStatus`, `interviewer`, `interviewComment`
- Apps Script URL: `AKfycbyHSv_7wt3jlYJQWVlnE5GF06y3tgf-FLcyz6AQDnNoBtIs0PqfCVw5AM_SYlSNxJHYhg`
- Deploy บน GitHub Pages: `https://recruitmakrocareer.github.io/Check-Duplicate/`

### งานค้าง

- ลบฟังก์ชันทดสอบ `testLookup` / `testSendEmail` ออกจาก Apps Script แล้ว deploy ใหม่
- กรอบ CAUTION ใน Outlook ขึ้นทุกครั้งเพราะผู้ส่งเป็น gmail ภายนอกองค์กร — ถ้าต้องการเอาออกต้องให้ IT cpaxtra.co.th whitelist `recruitcpaxtramakro@gmail.com`
