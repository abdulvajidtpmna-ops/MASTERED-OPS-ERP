/**
 * MLC ERP - Sales Daily Counts, Bucket List Analytics, Incentives & Student Outcomes Module
 * Handles integer daily lead counts, running bucket list trend reporting,
 * 10% collection incentives with ₹250 drop deductions, and validated student outcomes.
 */

/**
 * 1. Save Daily Lead Counts (Sales Person, unique per staff_id + date)
 * Counts: daily leads, qualified leads, interested leads, new to bucket list, lost from bucket list.
 */
function saveSalesDailyCounts(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'STAFF', 'DEPT_HEAD', 'HR']);

  var staffId = payload.staff_id || currentUser.staff_id || currentUser.id;
  var date = payload.date || formatDateYYYYMMDD(new Date());
  var leads = Math.max(0, parseInt(payload.leads, 10) || 0);
  var qualified = Math.max(0, parseInt(payload.qualified, 10) || 0);
  var interested = Math.max(0, parseInt(payload.interested, 10) || 0);
  var bucketNew = Math.max(0, parseInt(payload.bucket_new, 10) || 0);
  var bucketLost = Math.max(0, parseInt(payload.bucket_lost, 10) || 0);

  // Find existing record for this staff_id + date (Editable same day)
  var allCounts = getTableData('SalesDailyCounts');
  var matched = null;
  for (var i = 0; i < allCounts.length; i++) {
    if (allCounts[i].staff_id === staffId && allCounts[i].date === date) {
      matched = allCounts[i];
      break;
    }
  }

  var countData = {
    staff_id: staffId,
    date: date,
    leads: leads,
    qualified: qualified,
    interested: interested,
    bucket_new: bucketNew,
    bucket_lost: bucketLost
  };

  var saved = null;
  if (matched) {
    saved = updateRecord('SalesDailyCounts', matched.id, countData, currentUser.id);
  } else {
    saved = insertRecord('SalesDailyCounts', countData, currentUser.id);
  }

  logAudit('SAVE_DAILY_COUNTS', 'SalesDailyCounts', saved.id, countData, currentUser);

  return { ok: true, data: saved };
}

/**
 * 2. Get Daily Lead Counts & Bucket List Trend Report
 * Running bucket count = cumulative new_to_bucket - cumulative lost_from_bucket.
 * Table default sorted by Lost leads (highest first).
 */
function getSalesDailyCounts(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'HR', 'DEPT_HEAD', 'STAFF']);

  var targetStaffId = payload.staff_id;
  var isExecutiveViewer = (currentUser.role === 'MAIN_ADMIN' || currentUser.role === 'HR' || currentUser.role === 'DEPT_HEAD');

  // Sales staff can only view their own
  if (!isExecutiveViewer) {
    targetStaffId = currentUser.staff_id || currentUser.id;
  }

  var allCounts = getTableData('SalesDailyCounts');
  var users = getTableData('Users');

  var staffList = users.filter(function(u) {
    return u.department === 'Sales' || u.role === 'STAFF' || u.role === 'DEPT_HEAD';
  });

  if (targetStaffId) {
    allCounts = allCounts.filter(function(c) { return c.staff_id === targetStaffId; });
  }

  // Calculate cumulative bucket metrics
  var totalLeads = 0;
  var totalQualified = 0;
  var totalInterested = 0;
  var totalBucketNew = 0;
  var totalBucketLost = 0;

  allCounts.forEach(function(c) {
    totalLeads += Number(c.leads) || 0;
    totalQualified += Number(c.qualified) || 0;
    totalInterested += Number(c.interested) || 0;
    totalBucketNew += Number(c.bucket_new) || 0;
    totalBucketLost += Number(c.bucket_lost) || 0;
  });

  var runningBucketBalance = totalBucketNew - totalBucketLost;

  // Clone and sort entries by bucket_lost DESC (highest first)
  var sortedByLost = allCounts.slice().sort(function(a, b) {
    var lostA = Number(a.bucket_lost) || 0;
    var lostB = Number(b.bucket_lost) || 0;
    return lostB - lostA;
  });

  return {
    ok: true,
    data: {
      staff_id: targetStaffId || 'ALL',
      staff_list: staffList.map(function(s) { return { id: s.id, staff_id: s.staff_id || s.id, full_name: s.full_name, email: s.email }; }),
      summary: {
        total_leads: totalLeads,
        total_qualified: totalQualified,
        total_interested: totalInterested,
        total_bucket_new: totalBucketNew,
        total_bucket_lost: totalBucketLost,
        current_bucket_balance: runningBucketBalance
      },
      entries: sortedByLost
    }
  };
}

