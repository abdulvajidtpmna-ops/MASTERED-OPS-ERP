/**
 * MLC ERP - Fee Management, Payment Collection & Postponement Module
 * Handles payment recording with idempotency, receipt generation,
 * installment status reconciliation, postponement approval workflow, and fee analytics.
 */

/**
 * 1. Record Fee Payment (OFFICE_ADMIN / MAIN_ADMIN)
 */
function recordPayment(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OFFICE_ADMIN']);

  var studentId = payload.student_id;
  var installmentId = payload.installment_id;
  var amount = Number(payload.amount);
  var paymentMode = payload.payment_mode || 'UPI'; // UPI | CASH | BANK_TRANSFER | CARD
  var refNo = payload.reference_no || '';
  var remarks = payload.remarks || '';
  var idempotencyKey = payload.idempotency_key || '';

  if (!studentId || !installmentId || amount <= 0) {
    throw new Error('Valid Student ID, Installment ID, and positive amount are required');
  }

  // Check Idempotency against Payments reference_no / remarks
  if (idempotencyKey) {
    var payments = getTableData('Payments');
    for (var p = 0; p < payments.length; p++) {
      if (payments[p].reference_no === idempotencyKey || (payments[p].remarks && payments[p].remarks.indexOf(idempotencyKey) !== -1)) {
        return { ok: true, data: payments[p], note: 'Payment already processed (idempotent duplicate).' };
      }
    }
  }

  var installment = getRecordById('Installments', installmentId);
  if (!installment) throw new Error('Installment record not found');

  var student = getRecordById('Students', studentId);
  if (!student) throw new Error('Student not found');

  // Generate Receipt Number under Lock
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var receiptNo = '';

  try {
    var counters = getTableData('Counters');
    var seqVal = 100;
    var counterId = null;

    for (var c = 0; c < counters.length; c++) {
      if (counters[c].key === 'RECEIPT_SEQ') {
        seqVal = Number(counters[c].value) || 100;
        counterId = counters[c].id;
        break;
      }
    }

    var nextSeq = seqVal + 1;
    receiptNo = 'REC-' + new Date().getFullYear() + '-' + ('00000' + nextSeq).slice(-5);

    if (counterId) {
      updateRecord('Counters', counterId, { value: nextSeq }, currentUser.id);
    } else {
      insertRecord('Counters', { key: 'RECEIPT_SEQ', value: nextSeq }, currentUser.id);
    }
  } finally {
    lock.releaseLock();
  }

  // Insert Payment record
  var paymentRecord = insertRecord('Payments', {
    student_id: studentId,
    installment_id: installmentId,
    amount: amount,
    payment_mode: paymentMode,
    reference_no: refNo || idempotencyKey || receiptNo,
    payment_date: new Date().toISOString(),
    collected_by: currentUser.id,
    receipt_no: receiptNo,
    receipt_url: '',
    remarks: remarks
  }, currentUser.id);

  // Update Installment status
  var totalPaid = (Number(installment.paid_amount) || 0) + amount;
  var requiredAmount = Number(installment.amount) || 0;
  var instStatus = (totalPaid >= requiredAmount) ? 'PAID' : 'PARTIAL';

  updateRecord('Installments', installmentId, {
    paid_amount: totalPaid,
    paid_date: new Date().toISOString(),
    status: instStatus
  }, currentUser.id);

  // Send Fee Receipt Email
  try {
    sendReceiptEmail(student, paymentRecord, installment);
  } catch (mailErr) {
    Logger.log('Receipt email dispatch failed: ' + mailErr.toString());
  }

  logAudit('RECORD_PAYMENT', 'Payments', paymentRecord.id, { receipt_no: receiptNo, amount: amount, student_id: studentId }, currentUser);

  return {
    ok: true,
    data: {
      payment: paymentRecord,
      receipt_no: receiptNo,
      installment_status: instStatus,
      paid_amount: totalPaid
    }
  };
}

/**
 * 2. Request Postponement (OFFICE_ADMIN)
 */
