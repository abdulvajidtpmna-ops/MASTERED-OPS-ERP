/**
 * MLC ERP - Automated Triggers & Daily Cron Workflow
 * Triggered daily at 08:00 AM:
 *  - Sends Fee Reminders (3 days before, on due date, +2 days overdue via Email & In-App)
 *  - Marks overdue installments
 *  - Auto-instantiates DailyDuties from DutyTemplates for active staff
 *  - Automatically marks yesterday's PENDING duties as MISSED
 */

function runDailyMorningWorkflow() {
  Logger.log('Starting MLC ERP 08:00 AM Daily Morning Automation...');

  var today = new Date();
  var todayStr = today.toISOString().substring(0, 10);
  var in3DaysStr = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  var minus2DaysStr = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  var yesterdayStr = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  // 1. Fee Reminders & Overdue Processing
  var installments = getTableData('Installments');
  var students = getTableData('Students');
  var studentMap = {};
  for (var s = 0; s < students.length; s++) {
    studentMap[students[s].student_id] = students[s];
  }

  for (var i = 0; i < installments.length; i++) {
    var inst = installments[i];
    if (inst.status === 'PAID') continue;

    var student = studentMap[inst.student_id];
    if (!student) continue;

    var dueDate = inst.due_date;
    var reminderType = '';

    if (dueDate === in3DaysStr) {
      reminderType = 'FEE_REMINDER_3_DAYS_BEFORE';
    } else if (dueDate === todayStr) {
      reminderType = 'FEE_REMINDER_ON_DUE_DATE';
    } else if (dueDate === minus2DaysStr) {
      reminderType = 'FEE_REMINDER_2_DAYS_OVERDUE';
    }

    if (reminderType) {
      // In-app Notification
      insertRecord('Notifications', {
        recipient_user_id: student.student_id,
        role_target: 'STUDENT',
        title: 'Fee Payment Reminder: ' + inst.title,
        message: 'Your installment of ' + formatINR(inst.amount) + ' is due on ' + inst.due_date + '. Please ensure timely payment.',
        type: reminderType,
        is_read: false
      }, 'CRON_TRIGGER');

      // Email Notification
      var emailBody = '<p>Dear <b>' + student.full_name + '</b>,</p>' +
        '<p>This is a reminder regarding your upcoming fee installment for <b>' + student.course_code + '</b>.</p>' +
        '<div style="background:#FFFBEB; border:1px solid #F59E0B; padding:15px; border-radius:8px; margin:20px 0;">' +
        '<b>Installment:</b> ' + inst.title + '<br/>' +
        '<b>Amount Due:</b> ' + formatINR(inst.amount) + '<br/>' +
        '<b>Due Date:</b> ' + inst.due_date +
        '</div>' +
        '<p>Kindly arrange payment via the student portal or at the office desk.</p>';
      var html = wrapEmailTemplate('Fee Payment Reminder', emailBody);
      sendEmailWithLog(student.personal_email, 'Fee Reminder: ' + inst.title, html, [], reminderType);
    }
  }

  // 2. Mark Yesterday's PENDING Duties as MISSED
  var dailyDuties = getTableData('DailyDuties');
  for (var d = 0; d < dailyDuties.length; d++) {
    var duty = dailyDuties[d];
    if (duty.date < todayStr && duty.status === 'PENDING') {
      updateRecord('DailyDuties', duty.id, { status: 'MISSED' }, 'CRON_TRIGGER');
    }
  }

  // 3. Generate Today's DailyDuties from DutyTemplates
  var dutyTemplates = getTableData('DutyTemplates');
  var users = getTableData('Users');

  for (var t = 0; t < dutyTemplates.length; t++) {
    var tpl = dutyTemplates[t];
    if (tpl.is_active === false || tpl.is_active === 'FALSE') continue;

    // Find all matching staff
    for (var u = 0; u < users.length; u++) {
      var user = users[u];
      if (user.role === 'STUDENT' || user.is_deleted) continue;

      var matchRole = (!tpl.role || user.role === tpl.role);
      var matchDept = (!tpl.department || user.department === tpl.department);

      if (matchRole && matchDept) {
        // Check if duty already generated for today
        var alreadyExists = false;
        for (var ex = 0; ex < dailyDuties.length; ex++) {
          if (dailyDuties[ex].template_id === tpl.id && dailyDuties[ex].assignee_id === user.id && dailyDuties[ex].date === todayStr) {
            alreadyExists = true;
            break;
          }
        }

        if (!alreadyExists) {
          insertRecord('DailyDuties', {
            template_id: tpl.id,
            assignee_id: user.id,
            date: todayStr,
            title: tpl.title,
            assigned_by: tpl.assigned_by || 'SYSTEM',
            requires_evidence: (tpl.requires_evidence === true || tpl.requires_evidence === 'TRUE'),
            status: 'PENDING',
            done_at: '',
            remark: '',
            review_by: '',
            review_rating: '',
            review_comment: '',
            reviewed_at: ''
          }, 'CRON_TRIGGER');
        }
      }
    }
  }

  Logger.log('MLC ERP 08:00 AM Daily Morning Automation Completed.');
}

/**
 * Setup daily time-based trigger
 */
function setupDailyTriggers() {
  // Delete old triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runDailyMorningWorkflow' || triggers[i].getHandlerFunction() === 'runDailyBackup') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create morning 08:00 AM trigger
  ScriptApp.newTrigger('runDailyMorningWorkflow')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone('Asia/Kolkata')
    .create();

  // Create midnight backup trigger
  ScriptApp.newTrigger('runDailyBackup')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .inTimezone('Asia/Kolkata')
    .create();

  Logger.log('Daily Triggers configured for Asia/Kolkata timezone.');
}