/**
 * 3. Get Sales Incentive & My Students Report
 * Rules:
 * - Incentive = 10% of amount collected in paid_month from that sales person's students.
 * - Deduction = ₹250 per student whose outcome_status is 'DROPPED_WITHOUT_CAME'.
 * - Net = gross_incentive - deductions (allows negative).
 */
function getMyIncentives(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'HR', 'DEPT_HEAD', 'OFFICE_ADMIN', 'STAFF']);

  var isExecutive = (currentUser.role === 'MAIN_ADMIN' || currentUser.role === 'HR' || currentUser.role === 'DEPT_HEAD' || currentUser.role === 'OFFICE_ADMIN');
  var targetStaffId = payload.staff_id || (currentUser.staff_id || currentUser.id);

  if (!isExecutive) {
    targetStaffId = currentUser.staff_id || currentUser.id;
  }

  var month = payload.month || new Date().toISOString().substring(0, 7); // e.g. "2026-02"

  var allStudents = getTableData('Students');
  var allPayments = getTableData('Payments');
  var allInstallments = getTableData('Installments');
  var settings = getTableData('Settings');

  var incentivePct = 10;
  var dropPenalty = 250;
  var includeReg = true;

  settings.forEach(function(s) {
    if (s.key === 'incentive_pct') incentivePct = Number(s.value) || 10;
    if (s.key === 'drop_penalty') dropPenalty = Number(s.value) || 250;
    if (s.key === 'incentive_includes_registration') includeReg = (s.value === 'true' || s.value === true);
  });

  // Filter students admitted by this sales person
  var myStudents = allStudents.filter(function(s) {
    return s.sales_staff_id === targetStaffId || (targetStaffId === 'ALL' && isExecutive);
  });

  var myStudentIds = {};
  myStudents.forEach(function(s) { myStudentIds[s.student_id] = s; });

  // Filter payments collected in target paid_month for these students
  var monthPayments = allPayments.filter(function(p) {
    var pMonth = p.paid_month || (p.payment_date ? p.payment_date.substring(0, 7) : '');
    var isMyStudent = !!myStudentIds[p.student_id];
    return isMyStudent && (pMonth === month);
  });

  var totalCollections = 0;
  var paymentRecordsList = [];

  monthPayments.forEach(function(p) {
    var student = myStudentIds[p.student_id];
    var amount = Number(p.amount) || 0;
    totalCollections += amount;

    var inst = getRecordById('Installments', p.installment_id);
    var dueMonth = p.due_month || (inst?.due_date ? inst.due_date.substring(0, 7) : p.payment_date.substring(0, 7));
    var paidMonth = p.paid_month || p.payment_date.substring(0, 7);

    paymentRecordsList.push({
      payment_id: p.id,
      student_id: p.student_id,
      student_name: student ? student.full_name : 'Student',
      admission_no: student ? student.admission_no : '',
      amount: amount,
      due_month: dueMonth,
      paid_month: paidMonth,
      payment_mode: p.payment_mode,
      receipt_no: p.receipt_no,
      incentive_amount: Number(((amount * incentivePct) / 100).toFixed(2))
    });
  });

  var grossIncentive = Number(((totalCollections * incentivePct) / 100).toFixed(2));

  // Count Dropped Without Came for this month
  var droppedWithoutCameStudents = myStudents.filter(function(s) {
    var isDroppedWithout = (s.outcome_status === 'DROPPED_WITHOUT_CAME');
    var outcomeMonth = s.outcome_date ? s.outcome_date.substring(0, 7) : (s.joined_date ? s.joined_date.substring(0, 7) : month);
    return isDroppedWithout && (outcomeMonth === month);
  });

  var deductions = droppedWithoutCameStudents.length * dropPenalty;
  var netIncentive = Number((grossIncentive - deductions).toFixed(2));

  // Student summary with outcome status filter support
  var studentRoster = myStudents.map(function(st) {
    return {
      student_id: st.student_id,
      admission_no: st.admission_no,
      full_name: st.full_name,
      mobile: st.mobile,
      personal_email: st.personal_email,
      course_code: st.course_code,
      mode: st.mode,
      status: st.status,
      outcome_status: st.outcome_status || (st.status === 'ACTIVE' ? 'ACTIVE' : (st.status === 'DROPPED' ? 'DROPPED_WITHOUT_CAME' : 'ACTIVE')),
      outcome_reason: st.outcome_reason || '',
      outcome_date: st.outcome_date || '',
      joined_date: st.joined_date,
      total_fee: st.total_fee
    };
  });

  return {
    ok: true,
    data: {
      staff_id: targetStaffId,
      month: month,
      summary: {
        collections_total: totalCollections,
        incentive_rate_pct: incentivePct,
        gross_incentive: grossIncentive,
        dropped_without_came_count: droppedWithoutCameStudents.length,
        drop_penalty_per_student: dropPenalty,
        total_deductions: deductions,
        net_incentive: netIncentive
      },
      payments: paymentRecordsList,
      students: studentRoster
    }
  };
}

