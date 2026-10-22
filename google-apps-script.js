/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: DATA DELETION REQUEST HANDLER FOR DOCUMENTREADER
 * Target Spreadsheet: https://docs.google.com/spreadsheets/d/1vOf8L0QNZjR_V-g5jE8FhhM0NaBjKCRCWFEe8Bkr8Ac/edit
 * Spreadsheet ID: 1vOf8L0QNZjR_V-g5jE8FhhM0NaBjKCRCWFEe8Bkr8Ac
 * ============================================================================
 */

var SPREADSHEET_ID = "1vOf8L0QNZjR_V-g5jE8FhhM0NaBjKCRCWFEe8Bkr8Ac";

/**
 * Handle HTTP POST requests sent from the web form
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent requests
  lock.tryLock(10000);

  try {
    var sheet;
    try {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    } catch (err) {
      sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    }

    // Auto-create and format header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Full Phone Number",
        "Country Code",
        "Phone Number",
        "Country",
        "Reason",
        "Status"
      ]);
      
      // Style headers
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#3525cd");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    // Parse incoming payload
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = new Date();
    var countryCode = (data.countryCode || "").toString().trim();
    var phoneNumber = (data.phoneNumber || data.phone || "").toString().trim().replace(/\s+/g, "");
    // Generate fullPhoneNumber without any spaces between code and phone number (e.g. +8801812386610)
    var fullPhone = (data.fullPhoneNumber || data.fullPhone || (countryCode + phoneNumber)).toString().trim().replace(/\s+/g, "");
    var countryName = (data.countryName || "").toString().trim();
    var reason = (data.reason || "").toString().trim();
    var status = "Pending Deletion";

    // Prefix phone numbers with a single quote (') to preserve formatting in Google Sheets
    sheet.appendRow([
      timestamp,
      "'" + fullPhone,
      "'" + countryCode,
      "'" + phoneNumber,
      countryName,
      reason,
      status
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Data deletion request recorded successfully.",
      row: sheet.getLastRow(),
      fullPhoneNumber: fullPhone
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle HTTP GET requests for testing the endpoint in a browser
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    spreadsheetId: SPREADSHEET_ID,
    message: "DocumentReader Data Deletion Webhook is online and ready to receive requests."
  })).setMimeType(ContentService.MimeType.JSON);
}
