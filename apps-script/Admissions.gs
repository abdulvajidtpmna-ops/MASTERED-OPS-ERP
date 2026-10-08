/**
 * MLC ERP - Admissions Module
 * Handles student registration, sequential auto-numbering under LockService
 * (MA + number for OFFLINE, OMA + number for ONLINE),
 * automated student login creation, FeePlan initialization, and After-Sales task dispatch.
 */

function createAdmission(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'STAFF', 'DEPT_HEAD']);

  var mode = String(payload.mode || 'ONLINE').toUpperCase(); // ONLINE or OFFLINE
  if (mode !== 'ONLINE' && mode !== 'OFFLINE') {
    throw new Error('Mode must be ONLINE or OFFLINE');
  }

  var fullName = String(payload.full_name || '').trim();
  var mobile = String(payload.mobile || '').replace(/\D/g, '').slice(-10);
  var personalEmail = String(payload.personal_email || '').trim().toLowerCase();
  var courseCode = String(payload.course_code || 'HRCA').toUpperCase();
  var totalFee = Number(payload.total_fee) || (courseCode === 'BHA' ? 35000 : 25000);
  var salesStaffId = currentUser.staff_id || currentUser.id;

  if (!fullName || mobile.length !== 10) {
    throw new Error('Valid student full name and 10-digit mobile number are required');
  }

  // Acquire ScriptLock for atomic counter generation
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(10000);
  if (!hasLock) {
    throw new Error('Server busy processing another admission. Please retry in a few seconds.');
  }

  var admissionNo = '';
  var studentId = 'STU-' + Utilities.getUuid().substring(0, 8).toUpperCase();

  try {
    var settingKey = mode === 'ONLINE' ? 'next_online_no' : 'next_offline_no';
    var defaultStart = mode === 'ONLINE' ? 1034 : 2017;
    var prefix = mode === 'ONLINE' ? 'OMA' : 'MA';

    // Retrieve setting from Settings table
    var settings = getTableData('Settings');
    var targetSetting = null;
    for (var s = 0; s < settings.length; s++) {
      if (settings[s].key === settingKey) {
        targetSetting = settings[s];
        break;
      }
    }

    var currentCounterVal = targetSetting ? Number(targetSetting.value) : defaultStart;
    if (isNaN(currentCounterVal) || currentCounterVal <= 0) {
      currentCounterVal = defaultStart;
    }

    // Check existing admission numbers in Students table to guarantee NO collision
    var existingStudents = getTableData('Students');
    var maxFound = currentCounterVal;

    for (var i = 0; i < existingStudents.length; i++) {
      var adm = existingStudents[i].admission_no || '';
      if (mode === 'ONLINE' && adm.indexOf('OMA') === 0) {
        var num = parseInt(adm.replace('OMA', ''), 10);
        if (!isNaN(num) && num >= maxFound) maxFound = num + 1;
      } else if (mode === 'OFFLINE' && adm.indexOf('MA') === 0 && adm.indexOf('OMA') !== 0) {
        var num = parseInt(adm.replace('MA', ''), 10);
        if (!isNaN(num) && num >= maxFound) maxFound = num + 1;
      }
    }

    var generatedNumber = Math.max(currentCounterVal, maxFound);
    admissionNo = prefix + generatedNumber;
    var nextSettingVal = generatedNumber + 1;

    // Update Setting in DB
    if (targetSetting) {
      updateRecord('Settings', targetSetting.id, { value: String(nextSettingVal) }, currentUser.id);
    } else {
      insertRecord('Settings', {
        key: settingKey,
        value: String(nextSettingVal),
        description: 'Next sequential ' + mode.toLowerCase() + ' admission number'
      }, currentUser.id);
    }

    // 1. Insert Student Record
    var studentRecord = {
      student_id: studentId,
      admission_no: admissionNo,
      mode: mode,
      full_name: fullName,
      mobile: mobile,
      personal_email: personalEmail,
      professional_email: '',
      course_code: courseCode,
      status: 'LEAD_CONVERTED',
      assignment_state: 'PENDING',
      needed_month: '',
      batch_change_log_json: '[]',
      outcome_status: 'ACTIVE',
      outcome_reason: '',
      outcome_date: '',
      sales_staff_id: salesStaffId,
      batch_id: '',
      total_fee: totalFee,
      joined_date: new Date().toISOString().substring(0, 10),
      photo_url: payload.photo_url || ''
    };
    insertRecord('Students', studentRecord, currentUser.id);

    // 2. Auto-create Student Login Account (Mobile + Admission Number as password)
    var salt = 'STU_SALT_' + Utilities.getUuid().substring(0, 8);
    var passHash = hashSecret(salt, admissionNo);

    insertRecord('Users', {
      username: admissionNo,
      email: personalEmail,
      mobile: mobile,
      full_name: fullName,
      role: 'STUDENT',
      department: 'Students',
      student_id: studentId,
      salt: salt,
      password_hash: passHash,
      failed_attempts: 0
    }, currentUser.id);

    // 3. Initialize FeePlan (₹500 registration, ₹2450 balance reg pending)
    var feePlan = {
      student_id: studentId,
      total_fee: totalFee,
      registration_fee: 500,
      balance_registration: 2450,
      installment_count: 4,
      status: 'PENDING_REGISTRATION_PAYMENT'
    };
    var createdPlan = insertRecord('FeePlans', feePlan, currentUser.id);

    // Create Initial Registration Installment row
    insertRecord('Installments', {
      fee_plan_id: createdPlan.id,
      student_id: studentId,
      installment_no: 0,
      title: 'Registration Fee',
      due_date: new Date().toISOString().substring(0, 10),
      amount: 500,
      status: 'UNPAID',
      paid_amount: 0,
      postpone_count: 0
    }, currentUser.id);

    // 4. Create Task for OPS_EXEC: "After-sales call"
    var opsTask = {
      title: 'After-sales call: ' + fullName + ' (' + admissionNo + ')',
      description: 'Contact student to verify enrollment details, language preferences, and batch availability',
      assignee_id: 'OPS_EXEC',
      assigned_by: currentUser.id,
      due_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      priority: 'HIGH',
      status: 'PENDING'
    };
    insertRecord('Tasks', opsTask, currentUser.id);

    // 5. Create System Notification for Operations team
    insertRecord('Notifications', {
      recipient_user_id: 'ALL_OPS',
      role_target: 'OPS_EXEC',
      title: 'New Admission Registered: ' + admissionNo,
      message: fullName + ' enrolled in ' + courseCode + ' (' + mode + ') by ' + (currentUser.full_name || currentUser.id) + '. After-sales call pending.',
      type: 'ADMISSION',
      is_read: false
    }, currentUser.id);

    logAudit('CREATE_ADMISSION', 'Students', studentId, { admission_no: admissionNo, mode: mode, total_fee: totalFee, sales_staff: salesStaffId }, currentUser);

  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    data: {
      student_id: studentId,
      admission_no: admissionNo,
      full_name: fullName,
      course_code: courseCode,
      mode: mode,
      total_fee: totalFee,
      sales_staff_id: salesStaffId
    }
  };
}

/**
 * Fetch list of admissions with flexible filtering
 */
function getAdmissions(filters, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'OFFICE_ADMIN', 'PLACEMENT_ADMIN', 'HR', 'DEPT_HEAD', 'STAFF']);

  var students = getTableData('Students');
  var query = (filters && filters.query) ? String(filters.query).toLowerCase() : '';
  var course = (filters && filters.course_code) ? filters.course_code : '';
  var mode = (filters && filters.mode) ? filters.mode : '';
  var status = (filters && filters.status) ? filters.status : '';

  var filtered = students.filter(function(s) {
    if (query && s.full_name.toLowerCase().indexOf(query) === -1 && s.admission_no.toLowerCase().indexOf(query) === -1 && String(s.mobile).indexOf(query) === -1) {
      return false;
    }
    if (course && s.course_code !== course) return false;
    if (mode && s.mode !== mode) return false;
    if (status && s.status !== status) return false;
    return true;
  });

  return {
    ok: true,
    data: {
      items: filtered,
      total: filtered.length
    }
  };
}
