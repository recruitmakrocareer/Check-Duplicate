// ====================================================
// ✅ ใส่ OpenAI API Key ของคุณตรงนี้ (fallback กรณีไม่ได้ส่งมาจาก client)
const OPENAI_API_KEY = "sk-proj-xxxx"; // ← เปลี่ยนตรงนี้
// ====================================================

function syncGmailEmails() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('GmailCache');
    if (!sheet) { sheet = ss.insertSheet('GmailCache'); }
    var existingData = sheet.getDataRange().getValues();
    var emailSet = {};
    existingData.forEach(function(row) {
      if (row[0]) {
        var email = row[0].toString().toLowerCase().trim();
        if (email.indexOf('@') !== -1) emailSet[email] = true;
      }
    });
    var query = 'newer_than:1y ("Job Application" OR "ใบสมัครงาน" OR "JobThai")';
    var threads = GmailApp.search(query, 0, 500);
    var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    threads.forEach(function(thread) {
      var messages = thread.getMessages();
      messages.forEach(function(msg) {
        var content = msg.getPlainBody() + " " + msg.getBody();
        var matches = content.match(emailRegex);
        if (matches) {
          matches.forEach(function(email) {
            var e = email.toLowerCase().trim();
            var blacklist = ['jobthai.com', 'cpaxtra.co.th', 'no-reply', 'application', 'google.com'];
            if (!blacklist.some(word => e.indexOf(word) !== -1)) emailSet[e] = true;
          });
        }
      });
    });
    var uniqueEmails = Object.keys(emailSet);
    sheet.clear();
    sheet.getRange(1, 1).setValue("Email Database");
    if (uniqueEmails.length > 0) {
      var output = uniqueEmails.map(function(e) { return [e]; });
      sheet.getRange(2, 1, output.length, 1).setValues(output);
    }
    return "Synced " + uniqueEmails.length + " emails.";
  } catch (e) { return "Error: " + e.toString(); }
}

function doGet(e) {
  if (e.parameter.action === 'getGmail') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('GmailCache');
    var data = [];
    if (sheet) {
      var values = sheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0]) data.push(values[i][0].toString().toLowerCase().trim());
      }
    }
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("System Online").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ✅ วิเคราะห์ Resume ด้วย OpenAI (ผ่าน Apps Script เพื่อหลีกเลี่ยง CORS)
    if (data.action === 'analyzeResume') {
      // ใช้ API key ที่ส่งมาจาก client (เก็บใน Firestore) ถ้าไม่มีใช้ค่า fallback
      var apiKey = (data.openai_api_key && data.openai_api_key.trim()) ? data.openai_api_key.trim() : OPENAI_API_KEY;

      var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        payload: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: data.prompt }],
          response_format: { type: "json_object" }
        }),
        muteHttpExceptions: true
      });

      var responseCode = response.getResponseCode();
      var result = JSON.parse(response.getContentText());

      if (responseCode !== 200 || result.error) {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: result.error ? result.error.message : ("OpenAI Error " + responseCode) })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var content = JSON.parse(result.choices[0].message.content);
      var resultVal = content.result === 'ผ่าน' ? 'ผ่าน' : 'ไม่ผ่าน';

      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", result: resultVal, detail: content.detail || "" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // เดิม: อัปโหลดไฟล์ไป Google Drive
    var folder = DriveApp.getFolderById("1l5ZouRZjjN2R8a2-_fQkGsW1Vn1Jo_l3");
    var blob = Utilities.newBlob(Utilities.base64Decode(data.fileData), data.mimeType, data.fileName);
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(f) {}
    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", url: file.getUrl(), fileName: data.fileName })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
