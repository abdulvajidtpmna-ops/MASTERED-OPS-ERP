/**
 * MLC ERP - Batches, Sessions, Timetable & After-Sales Module
 * Handles batch creation with strict BH-naming format, slot management,
 * start date postponement with history tracking, after-sales deferrals, batch changes,
 * and bulk timetable scheduling.
 */

/**
 * 1. Create Batch (OPS_EXEC / OPS_ADMIN / MAIN_ADMIN)
 * Format: BH + number (e.g. BH17, BH19). Slot: 8:30 AM | 10:30 AM | 12:30 PM.
 */
function createBatch(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var rawName = String(payload.name || payload.batch_code || '').trim().toUpperCase();
  var slot = String(payload.slot || '').trim();
  var startDate = String(payload.start_date || '').trim();
  var defaultTrainerId = payload.default_trainer_id || 'TR-101';
  var courseCode = payload.course_code || 'HRCA';
  var mode = payload.mode || 'ONLINE';

  // Strict Regex Validation: ^BH\d+$
  var bhRegex = /^BH\d+$/;
  if (!bhRegex.test(rawName)) {
    throw new Error("Batch name must strictly follow the format 'BH' + number (e.g. BH17, BH19, BH20).");
  }

  // Check Uniqueness
  var allBatches = getTableData('Batches');
  for (var b = 0; b < allBatches.length; b++) {
    if (allBatches[b].batch_code === rawName || allBatches[b].name === rawName) {
      throw new Error("A batch with the name '" + rawName + "' already exists.");
    }
  }

  // Validate Slot
  var allowedSlots = ['8:30 AM', '10:30 AM', '12:30 PM'];
  if (allowedSlots.indexOf(slot) === -1) {
    throw new Error("Invalid time slot. Must be exactly '8:30 AM', '10:30 AM', or '12:30 PM'.");
  }

  // Validate Start Date
  if (!startDate) {
    throw new Error('Start date is required.');
  }

  var newBatch = insertRecord('Batches', {
    batch_code: rawName,
    name: rawName,
    slot: slot,
    start_date: startDate,
    original_start_date: startDate,
    start_date_history_json: '[]',
    course_code: courseCode,
    mode: mode,
    status: 'PLANNED',
    default_trainer_id: defaultTrainerId
  }, currentUser.id);

  logAudit('CREATE_BATCH', 'Batches', newBatch.id, { name: rawName, slot: slot, start_date: startDate }, currentUser);

  return { ok: true, data: newBatch };
}

/**
 * 2. Postpone Batch Start Date
 * Pick new date + reason -> save history -> notify assigned students.
 * Blocked if batch has held classes (status === 'DONE').
 */
function postponeBatchStartDate(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var batchId = payload.batch_id;
  var newStartDate = payload.new_start_date;
  var reason = payload.reason || '';

  if (!batchId || !newStartDate || !reason) {
    throw new Error('Batch ID, new start date, and reason are required.');
  }

  var batch = getRecordById('Batches', batchId);
  if (!batch) throw new Error('Batch not found');

  // Check if batch has any class session marked as held ('DONE')
  var sessions = getTableData('ClassSessions').filter(function(s) {
    return s.batch_id === batchId && s.status === 'DONE';
  });

  if (sessions.length > 0 && currentUser.role !== 'MAIN_ADMIN') {
    throw new Error('Cannot postpone start date: this batch already has classes marked as held.');
  }

  var oldStartDate = batch.start_date || batch.original_start_date || '';
  var history = [];
  try {
    history = JSON.parse(batch.start_date_history_json || '[]');
  } catch (e) {
    history = [];
  }

  history.push({
    old_date: oldStartDate,
    new_date: newStartDate,
    reason: reason,
    by: currentUser.full_name || currentUser.id,
    when: new Date().toISOString()
  });

  var updatedBatch = updateRecord('Batches', batchId, {
    start_date: newStartDate,
    original_start_date: batch.original_start_date || oldStartDate,
    start_date_history_json: JSON.stringify(history)
  }, currentUser.id);

  // Notify assigned students
  var assignedStudents = getTableData('Students').filter(function(s) {
    return s.batch_id === batchId && s.status !== 'DROPPED';
  });

  for (var i = 0; i < assignedStudents.length; i++) {
    insertRecord('Notifications', {
      recipient_user_id: assignedStudents[i].student_id,
      role_target: 'STUDENT',
      title: 'Batch Start Date Updated',
      message: 'Your batch ' + (batch.name || batch.batch_code) + ' start date has been moved to ' + newStartDate + '. Reason: ' + reason,
      type: 'BATCH_POSTPONED',
      is_read: false
    }, currentUser.id);
  }

  logAudit('POSTPONE_BATCH_START', 'Batches', batchId, { old_date: oldStartDate, new_date: newStartDate, reason: reason }, currentUser);

  return { ok: true, data: updatedBatch, notified_students_count: assignedStudents.length };
}

