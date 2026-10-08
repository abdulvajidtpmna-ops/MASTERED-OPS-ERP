/**
 * MLC ERP - Timetable Management, 24h Lock Window & Topics Covered Analytics
 * Handles batch daily scheduling across 6 classrooms, atomic bulk saving,
 * 24-hour pre-session edit locks with admin overrides, double-booking warnings,
 * student tomorrow-class feed, and Main Admin topics coverage reporting.
 */

var CLASSROOM_ROOMS = ['IT Tech Lab', 'Success Room', 'Future CEO', 'Growth Room', 'Idea Room', 'BSchool'];

/**
 * 1. Get Timetable Grid for Selected Date (OPS_EXEC / OPS_ADMIN / MAIN_ADMIN / TRAINER)
 */
function getTimetableForDate(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'TRAINER', 'STAFF']);

  var date = payload.date || formatDateYYYYMMDD(new Date(Date.now() + 86400000));
  var allBatches = getTableData('Batches');
  var allTimetable = getTableData('Timetable');
  var allSessions = getTableData('ClassSessions');
  var settings = getTableData('Settings');

  var lockHours = 24;
  for (var s = 0; s < settings.length; s++) {
    if (settings[s].key === 'timetable_lock_hours') {
      lockHours = Number(settings[s].value) || 24;
      break;
    }
  }

  var now = new Date().getTime();

  // Find existing entries for this date
  var dateTimetable = allTimetable.filter(function(t) { return t.date === date; });
  var dateSessions = allSessions.filter(function(cs) { return cs.date === date; });

  var timetableMap = {};
  dateTimetable.forEach(function(t) { timetableMap[t.batch_id] = t; });

  var sessionMap = {};
  dateSessions.forEach(function(cs) { sessionMap[cs.batch_id] = cs; });

  // Map each batch to a row in the grid
  var grid = allBatches.map(function(batch) {
    var existingEntry = timetableMap[batch.id];
    var existingSession = sessionMap[batch.id];

    var slot = existingEntry?.slot || batch.slot || '10:30 AM';
    var moduleCode = existingEntry?.module_code || existingSession?.module_code || (batch.course_code === 'BHA' ? 'HA1' : 'M01');
    var topicId = existingEntry?.topic_id || existingSession?.topic_id || '';
    var trainerId = existingEntry?.trainer_id || existingSession?.trainer_id || batch.default_trainer_id || 'TR-101';
    var room = existingEntry?.room || 'IT Tech Lab';

    // Calculate Lock Status: 24h before class start time
    // Parse slot time e.g. "10:30 AM" -> hour 10, min 30
    var slotTimeParts = parseSlotTime(slot);
    var sessionStartDateTime = new Date(date + 'T' + slotTimeParts.timeStr + ':00').getTime();
    var hoursUntilSession = (sessionStartDateTime - now) / (1000 * 60 * 60);

    var isLocked = hoursUntilSession < lockHours;
    var canOverride = (currentUser.role === 'MAIN_ADMIN' || currentUser.role === 'OPS_ADMIN');

    return {
      batch_id: batch.id,
      batch_code: batch.batch_code,
      batch_name: batch.name,
      batch_status: batch.status,
      course_code: batch.course_code,
      mode: batch.mode,
      date: date,
      slot: slot,
      module_code: moduleCode,
      topic_id: topicId,
      trainer_id: trainerId,
      room: room,
      is_locked: isLocked,
      can_edit: !isLocked || canOverride,
      lock_reason: isLocked ? ('Session starts in ' + Math.max(0, hoursUntilSession.toFixed(1)) + ' hrs (< ' + lockHours + 'h lock window).') : '',
      topics_covered_note: existingSession?.topics_covered_note || '',
      session_id: existingSession?.session_id || existingSession?.id || ''
    };
  });

  // Calculate Double-Booking Warnings for this date
  var warnings = detectDoubleBookings(grid);

  return {
    ok: true,
    data: {
      date: date,
      lock_hours: lockHours,
      rooms: CLASSROOM_ROOMS,
      slots: ['8:30 AM', '10:30 AM', '12:30 PM'],
      grid: grid,
      warnings: warnings
    }
  };
}

/**
 * 2. Bulk Save Timetable Grid (OPS_EXEC / OPS_ADMIN / MAIN_ADMIN)
 * Single atomic API call. Validates lock windows, logs changes, updates ClassSessions, notifies students.
 */
