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
        requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'HR']);
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

      case 'createStaffUser':
        requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'HR']);
        var salt = 'MLC_SALT_' + Utilities.getUuid().substring(0, 8);
        var passHash = hashSecret(salt, payload.password || 'Mastered@2026');
        var newUser = insertRecord('Users', {
          username: payload.email,
          email: payload.email,
          mobile: payload.mobile || '',
          full_name: payload.full_name,
          role: payload.role,
          department: payload.department,
          trainer_id: payload.trainer_id || '',
          staff_id: payload.staff_id || '',
          salt: salt,
          password_hash: passHash,
          failed_attempts: 0
        }, currentUser.id);
        logAudit('CREATE_STAFF_USER', 'Users', newUser.id, { email: payload.email, role: payload.role }, currentUser);
        result = { ok: true, data: newUser };
        break;

      case 'getDailyToDos':
        var targetDate = payload.date || new Date().toISOString().substring(0, 10);
        var qId = payload.user_id || currentUser.id;
        var todos = getTableData('DailyToDos');
        var matchedTodo = null;
        for (var t = 0; t < todos.length; t++) {
          if (todos[t].user_id === qId && todos[t].date === targetDate) {
            matchedTodo = todos[t];
            try { matchedTodo.tasks = JSON.parse(matchedTodo.tasks_json || '[]'); } catch(e){ matchedTodo.tasks = []; }
            break;
          }
        }
        result = { ok: true, data: { date: targetDate, is_sunday: new Date(targetDate).getDay() === 0, record: matchedTodo } };
        break;

      case 'saveDailyToDos':
        var todayStr = new Date().toISOString().substring(0, 10);
        var isBefore10 = new Date().getHours() < 10;
        var allTds = getTableData('DailyToDos');
        var currRec = null;
        for (var a = 0; a < allTds.length; a++) {
          if (allTds[a].user_id === currentUser.id && allTds[a].date === todayStr) {
            currRec = allTds[a];
            break;
          }
        }
        var saveObj = {
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          user_role: currentUser.role,
          department: currentUser.department,
          date: todayStr,
          created_before_10am: isBefore10,
          tasks_json: JSON.stringify(payload.tasks || []),
          notes: payload.notes || '',
          status: 'IN_PROGRESS'
        };
        if (currRec) {
          updateRecord('DailyToDos', currRec.id, saveObj, currentUser.id);
        } else {
          insertRecord('DailyToDos', saveObj, currentUser.id);
        }
        result = { ok: true, data: { success: true } };
        break;

      case 'updateDailyToDos':
        var todayStr2 = new Date().toISOString().substring(0, 10);
        var isBefore9 = new Date().getHours() < 21;
        var allTds2 = getTableData('DailyToDos');
        var currRec2 = null;
        for (var b = 0; b < allTds2.length; b++) {
          if (allTds2[b].user_id === currentUser.id && allTds2[b].date === todayStr2) {
            currRec2 = allTds2[b];
            break;
          }
        }
        if (currRec2) {
          updateRecord('DailyToDos', currRec2.id, {
            tasks_json: JSON.stringify(payload.tasks || []),
            notes: payload.notes || '',
            updated_before_9pm: isBefore9,
            updated_at: new Date().toISOString()
          }, currentUser.id);
        }
        result = { ok: true, data: { success: true } };
        break;

      case 'getAllStaffToDos':
        requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'HR']);
        var checkDate = payload.date || new Date().toISOString().substring(0, 10);
        var staffUsers = getTableData('Users').filter(function(u) { return u.role !== 'STUDENT'; });
        var dbTodos = getTableData('DailyToDos');
        var reportsList = staffUsers.map(function(s) {
          var found = null;
          for (var c = 0; c < dbTodos.length; c++) {
            if (dbTodos[c].user_id === s.id && dbTodos[c].date === checkDate) {
              found = dbTodos[c];
              break;
            }
          }
          var taskArr = [];
          try { taskArr = JSON.parse(found ? found.tasks_json : '[]'); } catch(e){}
          var doneNum = taskArr.filter(function(tk){ return tk.status === 'DONE'; }).length;
          return {
            user_id: s.id,
            full_name: s.full_name,
            email: s.email,
            role: s.role,
            department: s.department,
            has_submitted: !!found,
            created_before_10am: found ? !!found.created_before_10am : false,
            updated_before_9pm: found ? found.updated_before_9pm : null,
            total_tasks: taskArr.length,
            done_tasks: doneNum,
            completion_pct: taskArr.length > 0 ? Math.round((doneNum / taskArr.length) * 100) : 0,
            tasks: taskArr,
            notes: found ? found.notes : ''
          };
        });
        result = { ok: true, data: { date: checkDate, is_sunday: new Date(checkDate).getDay() === 0, staff_reports: reportsList } };
        break;

      case 'getSocialPosts':
        var sps = getTableData('SocialPosts');
        var sengs = getTableData('SocialEngagements');
        var resPosts = sps.map(function(p) {
          var isDone = false;
          for (var k = 0; k < sengs.length; k++) {
            if (sengs[k].post_id === p.id && sengs[k].user_id === currentUser.id) {
              isDone = true;
              break;
            }
          }
          return {
            id: p.id,
            title: p.title,
            post_url: p.post_url,
            caption: p.caption,
            created_by_name: p.created_by_name,
            created_at: p.created_at,
            is_done: isDone
          };
        });
        result = { ok: true, data: { posts: resPosts.reverse() } };
        break;

      case 'createSocialPost':
        requireRole(currentUser, ['MAIN_ADMIN', 'SOCIAL_MEDIA_MANAGER', 'MARKETING_HEAD']);
        var newPost = insertRecord('SocialPosts', {
          title: payload.title,
          post_url: payload.post_url,
          caption: payload.caption || '',
          created_by_name: currentUser.full_name
        }, currentUser.id);
        result = { ok: true, data: newPost };
        break;

      case 'markSocialPostDone':
        insertRecord('SocialEngagements', {
          post_id: payload.post_id,
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          user_role: currentUser.role
        }, currentUser.id);
        result = { ok: true, data: { success: true } };
        break;

      case 'getSocialEngagementReport':
        var allPosts = getTableData('SocialPosts');
        var allEngs = getTableData('SocialEngagements');
        var sList = getTableData('Users').filter(function(u) { return u.role !== 'STUDENT' && u.role !== 'MAIN_ADMIN'; });
        var repList = allPosts.map(function(post) {
          var pEngs = allEngs.filter(function(e) { return e.post_id === post.id; });
          var engIds = {};
          pEngs.forEach(function(e) { engIds[e.user_id] = true; });
          var doneS = sList.filter(function(s) { return engIds[s.id]; });
          var pendS = sList.filter(function(s) { return !engIds[s.id]; });
          return {
            post_id: post.id,
            title: post.title,
            post_url: post.post_url,
            created_at: post.created_at,
            total_required: sList.length,
            done_count: doneS.length,
            pending_count: pendS.length,
            done_staff: doneS.map(function(s) { return { id: s.id, name: s.full_name, role: s.role, department: s.department }; }),
            pending_staff: pendS.map(function(s) { return { id: s.id, name: s.full_name, role: s.role, department: s.department }; })
          };
        });
        result = { ok: true, data: { reports: repList.reverse(), total_staff: sList.length } };
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
