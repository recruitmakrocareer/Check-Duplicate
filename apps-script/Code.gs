/**
 * Google Apps Script — Check-Duplicate AI Proxy
 *
 * วิธีใช้งาน:
 * 1. เปิด Apps Script ที่ใช้งานอยู่ (script.google.com)
 * 2. เพิ่มฟังก์ชัน handleAiAnalyze() ด้านล่างเข้าไปในไฟล์ Code.gs
 * 3. แก้ไขฟังก์ชัน doPost() ให้เรียก handleAiAnalyze() เมื่อ action === 'ai_analyze'
 * 4. Deploy ใหม่เป็น Web App (Execute as: Me, Who has access: Anyone)
 *
 * ตัวอย่างโครงสร้าง doPost() ที่ต้องการ:
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // --- เพิ่มบรรทัดนี้ในฟังก์ชัน doPost() ที่มีอยู่ ---
    if (data.action === 'ai_analyze') {
      return handleAiAnalyze(data);
    }
    // ----------------------------------------------------

    // โค้ดเดิมสำหรับอัปโหลดไฟล์ (ไม่ต้องแก้ไข)
    // ... existing file upload logic ...

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * เพิ่มฟังก์ชันนี้ในไฟล์ Code.gs ของ Apps Script
 * เรียก OpenAI API จาก server-side (ไม่มีปัญหา CORS)
 */
function handleAiAnalyze(data) {
  const apiKey = data.openai_api_key;
  const prompt = data.prompt;

  if (!apiKey || !prompt) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      error: 'Missing openai_api_key or prompt'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }),
    muteHttpExceptions: true
  });

  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    var errorData = {};
    try { errorData = JSON.parse(responseText); } catch (e) {}
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      error: (errorData.error && errorData.error.message) ? errorData.error.message : ('OpenAI Error ' + responseCode)
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var openaiResponse = JSON.parse(responseText);
  var aiContent = JSON.parse(openaiResponse.choices[0].message.content);
  var result = aiContent.result === 'ผ่าน' ? 'ผ่าน' : 'ไม่ผ่าน';

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    result: result,
    detail: aiContent.detail || ''
  })).setMimeType(ContentService.MimeType.JSON);
}