/**
 * 3. Update Batch (Name & Slot editable until class held)
 */
function updateBatch(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var batchId = payload.batch_id || payload.id;
  if (!batchId) throw new Error('Batch ID is required');

  var batch = getRecordById('Batches', batchId);
  if (!batch) throw new Error('Batch not found');

  var heldClasses = getTableData('ClassSessions').filter(function(s) {
    return s.batch_id === batchId && s.status === 'DONE';
  });

  var updates = {};

  if (payload.name) {
    var rawName = String(payload.name).trim().toUpperCase();
    if (!/^BH\d+$/.test(rawName)) {
      throw new Error("Batch name must strictly follow the format 'BH' + number (e.g. BH17).");
    }
    if (heldClasses.length > 0 && currentUser.role !== 'MAIN_ADMIN') {
      throw new Error('Batch name is locked because classes have already commenced.');
    }
    updates.name = rawName;
    updates.batch_code = rawName;
  }

  if (payload.slot) {
    var allowedSlots = ['8:30 AM', '10:30 AM', '12:30 PM'];
    if (allowedSlots.indexOf(payload.slot) === -1) {
      throw new Error("Invalid time slot. Must be '8:30 AM', '10:30 AM', or '12:30 PM'.");
    }
    if (heldClasses.length > 0 && currentUser.role !== 'MAIN_ADMIN') {
      throw new Error('Batch slot is locked because classes have already commenced.');
    }
    updates.slot = payload.slot;
  }

  if (payload.default_trainer_id) updates.default_trainer_id = payload.default_trainer_id;
  if (payload.mode) updates.mode = payload.mode;

  var updated = updateRecord('Batches', batchId, updates, currentUser.id);
  logAudit('UPDATE_BATCH', 'Batches', batchId, updates, currentUser);

  return { ok: true, data: updated };
}

/**
 * 4. Assign Batch to Student (OPS_EXEC / OPS_ADMIN)
 */
function assignBatch(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var studentId = payload.student_id;
  var batchId = payload.batch_id;

  if (!studentId || !batchId) throw new Error('Student ID and Batch ID are required');

  var student = getRecordById('Students', studentId);
  if (!student) throw new Error('Student not found');

  var batch = getRecordById('Batches', batchId);
  if (!batch) throw new Error('Batch not found');

  // Update Student assignment state
  updateRecord('Students', studentId, {
    batch_id: batchId,
    assignment_state: 'ASSIGNED',
    status: 'ASSIGNED'
  }, currentUser.id);

  // Upsert BatchStudents relation
  var existingBatchStudents = getTableData('BatchStudents');
  var alreadyInBatch = false;
  for (var i = 0; i < existingBatchStudents.length; i++) {
    if (existingBatchStudents[i].student_id === studentId && existingBatchStudents[i].batch_id === batchId) {
      alreadyInBatch = true;
      break;
    }
  }

  if (!alreadyInBatch) {
    insertRecord('BatchStudents', {
      batch_id: batchId,
      student_id: studentId,
      joined_at: new Date().toISOString(),
      status: 'ACTIVE'
    }, currentUser.id);
  }

  // Notify student
  insertRecord('Notifications', {
    recipient_user_id: student.student_id,
    role_target: 'STUDENT',
    title: 'Assigned to Batch: ' + (batch.name || batch.batch_code),
    message: 'You have been enrolled into batch ' + (batch.name || batch.batch_code) + ' (' + (batch.slot || '10:30 AM') + '). Check your timetable for upcoming class schedules.',
    type: 'BATCH_ASSIGNED',
    is_read: false
  }, currentUser.id);

  logAudit('ASSIGN_BATCH', 'Students', studentId, { batch_id: batchId }, currentUser);

  return { ok: true, data: { student_id: studentId, batch_id: batchId, status: 'ASSIGNED' } };
}

/**
 * 5. Defer Student ("Not for upcoming batch") -> Needed Month
 */