/**
 * 4. Set Student Outcome Status (OPS_EXEC / OPS_ADMIN / MAIN_ADMIN)
 * Allowed: ACTIVE | COMPLETED | DROPPED_AFTER_CAME | DROPPED_WITHOUT_CAME
 * Validation: if student attended any session (status 'P', 'L', 'EXCUSED'), DROPPED_WITHOUT_CAME is forbidden.
 */
function setStudentOutcomeStatus(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC']);

  var studentId = payload.student_id;
  var outcomeStatus = payload.outcome_status;
  var reason = payload.reason || '';
  var outcomeDate = payload.outcome_date || formatDateYYYYMMDD(new Date());

  var validOutcomes = ['ACTIVE', 'COMPLETED', 'DROPPED_AFTER_CAME', 'DROPPED_WITHOUT_CAME'];
  if (validOutcomes.indexOf(outcomeStatus) === -1) {
    throw new Error("Invalid outcome status. Must be 'ACTIVE', 'COMPLETED', 'DROPPED_AFTER_CAME', or 'DROPPED_WITHOUT_CAME'.");
  }

  var student = getRecordById('Students', studentId);
  if (!student) throw new Error('Student not found');

  // Validate Attendance Records
  if (outcomeStatus === 'DROPPED_WITHOUT_CAME') {
    var attendanceRecords = getTableData('Attendance').filter(function(a) {
      return a.student_id === student.student_id && (a.status === 'P' || a.status === 'L' || a.status === 'EXCUSED');
    });

    if (attendanceRecords.length > 0) {
      throw new Error("Validation Error: This student has already attended " + attendanceRecords.length + " class session(s). 'DROPPED_WITHOUT_CAME' is not permitted. Please select 'DROPPED_AFTER_CAME'.");
    }
  }

  var studentUpdates = {
    outcome_status: outcomeStatus,
    outcome_reason: reason,
    outcome_date: outcomeDate
  };

  if (outcomeStatus === 'DROPPED_AFTER_CAME' || outcomeStatus === 'DROPPED_WITHOUT_CAME') {
    studentUpdates.status = 'DROPPED';
    studentUpdates.assignment_state = 'DROPPED';
  } else if (outcomeStatus === 'COMPLETED') {
    studentUpdates.status = 'COMPLETED';
  } else if (outcomeStatus === 'ACTIVE') {
    studentUpdates.status = 'ACTIVE';
  }

  var updatedStudent = updateRecord('Students', studentId, studentUpdates, currentUser.id);

  logAudit('SET_STUDENT_OUTCOME', 'Students', studentId, studentUpdates, currentUser);

  return { ok: true, data: updatedStudent };
}
