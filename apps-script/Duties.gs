/**
 * MLC ERP - Duties, Evidence, Tasks & KPI Module
 * Handles daily duty checklists, evidence uploads (Image/PDF/Link/Video),
 * ad-hoc task assignments, HR/Dept Head 1-5 star reviews, and KRA/KPI performance tracking.
 */

/**
 * 1. Mark Daily Duty Done with Evidence
 */
function submitDutyDone(payload, currentUser) {
  var dutyId = payload.duty_id;
  var remark = payload.remark || '';
  var evidenceList = payload.evidence || []; // Array of { file_url, type: 'IMAGE'|'PDF'|'LINK'|'VIDEO', note }

  if (!dutyId) throw new Error('Duty ID is required');

  var duty = getRecordById('DailyDuties', dutyId);
  if (!duty) throw new Error('Duty not found');

  // Verify assignee ownership (or Main Admin)
  if (duty.assignee_id !== currentUser.id && duty.assignee_id !== currentUser.staff_id && currentUser.role !== 'MAIN_ADMIN') {
    throw new Error('Access denied: You can only submit your own daily duties');
  }

  // Check evidence requirement
  if (duty.requires_evidence && (!evidenceList || evidenceList.length === 0)) {
    throw new Error('This duty strictly requires at least one piece of evidence (Image/PDF/Link/Video) before marking Done.');
  }

  // Insert Evidence records
  for (var i = 0; i < evidenceList.length; i++) {
    var ev = evidenceList[i];
    insertRecord('DutyEvidence', {
      duty_id: dutyId,
      file_url: ev.file_url,
      type: ev.type || 'LINK',
      note: ev.note || ''
    }, currentUser.id);
  }

  // Update DailyDuty status
  var updatedDuty = updateRecord('DailyDuties', dutyId, {
    status: 'DONE',
    done_at: new Date().toISOString(),
    remark: remark
  }, currentUser.id);

  logAudit('SUBMIT_DUTY', 'DailyDuties', dutyId, { evidence_count: evidenceList.length }, currentUser);

  return { ok: true, data: updatedDuty };
}

/**
 * 2. Review Duty (HR / DEPT_HEAD / MAIN_ADMIN)
 */
function reviewDuty(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'HR', 'DEPT_HEAD']);

  var dutyId = payload.duty_id;
  var rating = Number(payload.rating); // 1 to 5
  var comment = payload.comment || '';

  if (!dutyId || isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error('Duty ID and a valid rating (1-5 stars) are required');
  }

  var duty = getRecordById('DailyDuties', dutyId);
  if (!duty) throw new Error('Duty not found');

  var updatedDuty = updateRecord('DailyDuties', dutyId, {
    status: 'REVIEWED',
    review_by: currentUser.id,
    review_rating: rating,
    review_comment: comment,
    reviewed_at: new Date().toISOString()
  }, currentUser.id);

  logAudit('REVIEW_DUTY', 'DailyDuties', dutyId, { rating: rating }, currentUser);

  return { ok: true, data: updatedDuty };
}

/**
 * 3. Assign Ad-Hoc Task
 */
function assignTask(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'HR', 'DEPT_HEAD', 'OPS_ADMIN']);

  var title = payload.title;
  var description = payload.description || '';
  var assigneeId = payload.assignee_id;
  var dueDate = payload.due_date || new Date().toISOString().substring(0, 10);
  var priority = payload.priority || 'MEDIUM';

  if (!title || !assigneeId) {
    throw new Error('Task title and assignee ID are required');
  }

  var task = insertRecord('Tasks', {
    title: title,
    description: description,
    assignee_id: assigneeId,
    assigned_by: currentUser.id,
    due_date: dueDate,
    priority: priority,
    status: 'PENDING'
  }, currentUser.id);

  // Notify assignee
  insertRecord('Notifications', {
    recipient_user_id: assigneeId,
    role_target: 'STAFF',
    title: 'New Task Assigned: ' + title,
    message: description,
    type: 'TASK_ASSIGNED',
    is_read: false
  }, currentUser.id);

  logAudit('ASSIGN_TASK', 'Tasks', task.id, { assignee: assigneeId }, currentUser);

  return { ok: true, data: task };
}

