/**
 * MLC ERP - Backend Utilities
 * Mastered Language Coach / Mastered Skill Academy
 */

const CONFIG = {
  getSpreadsheetId: function() {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';
  },
  getDriveRootId: function() {
    return PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_ID') || '';
  },
  getHashPepper: function() {
    return PropertiesService.getScriptProperties().getProperty('HASH_PEPPER') || 'MLC_ERP_SECRET_PEPPER_2026';
  },
  getInstituteName: function() {
    return PropertiesService.getScriptProperties().getProperty('INSTITUTE_NAME') || 'Mastered Language Coach / Mastered Skill Academy';
  },
  getSenderName: function() {
    return PropertiesService.getScriptProperties().getProperty('SENDER_NAME') || 'Mastered Skill Academy Admissions & Operations';
  },
  getPlacementSenderEmail: function() {
    return PropertiesService.getScriptProperties().getProperty('PLACEMENT_SENDER_EMAIL') || 'masteredplacements@gmail.com';
  },
  getPlacementSenderName: function() {
    return PropertiesService.getScriptProperties().getProperty('PLACEMENT_SENDER_NAME') || 'Mastered Placement Cell';
  }
};

/**
 * Standard JSON Response Builder
 */
function jsonResponse(ok, data, error, code) {
  var payload = {
    ok: !!ok,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined && data !== null) payload.data = data;
  if (error !== undefined && error !== null) payload.error = error;
  if (code !== undefined && code !== null) payload.code = code;

  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get active spreadsheet handle
 */
function getDb() {
  var sheetId = CONFIG.getSpreadsheetId();
  if (sheetId) {
    return SpreadsheetApp.openById(sheetId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Batch table reader: reads entire tab at once and returns array of objects mapped by header names
 */
function getTableData(sheetName, includeDeleted) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var headers = values[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowObj = { _rowIndex: i + 1 };
    var isEmpty = true;
    for (var j = 0; j < headers.length; j++) {
      var val = values[i][j];
      if (val !== "" && val !== null && val !== undefined) isEmpty = false;
      rowObj[headers[j]] = val;
    }
    if (!isEmpty) {
      if (!includeDeleted && (rowObj.is_deleted === true || rowObj.is_deleted === "TRUE" || rowObj.is_deleted === 1)) {
        continue;
      }
      rows.push(rowObj);
    }
  }
  return rows;
}

/**
 * Sanitize cell values against formula injection (starts with =, +, -, @)
 */
function sanitizeInput(val) {
  if (typeof val === 'string') {
    var trimmed = val.trim();
    if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
      return "'" + trimmed;
    }
    return trimmed;
  }
  return val;
}

/**
 * Sanitize whole record object
 */
function sanitizeRecord(obj) {
  var clean = {};
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      clean[k] = sanitizeInput(obj[k]);
    }
  }
  return clean;
}

/**
 * Append row to a sheet adhering to standard column schema
 */
function insertRecord(sheetName, record, userId) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet '" + sheetName + "' not found");

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var now = new Date().toISOString();

  if (!record.id) {
    record.id = Utilities.getUuid();
  }
  record.created_at = record.created_at || now;
  record.created_by = record.created_by || userId || 'SYSTEM';
  record.updated_at = now;
  record.updated_by = userId || 'SYSTEM';
  record.is_deleted = false;

  var cleanRecord = sanitizeRecord(record);
  var rowValues = headers.map(function(header) {
    var val = cleanRecord[header];
    return (val !== undefined && val !== null) ? val : "";
  });

  sheet.appendRow(rowValues);
  return cleanRecord;
}

/**
 * Update record by ID
 */
function updateRecord(sheetName, id, updates, userId) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet '" + sheetName + "' not found");

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;

  var headers = values[0].map(function(h) { return String(h).trim(); });
  var idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error("No 'id' column found in " + sheetName);

  var targetRowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(id)) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) return null;

  var now = new Date().toISOString();
  updates.updated_at = now;
  if (userId) updates.updated_by = userId;

  var cleanUpdates = sanitizeRecord(updates);

  for (var j = 0; j < headers.length; j++) {
    var colName = headers[j];
    if (cleanUpdates.hasOwnProperty(colName) && colName !== 'id' && colName !== 'created_at' && colName !== 'created_by') {
      sheet.getRange(targetRowIndex, j + 1).setValue(cleanUpdates[colName]);
    }
  }

  return getRecordById(sheetName, id);
}

/**
 * Soft delete record by ID
 */
function softDeleteRecord(sheetName, id, userId) {
  return updateRecord(sheetName, id, { is_deleted: true }, userId);
}

/**
 * Find single record by ID
 */
function getRecordById(sheetName, id) {
  var rows = getTableData(sheetName, true);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) {
      return rows[i];
    }
  }
  return null;
}

/**
 * Audit log entry helper
 */
function logAudit(action, entity, entityId, details, user) {
  try {
    var actorId = user ? (user.user_id || user.id || user.email) : 'ANONYMOUS';
    var actorRole = user ? (user.role || '') : '';
    insertRecord('AuditLog', {
      action: action,
      entity: entity,
      entity_id: entityId || '',
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
      actor_role: actorRole
    }, actorId);
  } catch (err) {
    Logger.log("Audit log failed: " + err.toString());
  }
}

/**
 * SHA-256 Hashing with salt + pepper
 */
function hashSecret(salt, secret) {
  var pepper = CONFIG.getHashPepper();
  var input = salt + pepper + secret;
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    txtHash += byteHex;
  }
  return txtHash;
}

/**
 * Generate cryptographically random hex token (32 bytes = 64 hex chars)
 */
function generateSecureToken() {
  var bytes = [];
  for (var i = 0; i < 32; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  return bytes.map(function(b) {
    var h = b.toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

/**
 * Indian Rupee currency formatting helper
 */
function formatINR(val) {
  var num = Number(val) || 0;
  var parts = num.toFixed(0).split('.');
  var lastThree = parts[0].substring(parts[0].length - 3);
  var otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return '₹' + res;
}
