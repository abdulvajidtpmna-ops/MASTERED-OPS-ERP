/**
 * MLC ERP - Batches, Sessions & After-Sales Module
 * Handles after-sales call logging, batch assignment, automated 4-installment schedule generation,
 * session timetable management and audience routing (ALL vs BHA_ONLY).
 */

/**
 * 1. Log After-Sales Call (OPS_EXEC / OPS_ADMIN)
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
    updateRecord('Students', studentId, { status: 'DROPPED' }, currentUser.id);
  }

  logAudit('LOG_AFTER_SALES', 'AfterSalesCalls', logRecord.id, { student_id: studentId, outcome: outcome }, currentUser);

  return { ok: true, data: logRecord };
}

/**
 * 2. Assign Batch to Student (OPS_EXEC / OPS_ADMIN)
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

  // Update Student status to ASSIGNED and assign batch_id
  updateRecord('Students', studentId, {
    batch_id: batchId,
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
    message: 'You have been enrolled into batch ' + (batch.name || batch.batch_code) + '. Check your timetable for upcoming class schedules.',
    type: 'BATCH_ASSIGNED',
    is_read: false
  }, currentUser.id);

  logAudit('ASSIGN_BATCH', 'Students', studentId, { batch_id: batchId }, currentUser);

  return { ok: true, data: { student_id: studentId, batch_id: batchId, status: 'ASSIGNED' } };
}

/**
 * 3. Start Batch & Generate Automated Fee Installments
 * Creates:
 *  - Rs 2,450 balance-registration due on start date
 *  - Installment 1 due start + 7 days
 *  - Installments 2, 3, 4 due at +30, +60, +90 days
 *  - Amount = (total_fee - 500 - 2450) / 4 with last installment absorbing rounding
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

  // Retrieve all assigned students for this batch
  var allStudents = getTableData('Students');
  var batchStudents = allStudents.filter(function(s) {
    return s.batch_id === batchId && s.status !== 'DROPPED';
  });

  var feePlans = getTableData('FeePlans');

  for (var i = 0; i < batchStudents.length; i++) {
    var student = batchStudents[i];
    updateRecord('Students', student.id, { status: 'ACTIVE' }, currentUser.id);

    // Locate FeePlan
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
      updateRecord('FeePlans', studentPlan.id, { status: 'ACTIVE' }, currentUser.id);
    }

    // 1. Balance Registration item due on Batch Start Date
    var balanceRegDueDate = startDateStr;
    insertRecord('Installments', {
      fee_plan_id: planId,
      student_id: student.student_id,
      installment_no: 0.5,
      title: 'Balance Registration Fee',
      due_date: balanceRegDueDate,
      amount: balanceRegAmount,
      status: 'UNPAID',
      paid_amount: 0,
      postpone_count: 0
    }, currentUser.id);

    // 2. Four Course Installments
    var installmentBase = Math.floor(remainingTuition / 4);
    var remainder = remainingTuition - (installmentBase * 4);

    // Installment 1: Due start + 7 days
    var inst1Date = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    insertRecord('Installments', {
      fee_plan_id: planId,
      student_id: student.student_id,
      installment_no: 1,
      title: '1st Course Installment',
      due_date: inst1Date,
      amount: installmentBase,
      status: 'UNPAID',
      paid_amount: 0,
      postpone_count: 0
    }, currentUser.id);

    // Installment 2: Due start + 7 + 30 days
    var inst2Date = new Date(startDate.getTime() + (7 + 30) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    insertRecord('Installments', {
      fee_plan_id: planId,
      student_id: student.student_id,
      installment_no: 2,
      title: '2nd Course Installment',
      due_date: inst2Date,
      amount: installmentBase,
      status: 'UNPAID',
      paid_amount: 0,
      postpone_count: 0
    }, currentUser.id);

    // Installment 3: Due start + 7 + 60 days
    var inst3Date = new Date(startDate.getTime() + (7 + 60) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    insertRecord('Installments', {
      fee_plan_id: planId,
      student_id: student.student_id,
      installment_no: 3,
      title: '3rd Course Installment',
      due_date: inst3Date,
      amount: installmentBase,
      status: 'UNPAID',
      paid_amount: 0,
      postpone_count: 0
    }, currentUser.id);

    // Installment 4: Due start + 7 + 90 days (absorbs rounding remainder)
    var inst4Date = new Date(startDate.getTime() + (7 + 90) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    insertRecord('Installments', {
      fee_plan_id: planId,
      student_id: student.student_id,
      installment_no: 4,
      title: '4th Course Installment',
      due_date: inst4Date,
      amount: installmentBase + remainder,
      status: 'UNPAID',
      paid_amount: 0,
      postpone_count: 0
    }, currentUser.id);

    // Notify student of batch activation
    insertRecord('Notifications', {
      recipient_user_id: student.student_id,
      role_target: 'STUDENT',
      title: 'Batch Commenced: ' + (batch.name || batch.batch_code),
      message: 'Your batch has officially started! Please review your timetable and fee schedule in the portal.',
      type: 'BATCH_STARTED',
      is_read: false
    }, currentUser.id);
  }

  logAudit('START_BATCH', 'Batches', batchId, { student_count: batchStudents.length, start_date: startDateStr }, currentUser);

  return {
    ok: true,
    data: {
      batch_id: batchId,
      status: 'ACTIVE',
      activated_students: batchStudents.length
    }
  };
}

/**
 * 4. Create Scheduled Class Session
 */
function createClassSession(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'TRAINER']);

  var sessionId = 'SES-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  var session = insertRecord('ClassSessions', {
    session_id: sessionId,
    batch_id: payload.batch_id,
    module_code: payload.module_code,
    topic_id: payload.topic_id || '',
    trainer_id: payload.trainer_id || currentUser.trainer_id || '',
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    hours: Number(payload.hours) || 2,
    audience: payload.audience || 'ALL', // ALL | BHA_ONLY
    status: 'PLANNED',
    topics_covered_note: payload.topics_covered_note || ''
  }, currentUser.id);

  // Notify batch participants of timetable update
  insertRecord('Notifications', {
    recipient_user_id: 'BATCH_' + payload.batch_id,
    role_target: 'STUDENT',
    title: 'New Session Scheduled: ' + payload.module_code,
    message: 'Session scheduled for ' + payload.date + ' at ' + payload.start_time,
    type: 'TIMETABLE_UPDATE',
    is_read: false
  }, currentUser.id);

  logAudit('CREATE_SESSION', 'ClassSessions', session.id, { batch_id: payload.batch_id, date: payload.date }, currentUser);

  return { ok: true, data: session };
}

/**
 * 5. Get Batches & Filter
 */
function getBatchesList(filters, currentUser) {
  var batches = getTableData('Batches');
  if (currentUser.role === 'TRAINER') {
    // Row level filter: trainer sees only assigned batches
    batches = batches.filter(function(b) {
      return b.default_trainer_id === currentUser.trainer_id || b.default_trainer_id === currentUser.id;
    });
  }
  return { ok: true, data: batches };
}