function deferStudent(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var studentId = payload.student_id;
  var neededMonth = payload.needed_month; // e.g. "2026-05"
  var reason = payload.reason || '';

  if (!studentId || !neededMonth) {
    throw new Error('Student ID and needed month (YYYY-MM) are required.');
  }

  var student = getRecordById('Students', studentId);
  if (!student) throw new Error('Student not found');

  updateRecord('Students', studentId, {
    assignment_state: 'DEFERRED',
    needed_month: neededMonth,
    batch_id: ''
  }, currentUser.id);

  logAudit('DEFER_STUDENT', 'Students', studentId, { needed_month: neededMonth, reason: reason }, currentUser);

  return { ok: true, data: { student_id: studentId, assignment_state: 'DEFERRED', needed_month: neededMonth } };
}

/**
 * 6. Change Batch for Assigned Student
 * Logs old batch -> new batch, reason, by, when; notifies student.
 */
function changeStudentBatch(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var studentId = payload.student_id;
  var newBatchId = payload.new_batch_id;
  var reason = payload.reason || '';

  if (!studentId || !newBatchId || !reason) {
    throw new Error('Student ID, new batch ID, and reason are required.');
  }

  var student = getRecordById('Students', studentId);
  if (!student) throw new Error('Student not found');

  var newBatch = getRecordById('Batches', newBatchId);
  if (!newBatch) throw new Error('Target batch not found');

  var oldBatchId = student.batch_id || '';
  var changeLogs = [];
  try {
    changeLogs = JSON.parse(student.batch_change_log_json || '[]');
  } catch (e) {
    changeLogs = [];
  }

  changeLogs.push({
    old_batch_id: oldBatchId,
    new_batch_id: newBatchId,
    reason: reason,
    by: currentUser.full_name || currentUser.id,
    when: new Date().toISOString()
  });

  updateRecord('Students', studentId, {
    batch_id: newBatchId,
    assignment_state: 'ASSIGNED',
    batch_change_log_json: JSON.stringify(changeLogs)
  }, currentUser.id);

  // Notify student
  insertRecord('Notifications', {
    recipient_user_id: student.student_id,
    role_target: 'STUDENT',
    title: 'Batch Changed to ' + (newBatch.name || newBatch.batch_code),
    message: 'Your batch has been transferred to ' + (newBatch.name || newBatch.batch_code) + ' (' + (newBatch.slot || '10:30 AM') + '). Reason: ' + reason,
    type: 'BATCH_CHANGED',
    is_read: false
  }, currentUser.id);

  logAudit('CHANGE_STUDENT_BATCH', 'Students', studentId, { old_batch: oldBatchId, new_batch: newBatchId, reason: reason }, currentUser);

  return { ok: true, data: { student_id: studentId, batch_id: newBatchId, assignment_state: 'ASSIGNED' } };
}

/**
 * 7. Get After Sales Page Data
 * Returns tabs: Pending After Sales, Deferred (by month), Batches Assigned.
 */
function getAfterSalesData(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'STAFF', 'DEPT_HEAD']);

  var students = getTableData('Students').filter(function(s) {
    return s.status !== 'DROPPED';
  });

  var batches = getTableData('Batches');
  var users = getTableData('Users');
  var calls = getTableData('AfterSalesCalls');

  var userMap = {};
  users.forEach(function(u) {
    userMap[u.id] = u.full_name;
    if (u.staff_id) userMap[u.staff_id] = u.full_name;
  });

  var batchSeatsMap = {};
  batches.forEach(function(b) {
    batchSeatsMap[b.id] = students.filter(function(s) { return s.batch_id === b.id; }).length;
  });

  var pendingList = [];
  var deferredList = [];
  var assignedList = [];

  students.forEach(function(s) {
    var salesPersonName = userMap[s.sales_staff_id] || s.sales_staff_id || 'Direct / Online';
    var studentCalls = calls.filter(function(c) { return c.student_id === s.student_id; });

    var item = {
      id: s.id,
      student_id: s.student_id,
      admission_no: s.admission_no,
      full_name: s.full_name,
      mobile: s.mobile,
      personal_email: s.personal_email,
      course_code: s.course_code,
      mode: s.mode,
      sales_staff_id: s.sales_staff_id,
      sales_person_name: salesPersonName,
      joined_date: s.joined_date || s.created_at?.substring(0, 10),
      assignment_state: s.assignment_state || (s.batch_id ? 'ASSIGNED' : 'PENDING'),
      needed_month: s.needed_month || '',
      batch_id: s.batch_id || '',
      batch_change_log_json: s.batch_change_log_json || '[]',
      call_count: studentCalls.length,
      last_call: studentCalls.length ? studentCalls[studentCalls.length - 1] : null
    };

    if (item.assignment_state === 'DEFERRED') {
      deferredList.push(item);
    } else if (item.assignment_state === 'ASSIGNED' && item.batch_id) {
      assignedList.push(item);
    } else {
      pendingList.push(item);
    }
  });

  var enhancedBatches = batches.map(function(b) {
    return {
      id: b.id,
      batch_code: b.batch_code,
      name: b.name,
      slot: b.slot || '10:30 AM',
      start_date: b.start_date || '',
      original_start_date: b.original_start_date || b.start_date,
      start_date_history_json: b.start_date_history_json || '[]',
      status: b.status,
      seats_assigned: batchSeatsMap[b.id] || 0,
      default_trainer_id: b.default_trainer_id || 'TR-101'
    };
  });

  return {
    ok: true,
    data: {
      pending: pendingList,
      deferred: deferredList,
      assigned: assignedList,
      batches: enhancedBatches
    }
  };
}

