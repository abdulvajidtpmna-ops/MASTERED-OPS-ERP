/**
 * MLC ERP - Attendance Management & Eligibility Engine
 * Handles session attendance capture with trainer batch validation,
 * 7-day edit restriction window with admin override, and real-time shortfall calculation.
 */

/**
 * 1. Mark Attendance for a Session
 */
function markAttendance(payload, currentUser) {
  var sessionId = payload.session_id;
  var rows = payload.rows || []; // Array of { student_id, status: 'P'|'A'|'L'|'EXCUSED', remarks? }
  var topicsCovered = payload.topics_covered_note || '';

  if (!sessionId || !rows.length) {
    throw new Error('Session ID and attendance rows are required');
  }

  // Find Session
  var sessions = getTableData('ClassSessions');
  var session = null;
  for (var s = 0; s < sessions.length; s++) {
    if (sessions[s].session_id === sessionId || sessions[s].id === sessionId) {
      session = sessions[s];
      break;
    }
  }
  if (!session) throw new Error('Class session not found');

  // Permission Check: Trainer of this batch OR Admin override
  if (currentUser.role === 'TRAINER') {
    if (session.trainer_id && session.trainer_id !== currentUser.trainer_id && session.trainer_id !== currentUser.id) {
      throw new Error('Access denied: You are not the assigned trainer for this session');
    }
  } else {
    requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN']);
  }

  // Check 7-Day Edit Window
  var sessionDate = new Date(session.date).getTime();
  var now = new Date().getTime();
  var daysDiff = (now - sessionDate) / (1000 * 60 * 60 * 24);

  if (daysDiff > 7 && currentUser.role !== 'MAIN_ADMIN' && currentUser.role !== 'OPS_ADMIN') {
    throw new Error('Attendance edit window closed (> 7 days). Please contact Operations Admin for overrides.');
  }

  // Upsert Attendance Rows
  var existingAttendance = getTableData('Attendance');

  for (var i = 0; i < rows.length; i++) {
    var item = rows[i];
    var matchedRow = null;

    for (var j = 0; j < existingAttendance.length; j++) {
      if (existingAttendance[j].session_id === sessionId && existingAttendance[j].student_id === item.student_id) {
        matchedRow = existingAttendance[j];
        break;
      }
    }

    if (matchedRow) {
      updateRecord('Attendance', matchedRow.id, {
        status: item.status,
        remarks: item.remarks || '',
        marked_by: currentUser.id,
        marked_at: new Date().toISOString()
      }, currentUser.id);
    } else {
      insertRecord('Attendance', {
        session_id: sessionId,
        student_id: item.student_id,
        status: item.status,
        marked_by: currentUser.id,
        marked_at: new Date().toISOString(),
        remarks: item.remarks || ''
      }, currentUser.id);
    }
  }

  // Update Session status to DONE
  updateRecord('ClassSessions', session.id, {
    status: 'DONE',
    topics_covered_note: topicsCovered || session.topics_covered_note
  }, currentUser.id);

  logAudit('MARK_ATTENDANCE', 'ClassSessions', sessionId, { row_count: rows.length }, currentUser);

  return { ok: true, data: { session_id: sessionId, marked_count: rows.length } };
}

/**
 * 2. Calculate Comprehensive Attendance Summary & Placement Eligibility
 * Returns per-module statistics, overall percentage, eligibility status, and exact shortfall hours.
 */