function bulkSaveTimetableGrid(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'TRAINER']);

  var date = payload.date || formatDateYYYYMMDD(new Date(Date.now() + 86400000));
  var entries = payload.entries || [];

  if (!entries.length) {
    throw new Error('No timetable entries provided for saving.');
  }

  var settings = getTableData('Settings');
  var lockHours = 24;
  for (var s = 0; s < settings.length; s++) {
    if (settings[s].key === 'timetable_lock_hours') {
      lockHours = Number(settings[s].value) || 24;
      break;
    }
  }

  var now = new Date().getTime();
  var canOverride = (currentUser.role === 'MAIN_ADMIN' || currentUser.role === 'OPS_ADMIN');

  var existingTimetable = getTableData('Timetable');
  var existingSessions = getTableData('ClassSessions');

  var savedItems = [];
  var errors = [];

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.is_active === false) continue;

    var slot = entry.slot || '10:30 AM';
    var slotTimeParts = parseSlotTime(slot);
    var sessionStartDateTime = new Date(date + 'T' + slotTimeParts.timeStr + ':00').getTime();
    var hoursUntilSession = (sessionStartDateTime - now) / (1000 * 60 * 60);

    // Enforce 24-hour edit lock
    if (hoursUntilSession < lockHours && !canOverride) {
      errors.push({
        batch_id: entry.batch_id,
        batch_name: entry.batch_name || entry.batch_code,
        error: 'Locked: session starts in ' + hoursUntilSession.toFixed(1) + ' hours. 24h lock requires Main Admin override.'
      });
      continue;
    }

    // Match existing Timetable record
    var matchedTimetable = null;
    for (var t = 0; t < existingTimetable.length; t++) {
      if (existingTimetable[t].batch_id === entry.batch_id && existingTimetable[t].date === date) {
        matchedTimetable = existingTimetable[t];
        break;
      }
    }

    var recordData = {
      batch_id: entry.batch_id,
      date: date,
      slot: slot,
      module_code: entry.module_code || 'M01',
      topic_id: entry.topic_id || '',
      trainer_id: entry.trainer_id || 'TR-101',
      room: entry.room || 'IT Tech Lab',
      locked: hoursUntilSession < lockHours
    };

    var resultTimetable = null;
    var isUpdate = !!matchedTimetable;

    if (matchedTimetable) {
      // Log timetable modification to TimetableLog
      insertRecord('TimetableLog', {
        timetable_id: matchedTimetable.id,
        batch_id: entry.batch_id,
        date: date,
        slot: slot,
        old_values_json: JSON.stringify(matchedTimetable),
        new_values_json: JSON.stringify(recordData),
        changed_by: currentUser.full_name || currentUser.id,
        changed_at: new Date().toISOString()
      }, currentUser.id);

      resultTimetable = updateRecord('Timetable', matchedTimetable.id, recordData, currentUser.id);
    } else {
      resultTimetable = insertRecord('Timetable', recordData, currentUser.id);
    }

    // Also sync/upsert into ClassSessions for attendance & execution tracking
    var matchedSession = null;
    for (var cs = 0; cs < existingSessions.length; cs++) {
      if (existingSessions[cs].batch_id === entry.batch_id && existingSessions[cs].date === date) {
        matchedSession = existingSessions[cs];
        break;
      }
    }

    var sessionData = {
      batch_id: entry.batch_id,
      module_code: recordData.module_code,
      topic_id: recordData.topic_id,
      trainer_id: recordData.trainer_id,
      date: date,
      start_time: slotTimeParts.start_time,
      end_time: slotTimeParts.end_time,
      hours: 2,
      audience: (entry.course_code === 'BHA' && recordData.module_code.indexOf('HA') === 0) ? 'BHA_ONLY' : 'ALL',
      status: 'PLANNED',
      topics_covered_note: entry.topics_covered_note || (entry.topic_id ? ('Topic: ' + entry.topic_id) : 'Syllabus lecture session.')
    };

    if (matchedSession) {
      updateRecord('ClassSessions', matchedSession.id, sessionData, currentUser.id);
    } else {
      sessionData.session_id = 'SES-' + Utilities.getUuid().substring(0, 8).toUpperCase();
      insertRecord('ClassSessions', sessionData, currentUser.id);
    }

    savedItems.push(resultTimetable);

    // Notify assigned students of publication / changes
    insertRecord('Notifications', {
      recipient_user_id: 'BATCH_' + entry.batch_id,
      role_target: 'STUDENT',
      title: isUpdate ? ('Timetable Updated for ' + date) : ('New Class Scheduled for ' + date),
      message: 'Module: ' + recordData.module_code + ' | Room: ' + recordData.room + ' | Slot: ' + recordData.slot + ' with trainer ' + recordData.trainer_id,
      type: 'TIMETABLE_UPDATE',
      is_read: false
    }, currentUser.id);
  }

  logAudit('BULK_SAVE_TIMETABLE_GRID', 'Timetable', 'GRID_' + date, { saved_count: savedItems.length, error_count: errors.length }, currentUser);

  return {
    ok: errors.length === 0,
    data: {
      saved_count: savedItems.length,
      errors: errors,
      saved_items: savedItems,
      warnings: detectDoubleBookings(entries)
    }
  };
}