/**
 * 8. Log After-Sales Call (OPS_EXEC / OPS_ADMIN)
 */
function logAfterSalesCall(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var studentId = payload.student_id;
  var outcome = payload.outcome || 'POSITIVE'; // POSITIVE, RESCHEDULE, UNREACHABLE, DROPPED
  var preferredBatch = payload.preferred_batch || '';
  var preferredStartDate = payload.preferred_start_date || '';
  var notes = payload.notes || '';

  if (!studentId) throw new Error('Student ID is required');

  var logRecord = insertRecord('AfterSalesCalls', {
    student_id: studentId,
    called_by: currentUser.id,
    call_date: new Date().toISOString(),
    outcome: outcome,
    preferred_batch: preferredBatch,
    preferred_start_date: preferredStartDate,
    notes: notes
  }, currentUser.id);

  if (outcome === 'DROPPED') {
    updateRecord('Students', studentId, { status: 'DROPPED', assignment_state: 'DROPPED' }, currentUser.id);
  }

  logAudit('LOG_AFTER_SALES', 'AfterSalesCalls', logRecord.id, { student_id: studentId, outcome: outcome }, currentUser);

  return { ok: true, data: logRecord };
}

/**
 * 9. Start Batch & Generate Automated Fee Installments
 */
function startBatch(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN']);

  var batchId = payload.batch_id;
  var startDateStr = payload.start_date || new Date().toISOString().substring(0, 10);

  if (!batchId) throw new Error('Batch ID is required');

  var batch = updateRecord('Batches', batchId, {
    status: 'ACTIVE',
    start_date: startDateStr
  }, currentUser.id);

  if (!batch) throw new Error('Batch not found');

  var startDate = new Date(startDateStr);

  var allStudents = getTableData('Students');
  var batchStudents = allStudents.filter(function(s) {
    return s.batch_id === batchId && s.status !== 'DROPPED';
  });

  var feePlans = getTableData('FeePlans');

  for (var i = 0; i < batchStudents.length; i++) {
    var student = batchStudents[i];
    updateRecord('Students', student.id, { status: 'ACTIVE' }, currentUser.id);

    var studentPlan = null;
    for (var f = 0; f < feePlans.length; f++) {
      if (feePlans[f].student_id === student.student_id) {
        studentPlan = feePlans[f];
        break;
      }
    }

    var totalFee = Number(student.total_fee) || 25000;
    var registrationFee = 500;
    var balanceRegAmount = 2450;
    var remainingTuition = totalFee - registrationFee - balanceRegAmount;
    if (remainingTuition < 0) remainingTuition = 0;

    var planId = studentPlan ? studentPlan.id : Utilities.getUuid();
    if (!studentPlan) {
      studentPlan = insertRecord('FeePlans', {
        id: planId,
        student_id: student.student_id,
        total_fee: totalFee,
        registration_fee: registrationFee,
        balance_registration: balanceRegAmount,
        installment_count: 4,
        status: 'ACTIVE'
      }, currentUser.id);
    } else {
      updateRecord('FeePlans', planId, { status: 'ACTIVE' }, currentUser.id);
    }

    var existingInstallments = getTableData('Installments').filter(function(inst) {
      return inst.student_id === student.student_id;
    });

    if (existingInstallments.length === 0) {
      var d0 = new Date(startDate);
      insertRecord('Installments', {
        fee_plan_id: planId,
        student_id: student.student_id,
        installment_no: 0,
        amount_due: balanceRegAmount,
        due_date: formatDateYYYYMMDD(d0),
        status: 'PENDING',
        is_balance_registration: true
      }, currentUser.id);

      var instAmount = Math.floor(remainingTuition / 4);
      var offsets = [7, 30, 60, 90];

      for (var k = 1; k <= 4; k++) {
        var d = new Date(startDate);
        d.setDate(d.getDate() + offsets[k - 1]);
        var dueVal = (k === 4) ? (remainingTuition - (instAmount * 3)) : instAmount;

        insertRecord('Installments', {
          fee_plan_id: planId,
          student_id: student.student_id,
          installment_no: k,
          amount_due: dueVal,
          due_date: formatDateYYYYMMDD(d),
          status: 'PENDING',
          is_balance_registration: false
        }, currentUser.id);
      }
    }
  }

  logAudit('START_BATCH', 'Batches', batchId, { students_activated: batchStudents.length }, currentUser);

  return { ok: true, data: { batch_id: batchId, students_activated: batchStudents.length } };
}