function getAttendanceSummary(studentId) {
  if (!studentId) throw new Error('Student ID is required');

  var student = null;
  var allStudents = getTableData('Students');
  for (var st = 0; st < allStudents.length; st++) {
    if (allStudents[st].student_id === studentId || allStudents[st].id === studentId) {
      student = allStudents[st];
      break;
    }
  }
  if (!student) throw new Error('Student not found');

  var isBHA = (student.course_code === 'BHA');
  var batchId = student.batch_id;

  // Retrieve all conducted sessions for this batch
  var sessions = getTableData('ClassSessions').filter(function(s) {
    if (s.batch_id !== batchId || s.status !== 'DONE') return false;
    if (s.audience === 'BHA_ONLY' && !isBHA) return false;
    return true;
  });

  var sessionMap = {};
  for (var si = 0; si < sessions.length; si++) {
    sessionMap[sessions[si].session_id] = sessions[si];
    sessionMap[sessions[si].id] = sessions[si];
  }

  // Retrieve student attendance records
  var studentAttendance = getTableData('Attendance').filter(function(a) {
    return a.student_id === student.student_id;
  });

  var attendanceMap = {};
  for (var ai = 0; ai < studentAttendance.length; ai++) {
    attendanceMap[studentAttendance[ai].session_id] = studentAttendance[ai];
  }

  // Module breakdown aggregation
  var modulesSummary = {};
  var allModules = getTableData('Modules');
  for (var m = 0; m < allModules.length; m++) {
    var mod = allModules[m];
    // If not BHA, skip HA modules
    if (mod.course_code === 'BHA' && !isBHA) continue;

    modulesSummary[mod.module_code] = {
      module_code: mod.module_code,
      title: mod.title,
      conducted_hours: 0,
      attended_hours: 0,
      percentage: 0,
      shortfall_hours: 0,
      eligible: true
    };
  }

  var totalConductedHours = 0;
  var totalAttendedHours = 0;

  for (var sKey in sessions) {
    var sess = sessions[sKey];
    var modCode = sess.module_code;
    var sessHours = Number(sess.hours) || 2;

    if (!modulesSummary[modCode]) {
      modulesSummary[modCode] = {
        module_code: modCode,
        title: modCode,
        conducted_hours: 0,
        attended_hours: 0,
        percentage: 0,
        shortfall_hours: 0,
        eligible: true
      };
    }

    modulesSummary[modCode].conducted_hours += sessHours;
    totalConductedHours += sessHours;

    var att = attendanceMap[sess.session_id] || attendanceMap[sess.id];
    if (att) {
      // P, L (Late counts as present), EXCUSED
      if (att.status === 'P' || att.status === 'L' || att.status === 'EXCUSED') {
        modulesSummary[modCode].attended_hours += sessHours;
        totalAttendedHours += sessHours;
      }
    }
  }

  // Compute percentages & Shortfall per module
  var allModulesPass85 = true;
  var modulesList = [];

  for (var modKey in modulesSummary) {
    var item = modulesSummary[modKey];
    if (item.conducted_hours > 0) {
      item.percentage = Number(((item.attended_hours / item.conducted_hours) * 100).toFixed(1));
    } else {
      item.percentage = 100; // Not conducted yet
    }

    // Required hours for 85% = 0.85 * conducted_hours
    var requiredHours = Math.ceil(item.conducted_hours * 0.85);
    if (item.attended_hours < requiredHours) {
      item.shortfall_hours = requiredHours - item.attended_hours;
      item.eligible = false;
      allModulesPass85 = false;
    } else {
      item.shortfall_hours = 0;
      item.eligible = true;
    }
    modulesList.push(item);
  }

  var overallPct = totalConductedHours > 0 ? Number(((totalAttendedHours / totalConductedHours) * 100).toFixed(1)) : 100;
  var overallRequiredHours = Math.ceil(totalConductedHours * 0.85);
  var overallShortfall = (totalAttendedHours < overallRequiredHours) ? (overallRequiredHours - totalAttendedHours) : 0;
  var isEligible = (overallPct >= 85) && allModulesPass85;

  return {
    ok: true,
    data: {
      student_id: student.student_id,
      admission_no: student.admission_no,
      full_name: student.full_name,
      course_code: student.course_code,
      total_conducted_hours: totalConductedHours,
      total_attended_hours: totalAttendedHours,
      overall_percentage: overallPct,
      overall_shortfall_hours: overallShortfall,
      is_eligible: isEligible,
      modules: modulesList
    }
  };
}