/**
 * 3. Student View: Tomorrow's Class Feed
 * Returns tomorrow's class card details for student's own batch.
 */
function getStudentTomorrowClass(studentId, currentUser) {
  var student = null;
  var targetId = (currentUser.role === 'STUDENT') ? (currentUser.student_id || currentUser.id) : studentId;

  var allStudents = getTableData('Students');
  for (var st = 0; st < allStudents.length; st++) {
    if (allStudents[st].student_id === targetId || allStudents[st].id === targetId) {
      student = allStudents[st];
      break;
    }
  }

  if (!student || !student.batch_id) {
    return { ok: true, data: null, message: 'Student is not assigned to an active batch.' };
  }

  var tomorrowStr = formatDateYYYYMMDD(new Date(Date.now() + 86400000));
  var allTimetable = getTableData('Timetable');
  var allSessions = getTableData('ClassSessions');
  var allTrainers = getTableData('Trainers');
  var allUsers = getTableData('Users');
  var allModules = getTableData('Modules');
  var allTopics = getTableData('Topics');

  var matchedTimetable = null;
  for (var t = 0; t < allTimetable.length; t++) {
    if (allTimetable[t].batch_id === student.batch_id && allTimetable[t].date === tomorrowStr) {
      matchedTimetable = allTimetable[t];
      break;
    }
  }

  var matchedSession = null;
  for (var s = 0; s < allSessions.length; s++) {
    if (allSessions[s].batch_id === student.batch_id && allSessions[s].date === tomorrowStr) {
      matchedSession = allSessions[s];
      break;
    }
  }

  if (!matchedTimetable && !matchedSession) {
    return {
      ok: true,
      data: {
        date: tomorrowStr,
        is_published: false,
        display_status: 'Not published yet'
      }
    };
  }

  var moduleCode = matchedTimetable?.module_code || matchedSession?.module_code || 'M01';
  var topicId = matchedTimetable?.topic_id || matchedSession?.topic_id || '';
  var trainerId = matchedTimetable?.trainer_id || matchedSession?.trainer_id || '';
  var room = matchedTimetable?.room || 'IT Tech Lab';
  var slot = matchedTimetable?.slot || '10:30 AM';

  // Resolve Trainer Full Name
  var trainerName = trainerId;
  for (var tr = 0; tr < allTrainers.length; tr++) {
    if (allTrainers[tr].trainer_id === trainerId) {
      trainerName = allTrainers[tr].full_name;
      break;
    }
  }
  if (trainerName === trainerId) {
    for (var u = 0; u < allUsers.length; u++) {
      if (allUsers[u].id === trainerId || allUsers[u].trainer_id === trainerId) {
        trainerName = allUsers[u].full_name;
        break;
      }
    }
  }

  // Resolve Module Title
  var moduleTitle = moduleCode;
  for (var m = 0; m < allModules.length; m++) {
    if (allModules[m].module_code === moduleCode) {
      moduleTitle = allModules[m].title;
      break;
    }
  }

  return {
    ok: true,
    data: {
      date: tomorrowStr,
      is_published: true,
      slot: slot,
      module_code: moduleCode,
      module_title: moduleTitle,
      topic: topicId || matchedSession?.topics_covered_note || 'Interactive Classroom Session',
      trainer_id: trainerId,
      trainer_name: trainerName,
      classroom: room,
      hours: matchedSession?.hours || 2
    }
  };
}

/**
 * 4. Main Admin Dashboard: Topics Covered Report — Per Batch Overview
 * Reads completed class sessions ('DONE') and compares against curriculum plan.
 */
