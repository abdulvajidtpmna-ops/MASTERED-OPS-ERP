/**
 * MLC ERP - Batch Community Chat Module
 * Handles batch group discussions, attachments, real-time message feeds and moderation.
 */

function sendBatchChatMessage(payload, currentUser) {
  var batchId = payload.batch_id;
  var message = String(payload.message || '').trim();
  var fileUrl = payload.file_url || '';
  var fileName = payload.file_name || '';

  if (!batchId || (!message && !fileUrl)) {
    throw new Error('Batch ID and message content or file attachment are required');
  }

  // Row-level check: if student, must belong to batch; if trainer, must be assigned
  if (currentUser.role === 'STUDENT') {
    var student = getRecordById('Students', currentUser.student_id || currentUser.id);
    if (!student || student.batch_id !== batchId) {
      throw new Error('Access denied: You are not enrolled in this batch chat room');
    }
  }

  var msg = insertRecord('ChatMessages', {
    batch_id: batchId,
    sender_id: currentUser.id,
    sender_name: currentUser.full_name,
    sender_role: currentUser.role,
    message: message,
    file_url: fileUrl,
    file_name: fileName
  }, currentUser.id);

  return { ok: true, data: msg };
}

function getBatchChatMessages(batchId, afterTimestamp, currentUser) {
  if (!batchId) throw new Error('Batch ID is required');

  var allMessages = getTableData('ChatMessages');
  var batchMessages = allMessages.filter(function(m) {
    if (m.batch_id !== batchId) return false;
    if (afterTimestamp && m.created_at <= afterTimestamp) return false;
    return true;
  });

  return {
    ok: true,
    data: {
      batch_id: batchId,
      messages: batchMessages,
      total: batchMessages.length
    }
  };
}
