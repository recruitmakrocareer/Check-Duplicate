# การติดตั้ง: ส่ง Email แจ้ง HR สาขาเมื่อผู้สมัครผ่าน AI Prescreen

ฝั่งหน้าเว็บ (index.html) ถูกแก้ไขแล้ว — จะเรียก Google Apps Script ด้วย `action: "notifyHrPass"` อัตโนมัติเมื่อ:
1. Agency อัปโหลด resume และ AI Prescreen ให้ผล **"ผ่าน"**
2. Admin แก้ผล AI เป็น **"ผ่าน"** ด้วยตนเอง

ฝั่ง Google Apps Script ต้องติดตั้งเพิ่มตามขั้นตอนนี้ (ทำครั้งเดียว):

## ขั้นตอน

### 1. เพิ่มคอลัมน์ `HR_Email` ใน Google Sheet config

เปิดชีต **Manpower_Status** (ชีตเดียวกับที่มี `Store_No`, `Store_Name`, `Position`)
เพิ่มคอลัมน์ใหม่ชื่อ **`HR_Email`** แล้วกรอก email ของ HR แต่ละสาขา เช่น

| Store_No | Store_Name | Position | HR_Email |
|---|---|---|---|
| 001 | สาขา A | ... | hr-001@company.com |
| 002 | สาขา B | ... | hr-002@company.com |

> ถ้าสาขาไหนไม่กรอก email ระบบจะข้ามการส่งของสาขานั้น (ไม่ error)

### 2. เพิ่มโค้ดใน Apps Script

1. เปิดโปรเจกต์ Apps Script ตัวเดิม (ตัวที่ deploy เป็น URL `AKfycbyHSv_...`)
2. สร้างไฟล์ใหม่ แล้ว copy เนื้อหาจาก `notifyHrPass.gs` ไปวาง
3. แก้ค่า `HR_EMAIL_SHEET_ID` เป็น Spreadsheet ID ของชีต config
   (ดูจาก URL ของชีต: `docs.google.com/spreadsheets/d/<ID>/edit`)
4. ในฟังก์ชัน `doPost` เดิม เพิ่ม 1 บรรทัดหลังจาก parse JSON:

```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.action === 'notifyHrPass') return notifyHrPass(data);   // ← เพิ่มบรรทัดนี้
  // ...โค้ดอัปโหลดไฟล์เดิม...
}
```

### 3. Deploy ใหม่

- กด **Deploy → Manage deployments → แก้ไข (ดินสอ) → Version: New version → Deploy**
- ใช้ deployment เดิม URL จะไม่เปลี่ยน — หน้าเว็บไม่ต้องแก้อะไรเพิ่ม

### 4. ทดสอบ

อัปโหลด resume ที่ผ่านเกณฑ์ใน Candidate Checker แล้วตรวจว่า HR สาขานั้นได้รับ email

## การแยกผู้รับตามตำแหน่ง

- ตำแหน่ง **Sales Executive** → ส่งให้ HR สาขา (lookup จากคอลัมน์ `HR_Email` ตาม `Store_No`)
- ตำแหน่งอื่นๆ ทั้งหมด → ส่งให้ `Recruit_Operations@cpaxtra.co.th` (ค่าคงที่ `RECRUIT_OPS_EMAIL` ใน `notifyHrPass.gs`)

## หมายเหตุ

- ใช้ `MailApp.sendEmail` — โควต้าส่งของบัญชี Google ทั่วไปคือ ~100 ฉบับ/วัน (Workspace ~1,500/วัน)
- email ผู้ส่งจะเป็นบัญชีเจ้าของ Apps Script deployment
