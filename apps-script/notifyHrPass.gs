/**
 * ===== แจ้งเตือน HR สาขาทาง Email เมื่อผู้สมัครผ่าน AI Prescreen =====
 *
 * วิธีติดตั้ง: ดู apps-script/README.md
 *
 * หน้าเว็บ Candidate Checker จะ POST มาด้วย payload:
 * {
 *   action: "notifyHrPass",
 *   location: "001-สาขา...",   // รูปแบบ Store_No-Store_Name
 *   firstName, lastName, tel, email, position, agency, aiDetail, resumeLink
 * }
 */

// ⚠️ แก้ ID ให้ตรงกับ Google Sheet config (Manpower_Status) ของจริง
var HR_EMAIL_SHEET_ID = '1od3mh-iw2POMD-e7E_4P7S0FtFUNeBoRj643TqF_4EI';
var HR_EMAIL_SHEET_NAME = 'Manpower_Status';

// ตำแหน่งอื่นๆ ที่ไม่ใช่ Sales Executive ส่งให้ทีมกลางแทน HR สาขา
var RECRUIT_OPS_EMAIL = 'Recruit_Operations@cpaxtra.co.th';

/**
 * เรียกจาก doPost เดิม — เพิ่มบรรทัดนี้ไว้ต้นฟังก์ชัน doPost:
 *
 *   var data = JSON.parse(e.postData.contents);
 *   if (data.action === 'notifyHrPass') return notifyHrPass(data);
 */
function notifyHrPass(data) {
  try {
    // location รูปแบบ "001-ชื่อสาขา" → ดึงรหัสสาขาส่วนหน้า
    var storeNo = String(data.location || '').split('-')[0].trim();
    if (!storeNo) return jsonOut({ status: 'error', message: 'no location' });

    // แยกผู้รับตามตำแหน่ง: Sales Executive → HR สาขา / ตำแหน่งอื่นๆ → Recruit Operations
    var isSalesExecutive = String(data.position || '').trim().toLowerCase() === 'sales executive';
    var toEmail, greeting;
    if (isSalesExecutive) {
      toEmail = lookupHrEmail(storeNo);
      if (!toEmail) return jsonOut({ status: 'error', message: 'HR email not found for store ' + storeNo });
      greeting = 'เรียน HR สาขา ' + (data.location || storeNo);
    } else {
      toEmail = RECRUIT_OPS_EMAIL;
      greeting = 'เรียน ทีม Recruit Operations';
    }

    var fullName = (data.firstName || '') + ' ' + (data.lastName || '');
    var subject = '[Candidate Checker] ผู้สมัครผ่าน AI Prescreen — ' + fullName + ' (' + (data.position || '-') + ')';
    var body =
      greeting + '\n\n' +
      'มีผู้สมัครใหม่ผ่านการคัดกรองเบื้องต้น (AI Prescreen) แล้ว รายละเอียดดังนี้\n\n' +
      'ชื่อ-นามสกุล: ' + fullName + '\n' +
      'ตำแหน่ง: ' + (data.position || '-') + '\n' +
      'สาขา: ' + (data.location || '-') + '\n' +
      'เบอร์โทร: ' + (data.tel || '-') + '\n' +
      'Email: ' + (data.email || '-') + '\n' +
      'Agency: ' + (data.agency || '-') + '\n' +
      'ผล AI: ' + (data.aiDetail || '-') + '\n' +
      (data.resumeLink ? 'Resume: ' + data.resumeLink + '\n' : '') +
      '\n--- ลิงก์สำหรับ HR (ไม่ต้อง Login) ---\n' +
      'ลงเวลานัดหมายสัมภาษณ์:\n' +
      'https://recruitmakrocareer.github.io/Check-Duplicate/?schedule=' + (data.candidateId || '') + '\n\n' +
      'บันทึกผลสัมภาษณ์ (ใช้หลังสัมภาษณ์เสร็จ):\n' +
      'https://recruitmakrocareer.github.io/Check-Duplicate/?interview=' + (data.candidateId || '') + '\n';

    MailApp.sendEmail(toEmail, subject, body);
    return jsonOut({ status: 'success' });
  } catch (err) {
    return jsonOut({ status: 'error', message: String(err) });
  }
}

/** หา email HR จากชีต config โดยจับคู่คอลัมน์ Store_No กับคอลัมน์ HR_Email */
function lookupHrEmail(storeNo) {
  var sheet = SpreadsheetApp.openById(HR_EMAIL_SHEET_ID).getSheetByName(HR_EMAIL_SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var colStore = headers.indexOf('Store_No');
  var colEmail = headers.indexOf('HR_Email');
  if (colStore === -1 || colEmail === -1) return null;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][colStore]).trim() === storeNo) {
      var email = String(values[i][colEmail]).trim();
      if (email) return email;
    }
  }
  return null;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