function requestPostpone(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OFFICE_ADMIN']);

  var installmentId = payload.installment_id;
  var requestedDate = payload.requested_due_date;
  var reason = payload.reason || '';

  if (!installmentId || !requestedDate || !reason) {
    throw new Error('Installment ID, requested due date, and justification reason are required');
  }

  var installment = getRecordById('Installments', installmentId);
  if (!installment) throw new Error('Installment not found');

  var req = insertRecord('PostponeRequests', {
    installment_id: installmentId,
    student_id: installment.student_id,
    current_due_date: installment.due_date,
    requested_due_date: requestedDate,
    reason: reason,
    status: 'PENDING_APPROVAL',
    requested_by: currentUser.id,
    reviewed_by: '',
    reviewed_at: '',
    review_remarks: ''
  }, currentUser.id);

  // Notify OPS_ADMIN
  insertRecord('Notifications', {
    recipient_user_id: 'ALL_OPS_ADMIN',
    role_target: 'OPS_ADMIN',
    title: 'Fee Postponement Request Submitted',
    message: 'New postponement request for Student ' + installment.student_id + ' to ' + requestedDate,
    type: 'POSTPONE_REQUEST',
    is_read: false
  }, currentUser.id);

  logAudit('REQUEST_POSTPONE', 'PostponeRequests', req.id, { installment_id: installmentId, requestedDate: requestedDate }, currentUser);

  return { ok: true, data: req };
}

/**
 * 3. Approve / Reject Postponement (OPS_ADMIN ONLY)
 */
function approvePostpone(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN']);

  var requestId = payload.request_id;
  var decision = payload.decision; // APPROVED | REJECTED
  var remarks = payload.remarks || '';

  if (!requestId || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    throw new Error('Valid Request ID and decision (APPROVED/REJECTED) are required');
  }

  var req = getRecordById('PostponeRequests', requestId);
  if (!req) throw new Error('Postpone request not found');

  updateRecord('PostponeRequests', requestId, {
    status: decision,
    reviewed_by: currentUser.id,
    reviewed_at: new Date().toISOString(),
    review_remarks: remarks
  }, currentUser.id);

  if (decision === 'APPROVED') {
    var installment = getRecordById('Installments', req.installment_id);
    if (installment) {
      var currentPostponeCount = (Number(installment.postpone_count) || 0) + 1;
      updateRecord('Installments', installment.id, {
        due_date: req.requested_due_date,
        postpone_count: currentPostponeCount
      }, currentUser.id);

      logAudit('APPROVE_POSTPONE', 'Installments', installment.id, { old_date: req.current_due_date, new_date: req.requested_due_date }, currentUser);
    }
  } else {
    logAudit('REJECT_POSTPONE', 'PostponeRequests', requestId, { remarks: remarks }, currentUser);
  }

  return { ok: true, data: { request_id: requestId, status: decision } };
}

/**
 * 4. Get Consolidated Fee Analytics for Dashboards
 */
function getFeeAnalytics() {
  var installments = getTableData('Installments');
  var payments = getTableData('Payments');
  var batches = getTableData('Batches');
  var students = getTableData('Students');

  var studentBatchMap = {};
  for (var st = 0; st < students.length; st++) {
    studentBatchMap[students[st].student_id] = students[st].batch_id;
  }

  var totalCollected = 0;
  for (var p = 0; p < payments.length; p++) {
    totalCollected += (Number(payments[p].amount) || 0);
  }

  var totalPending = 0;
  var totalOverdue = 0;
  var next7DaysDue = 0;
  var now = new Date();
  var todayStr = now.toISOString().substring(0, 10);
  var in7DaysStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  var batchFeeMap = {};
  for (var b = 0; b < batches.length; b++) {
    batchFeeMap[batches[b].id] = {
      batch_id: batches[b].id,
      batch_code: batches[b].batch_code,
      name: batches[b].name,
      collected: 0,
      pending: 0,
      overdue: 0
    };
  }

  for (var i = 0; i < installments.length; i++) {
    var inst = installments[i];
    var amount = Number(inst.amount) || 0;
    var paid = Number(inst.paid_amount) || 0;
    var balance = amount - paid;
    var bId = studentBatchMap[inst.student_id];

    if (balance > 0) {
      totalPending += balance;

      if (inst.due_date < todayStr) {
        totalOverdue += balance;
        if (bId && batchFeeMap[bId]) batchFeeMap[bId].overdue += balance;
      } else if (inst.due_date <= in7DaysStr) {
        next7DaysDue += balance;
      }
      if (bId && batchFeeMap[bId]) batchFeeMap[bId].pending += balance;
    }

    if (paid > 0 && bId && batchFeeMap[bId]) {
      batchFeeMap[bId].collected += paid;
    }
  }

  var batchBreakdown = [];
  for (var k in batchFeeMap) {
    batchBreakdown.push(batchFeeMap[k]);
  }

  return {
    total_collected: totalCollected,
    total_pending: totalPending,
    total_overdue: totalOverdue,
    next_7_days_due: next7DaysDue,
    batch_breakdown: batchBreakdown
  };
}