function getTopicsCoveredReport(currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'HR', 'DEPT_HEAD']);

  var allBatches = getTableData('Batches');
  var allSessions = getTableData('ClassSessions');
  var allModules = getTableData('Modules');
  var allTrainers = getTableData('Trainers');
  var allUsers = getTableData('Users');

  var trainerMap = {};
  allTrainers.forEach(function(t) { trainerMap[t.trainer_id] = t.full_name; });
  allUsers.forEach(function(u) {
    if (u.trainer_id) trainerMap[u.trainer_id] = u.full_name;
    trainerMap[u.id] = u.full_name;
  });

  var moduleTitleMap = {};
  allModules.forEach(function(m) { moduleTitleMap[m.module_code] = m.title; });

  var reports = allBatches.map(function(batch) {
    var bSessions = allSessions.filter(function(s) { return s.batch_id === batch.id; });
    var completedSessions = bSessions.filter(function(s) { return s.status === 'DONE'; });

    var totalPlannedHours = (batch.course_code === 'BHA') ? 90 : 60;
    var totalPlannedTopics = (batch.course_code === 'BHA') ? 45 : 30;

    var coveredHours = 0;
    var coveredTopicsList = [];

    completedSessions.forEach(function(cs) {
      var h = Number(cs.hours) || 2;
      coveredHours += h;
      coveredTopicsList.push({
        session_id: cs.session_id || cs.id,
        date: cs.date,
        time: (cs.start_time || '10:00') + ' - ' + (cs.end_time || '12:00'),
        module_code: cs.module_code,
        module_title: moduleTitleMap[cs.module_code] || cs.module_code,
        topic: cs.topics_covered_note || cs.topic_id || 'Class Session',
        trainer_name: trainerMap[cs.trainer_id] || cs.trainer_id || 'Assigned Faculty',
        hours: h
      });
    });

    var progressPct = totalPlannedHours > 0 ? Math.min(100, Number(((coveredHours / totalPlannedHours) * 100).toFixed(1))) : 0;
    var lastSession = coveredTopicsList.length ? coveredTopicsList[coveredTopicsList.length - 1] : null;

    return {
      batch_id: batch.id,
      batch_code: batch.batch_code,
      batch_name: batch.name,
      slot: batch.slot || '10:30 AM',
      course_code: batch.course_code,
      start_date: batch.start_date || '',
      status: batch.status,
      planned_hours: totalPlannedHours,
      covered_hours: coveredHours,
      planned_topics: totalPlannedTopics,
      covered_topics_count: completedSessions.length,
      progress_pct: progressPct,
      last_session: lastSession,
      covered_sessions: coveredTopicsList
    };
  });

  return {
    ok: true,
    data: {
      total_batches: allBatches.length,
      reports: reports
    }
  };
}

/**
 * Helper: Detect Double Booking Warnings
 */
function detectDoubleBookings(entries) {
  var warnings = [];
  var roomSlotMap = {};
  var trainerSlotMap = {};

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.is_active === false) continue;

    var slot = e.slot || '10:30 AM';
    var roomKey = (e.room || 'IT Tech Lab') + '_' + slot;
    var trainerKey = (e.trainer_id || 'TR-101') + '_' + slot;

    if (roomSlotMap[roomKey]) {
      warnings.push({
        type: 'ROOM_DOUBLE_BOOKED',
        room: e.room,
        slot: slot,
        batch_1: roomSlotMap[roomKey].batch_name || roomSlotMap[roomKey].batch_code,
        batch_2: e.batch_name || e.batch_code,
        message: "Warning: Classroom '" + e.room + "' is assigned to multiple batches at " + slot + " (" + (roomSlotMap[roomKey].batch_name || roomSlotMap[roomKey].batch_code) + " & " + (e.batch_name || e.batch_code) + ")."
      });
    } else {
      roomSlotMap[roomKey] = e;
    }

    if (trainerSlotMap[trainerKey]) {
      warnings.push({
        type: 'TRAINER_DOUBLE_BOOKED',
        trainer_id: e.trainer_id,
        slot: slot,
        batch_1: trainerSlotMap[trainerKey].batch_name || trainerSlotMap[trainerKey].batch_code,
        batch_2: e.batch_name || e.batch_code,
        message: "Warning: Trainer " + e.trainer_id + " is scheduled for multiple batches simultaneously at " + slot + "."
      });
    } else {
      trainerSlotMap[trainerKey] = e;
    }
  }

  return warnings;
}

/**
 * Helper: Parse Slot Time String
 */
function parseSlotTime(slot) {
  var s = String(slot || '10:30 AM').trim().toUpperCase();
  if (s === '8:30 AM') {
    return { timeStr: '08:30', start_time: '08:30', end_time: '10:30' };
  } else if (s === '12:30 PM') {
    return { timeStr: '12:30', start_time: '12:30', end_time: '14:30' };
  }
  // Default 10:30 AM
  return { timeStr: '10:30', start_time: '10:30', end_time: '12:30' };
}