/**
 * 4. Get Duties & KPIs for User or HR Overview
 */
function getStaffDutiesAndKPIs(targetUserId, currentUser) {
  var isHR = (currentUser.role === 'HR' || currentUser.role === 'MAIN_ADMIN');
  var queryId = targetUserId || currentUser.id;

  if (!isHR && queryId !== currentUser.id && queryId !== currentUser.staff_id) {
    throw new Error('Access denied: You can only view your own duties and KPIs');
  }

  var allDuties = getTableData('DailyDuties');
  var userDuties = allDuties.filter(function(d) {
    return !queryId || d.assignee_id === queryId;
  });

  var evidence = getTableData('DutyEvidence');
  var evidenceMap = {};
  for (var e = 0; e < evidence.length; e++) {
    var ev = evidence[e];
    if (!evidenceMap[ev.duty_id]) evidenceMap[ev.duty_id] = [];
    evidenceMap[ev.duty_id].push(ev);
  }

  // Attach evidence to duties
  for (var i = 0; i < userDuties.length; i++) {
    userDuties[i].evidence = evidenceMap[userDuties[i].id] || [];
  }

  var kpis = getTableData('KPIs').filter(function(k) {
    return !queryId || k.assignee_id === queryId;
  });

  var tasks = getTableData('Tasks').filter(function(t) {
    return !queryId || t.assignee_id === queryId;
  });

  return {
    ok: true,
    data: {
      duties: userDuties,
      tasks: tasks,
      kpis: kpis
    }
  };
}

/**
 * 5. HR Overview: Staff Performance Consolidation
 */
function getHRStaffReviewData(currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'HR', 'DEPT_HEAD']);

  var staffList = getTableData('Users').filter(function(u) {
    return u.role !== 'STUDENT' && u.role !== 'MAIN_ADMIN';
  });

  var duties = getTableData('DailyDuties');
  var kpis = getTableData('KPIs');
  var todayStr = new Date().toISOString().substring(0, 10);

  var staffSummaries = [];

  for (var i = 0; i < staffList.length; i++) {
    var s = staffList[i];
    var sId = s.id;

    var sDuties = duties.filter(function(d) { return d.assignee_id === sId || d.assignee_id === s.staff_id; });
    var sTodayDuties = sDuties.filter(function(d) { return d.date === todayStr; });
    var sTodayDone = sTodayDuties.filter(function(d) { return d.status === 'DONE' || d.status === 'REVIEWED'; });
    var sMissed = sDuties.filter(function(d) { return d.status === 'MISSED'; });

    var todayCompletionPct = sTodayDuties.length > 0 ? Number(((sTodayDone.length / sTodayDuties.length) * 100).toFixed(0)) : 100;

    var sKpis = kpis.filter(function(k) { return k.assignee_id === sId || k.assignee_id === s.staff_id; });
    var kpiScoreSum = 0;
    for (var k = 0; k < sKpis.length; k++) {
      var target = Number(sKpis[k].target) || 1;
      var actual = Number(sKpis[k].actual) || 0;
      kpiScoreSum += Math.min(100, (actual / target) * 100);
    }
    var avgKpiScore = sKpis.length > 0 ? Number((kpiScoreSum / sKpis.length).toFixed(1)) : 85;

    staffSummaries.push({
      user_id: sId,
      staff_id: s.staff_id || '',
      full_name: s.full_name,
      role: s.role,
      department: s.department,
      today_duties_total: sTodayDuties.length,
      today_duties_done: sTodayDone.length,
      today_completion_pct: todayCompletionPct,
      total_missed_duties: sMissed.length,
      kpi_score: avgKpiScore,
      recent_duties: sDuties.slice(0, 5)
    });
  }

  return {
    ok: true,
    data: {
      staff: staffSummaries,
      total_staff: staffSummaries.length
    }
  };
}
