/**
 * MLC ERP - Main Web App Router & Action Dispatcher
 * Mastered Language Coach / Mastered Skill Academy
 *
 * Implements single doPost(e) router with text/plain body handling to bypass CORS preflights.
 * Standard JSON response: { ok: boolean, data?, error?, code?, timestamp }
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    service: 'MLC ERP Google Apps Script Web App Engine',
    status: 'ONLINE',
    version: '2.0.0',
    institute: CONFIG.getInstituteName(),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var request = JSON.parse(rawBody);

    var action = request.action;
    var token = request.token;
    var payload = request.payload || {};

    if (!action) {
      return jsonResponse(false, null, 'Action parameter is required', 'MISSING_ACTION');
    }

    // Public actions (No token required)
    if (action === 'login') {
      var loginResult = handleLogin(payload);
      return jsonResponse(loginResult.ok, loginResult.data, loginResult.error, loginResult.code);
    }

    // Schema Migration (Public or Main Admin)
    if (action === 'migrate_v2') {
      var migResult = migrate_v2();
      return jsonResponse(migResult.ok, migResult.message);
    }

    // Authenticated actions
    var currentUser = requireAuth(token);

    var result = null;

    switch (action) {
      // 1. Auth & Profile
      case 'logout':
        result = handleLogout(token, currentUser);
        break;
      case 'getMe':
        result = {
          ok: true,
          data: {
            user: {
              id: currentUser.id,
              full_name: currentUser.full_name,
              email: currentUser.email,
              mobile: currentUser.mobile,
              role: currentUser.role,
              department: currentUser.department,
              student_id: currentUser.student_id,
              trainer_id: currentUser.trainer_id,
              staff_id: currentUser.staff_id
            }
          }
        };
        break;

      // 2. Admissions & Sales
      case 'createAdmission':
        result = createAdmission(payload, currentUser);
        break;
      case 'getAdmissions':
        result = getAdmissions(payload, currentUser);
        break;
      case 'saveSalesDailyCounts':
        result = saveSalesDailyCounts(payload, currentUser);
        break;
      case 'getSalesDailyCounts':
        result = getSalesDailyCounts(payload, currentUser);
        break;
      case 'getMyIncentives':
        result = getMyIncentives(payload, currentUser);
        break;
      case 'setStudentOutcomeStatus':
        result = setStudentOutcomeStatus(payload, currentUser);
        break;

      // 3. Operations & Batches
      case 'createBatch':
        result = createBatch(payload, currentUser);
        break;
      case 'postponeBatchStartDate':
        result = postponeBatchStartDate(payload, currentUser);
        break;
      case 'updateBatch':
        result = updateBatch(payload, currentUser);
        break;
      case 'logAfterSalesCall':
        result = logAfterSalesCall(payload, currentUser);
        break;
      case 'assignBatch':
        result = assignBatch(payload, currentUser);
        break;
      case 'deferStudent':
        result = deferStudent(payload, currentUser);
        break;
      case 'changeStudentBatch':
        result = changeStudentBatch(payload, currentUser);
        break;
      case 'getAfterSalesData':
        result = getAfterSalesData(payload, currentUser);
        break;
      case 'startBatch':
        result = startBatch(payload, currentUser);
        break;
      case 'createClassSession':
        result = createClassSession(payload, currentUser);
        break;
      case 'bulkSaveDailyTimetable':
        result = bulkSaveDailyTimetable(payload, currentUser);
        break;
      case 'getBatchesList':
        result = getBatchesList(payload, currentUser);
        break;

      // 4. Timetable Grid & Topics Covered
      case 'getTimetableForDate':
        result = getTimetableForDate(payload, currentUser);
        break;
      case 'bulkSaveTimetableGrid':
        result = bulkSaveTimetableGrid(payload, currentUser);
        break;
      case 'getStudentTomorrowClass':
        result = getStudentTomorrowClass(payload.student_id, currentUser);
        break;
      case 'getTopicsCoveredReport':
        result = getTopicsCoveredReport(currentUser);
        break;

      // 5. Attendance
      case 'markAttendance':
        result = markAttendance(payload, currentUser);
        break;
      case 'getAttendanceSummary':
        var targetStudentId = (currentUser.role === 'STUDENT') ? (currentUser.student_id || currentUser.id) : payload.student_id;
        result = getAttendanceSummary(targetStudentId);
        break;
      case 'getAttendanceOverview':
        result = getAttendanceOverview(currentUser);
        break;

      // 6. Assessments & Grades
      case 'saveAssessment':
        result = saveAssessment(payload, currentUser);
        break;
      case 'recalculateStudentGrade':
        result = { ok: true, data: recalculateStudentGrade(payload.student_id, payload.batch_id, currentUser) };
        break;

      // 7. Fees & Postponements
      case 'recordPayment':
        result = recordPayment(payload, currentUser);
        break;
      case 'requestPostpone':
        result = requestPostpone(payload, currentUser);
        break;
      case 'approvePostpone':
        result = approvePostpone(payload, currentUser);
        break;
      case 'getFeeAnalytics':
        result = { ok: true, data: getFeeAnalytics() };
        break;

      // 8. Agreements
      case 'processSignedAgreement':
        result = processSignedAgreement(payload, currentUser);
        break;

      // 9. Placement
      case 'savePreferences':
        result = savePreferences(payload, currentUser);
        break;
      case 'scheduleInterview':
        result = scheduleInterview(payload, currentUser);
        break;
      case 'recordOffer':
        result = recordOffer(payload, currentUser);
        break;
      case 'getPlacementTrackerData':
        result = getPlacementTrackerData(payload.batch_id, currentUser);
        break;

      // 10. Duties & HR Review
      case 'submitDutyDone':
        result = submitDutyDone(payload, currentUser);
        break;
      case 'reviewDuty':
        result = reviewDuty(payload, currentUser);
        break;
      case 'assignTask':
        result = assignTask(payload, currentUser);
        break;
      case 'getStaffDutiesAndKPIs':
        result = getStaffDutiesAndKPIs(payload.target_user_id, currentUser);
        break;
      case 'getHRStaffReviewData':
        result = getHRStaffReviewData(currentUser);
        break;

      // 11. Notes & Study Materials
      case 'saveNote':
        result = saveNote(payload, currentUser);
        break;
      case 'deleteNote':
        result = deleteNote(payload, currentUser);
        break;
      case 'assignNoteToBatch':
        result = assignNoteToBatch(payload, currentUser);
        break;
      case 'getAccessibleNotes':
        result = getAccessibleNotes(payload.batch_id, currentUser);
        break;

      // 12. Batch Community Chat
      case 'sendBatchChatMessage':
        result = sendBatchChatMessage(payload, currentUser);
        break;
      case 'getBatchChatMessages':
        result = getBatchChatMessages(payload.batch_id, payload.after_timestamp, currentUser);
        break;

      // 13. Settings & Admin Data
      case 'getSettings':
        var settings = getTableData('Settings');
        var settingsMap = {};
        for (var s = 0; s < settings.length; s++) {
          settingsMap[settings[s].key] = settings[s].value;
        }
        result = { ok: true, data: settingsMap };
        break;
      case 'getUsersList':
        requireRole(currentUser, ['MAIN_ADMIN']);
        var users = getTableData('Users').map(function(u) {
          return {
            id: u.id,
            username: u.username,
            email: u.email,
            mobile: u.mobile,
            full_name: u.full_name,
            role: u.role,
            department: u.department,
            trainer_id: u.trainer_id,
            staff_id: u.staff_id,
            failed_attempts: u.failed_attempts,
            locked_until: u.locked_until
          };
        });
        result = { ok: true, data: users };
        break;
      case 'getAuditLogs':
        requireRole(currentUser, ['MAIN_ADMIN']);
        var logs = getTableData('AuditLog');
        result = { ok: true, data: logs.slice(-200).reverse() };
        break;

      default:
        return jsonResponse(false, null, 'Unknown action: ' + action, 'INVALID_ACTION');
    }

    return jsonResponse(result.ok, result.data, result.error, result.code);

  } catch (error) {
    Logger.log('doPost Handler Error: ' + error.toString());
    var code = 'SERVER_ERROR';
    if (error.message && error.message.indexOf('FORBIDDEN') !== -1) code = 'FORBIDDEN';
    if (error.message && error.message.indexOf('UNAUTHORIZED') !== -1) code = 'UNAUTHORIZED';
    if (error.message && error.message.indexOf('SESSION_EXPIRED') !== -1) code = 'SESSION_EXPIRED';

    return jsonResponse(false, null, error.message || error.toString(), code);
  }
}