/**
 * 10. Create Single Class Session (Timetable Entry)
 */
function createClassSession(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'TRAINER']);

  var session = insertRecord('ClassSessions', {
    session_id: 'SES-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
    batch_id: payload.batch_id,
    module_code: payload.module_code,
    topic_id: payload.topic_id || '',
    trainer_id: payload.trainer_id || currentUser.trainer_id || '',
    date: payload.date,
    start_time: payload.start_time || '10:00',
    end_time: payload.end_time || '12:00',
    hours: Number(payload.hours) || 2,
    audience: payload.audience || 'ALL',
    status: payload.status || 'PLANNED',
    topics_covered_note: payload.topics_covered_note || ''
  }, currentUser.id);

  insertRecord('Notifications', {
    recipient_user_id: 'BATCH_' + payload.batch_id,
    role_target: 'STUDENT',
    title: 'New Session Scheduled: ' + payload.module_code,
    message: 'Session scheduled for ' + payload.date + ' at ' + (payload.start_time || '10:00'),
    type: 'TIMETABLE_UPDATE',
    is_read: false
  }, currentUser.id);

  logAudit('CREATE_SESSION', 'ClassSessions', session.id, { batch_id: payload.batch_id, date: payload.date }, currentUser);

  return { ok: true, data: session };
}

/**
 * 11. Bulk Save Daily Timetable for All Active Batches
 */
function bulkSaveDailyTimetable(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'TRAINER']);

  var date = payload.date || new Date(Date.now() + 86400000).toISOString().substring(0, 10);
  var entries = payload.entries || [];

  if (!entries.length) {
    throw new Error('No batch timetable entries provided');
  }

  var existingSessions = getTableData('ClassSessions');
  var saved = [];

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.is_active === false) continue;

    var matchedSession = null;
    for (var s = 0; s < existingSessions.length; s++) {
      if (existingSessions[s].batch_id === entry.batch_id && existingSessions[s].date === date) {
        matchedSession = existingSessions[s];
        break;
      }
    }

    var sessionData = {
      batch_id: entry.batch_id,
      module_code: entry.module_code || 'M01',
      trainer_id: entry.trainer_id || entry.default_trainer_id || 'TR-101',
      date: date,
      start_time: entry.start_time || '10:00',
      end_time: entry.end_time || '12:00',
      hours: Number(entry.hours) || 2,
      audience: entry.audience || 'ALL',
      status: entry.status || 'PLANNED',
      topics_covered_note: entry.topics_covered_note || ''
    };

    var resultSession = null;
    if (matchedSession) {
      resultSession = updateRecord('ClassSessions', matchedSession.id, sessionData, currentUser.id);
    } else {
      sessionData.session_id = 'SES-' + Utilities.getUuid().substring(0, 8).toUpperCase();
      resultSession = insertRecord('ClassSessions', sessionData, currentUser.id);
    }
    saved.push(resultSession);

    insertRecord('Notifications', {
      recipient_user_id: 'BATCH_' + entry.batch_id,
      role_target: 'STUDENT',
      title: 'Timetable Updated: ' + sessionData.module_code + ' on ' + date,
      message: 'Class scheduled (' + sessionData.hours + ' hrs) from ' + sessionData.start_time + ' to ' + sessionData.end_time + ' with trainer ' + sessionData.trainer_id,
      type: 'TIMETABLE_UPDATE',
      is_read: false
    }, currentUser.id);
  }

  logAudit('BULK_SAVE_TIMETABLE', 'ClassSessions', 'BULK_' + date, { count: saved.length, date: date }, currentUser);

  return { ok: true, data: { count: saved.length, date: date, items: saved } };
}

/**
 * 12. Get Batches List
 */
function getBatchesList(filters, currentUser) {
  var batches = getTableData('Batches');
  if (currentUser.role === 'TRAINER') {
    batches = batches.filter(function(b) {
      return b.default_trainer_id === currentUser.trainer_id || b.default_trainer_id === currentUser.id;
    });
  }
  return { ok: true, data: batches };
}
