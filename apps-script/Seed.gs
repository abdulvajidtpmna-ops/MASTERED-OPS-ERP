/**
 * MLC ERP - Database Initializer & Seed Module
 * Creates all 37+ tabs with frozen header rows, sets standard audit columns,
 * and populates full courses, modules, topics, grade bands, lists, and users.
 */

var TAB_DEFINITIONS = {
  Settings: ['id', 'key', 'value', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Counters: ['id', 'key', 'value', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Users: ['id', 'username', 'email', 'mobile', 'full_name', 'role', 'department', 'student_id', 'trainer_id', 'staff_id', 'salt', 'password_hash', 'failed_attempts', 'locked_until', 'last_login_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Sessions_Auth: ['id', 'user_id', 'token', 'role', 'expires_at', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Staff: ['id', 'staff_id', 'full_name', 'email', 'mobile', 'role', 'department', 'designation', 'joining_date', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Trainers: ['id', 'trainer_id', 'full_name', 'email', 'mobile', 'specialization', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Courses: ['id', 'course_code', 'title', 'description', 'total_modules', 'total_hours', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Modules: ['id', 'course_code', 'module_code', 'title', 'sequence', 'total_hours', 'description', 'weight_test', 'weight_presentation', 'weight_mock', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Topics: ['id', 'module_code', 'topic_code', 'title', 'hours', 'trainers_pool', 'audience', 'sequence', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Batches: ['id', 'batch_code', 'course_code', 'name', 'start_date', 'end_date', 'mode', 'status', 'default_trainer_id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  BatchStudents: ['id', 'batch_id', 'student_id', 'joined_at', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Students: ['id', 'student_id', 'admission_no', 'mode', 'full_name', 'mobile', 'personal_email', 'professional_email', 'course_code', 'status', 'sales_staff_id', 'batch_id', 'total_fee', 'joined_date', 'photo_url', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  AfterSalesCalls: ['id', 'student_id', 'called_by', 'call_date', 'outcome', 'preferred_batch', 'preferred_start_date', 'notes', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  ClassSessions: ['id', 'session_id', 'batch_id', 'module_code', 'topic_id', 'trainer_id', 'date', 'start_time', 'end_time', 'hours', 'audience', 'status', 'topics_covered_note', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Attendance: ['id', 'session_id', 'student_id', 'status', 'marked_by', 'marked_at', 'remarks', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  AssessmentConfig: ['id', 'course_code', 'module_code', 'test_weight', 'presentation_weight', 'mock_weight', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Assessments: ['id', 'student_id', 'batch_id', 'module_code', 'type', 'score', 'max_score', 'absent', 'trainer_id', 'remarks', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Grades: ['id', 'student_id', 'batch_id', 'overall_score', 'grade', 'status', 'calculated_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Notes: ['id', 'module_code', 'topic_id', 'title', 'file_type', 'file_url', 'uploaded_by', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  NoteAssignments: ['id', 'note_id', 'batch_id', 'assigned_by', 'assigned_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  FeePlans: ['id', 'student_id', 'total_fee', 'registration_fee', 'balance_registration', 'installment_count', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Installments: ['id', 'fee_plan_id', 'student_id', 'installment_no', 'title', 'due_date', 'amount', 'status', 'paid_amount', 'paid_date', 'postpone_count', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Payments: ['id', 'student_id', 'installment_id', 'amount', 'payment_mode', 'reference_no', 'payment_date', 'collected_by', 'receipt_no', 'receipt_url', 'remarks', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  PostponeRequests: ['id', 'installment_id', 'student_id', 'current_due_date', 'requested_due_date', 'reason', 'status', 'requested_by', 'reviewed_by', 'reviewed_at', 'review_remarks', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Agreements: ['id', 'student_id', 'sheet_image_urls', 'generated_pdf_url', 'status', 'sent_at', 'signed_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Preferences: ['id', 'student_id', 'location_1', 'location_2', 'location_3', 'role_1', 'role_2', 'role_3', 'entered_by', 'professional_email_confirmed', 'confirmed_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Interviews: ['id', 'student_id', 'batch_id', 'company', 'position', 'location', 'interview_date', 'interview_time', 'mode', 'status', 'result', 'remarks', 'email_sent_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Offers: ['id', 'student_id', 'batch_id', 'company', 'position', 'location', 'package_lpa', 'offer_date', 'joining_date', 'status', 'email_sent_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  PlacementStatus: ['id', 'student_id', 'state', 'reason', 'updated_at_state', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  DutyTemplates: ['id', 'title', 'description', 'role', 'department', 'recurrence', 'requires_evidence', 'assigned_by', 'is_active', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  DailyDuties: ['id', 'template_id', 'assignee_id', 'date', 'title', 'assigned_by', 'requires_evidence', 'status', 'done_at', 'remark', 'review_by', 'review_rating', 'review_comment', 'reviewed_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  DutyEvidence: ['id', 'duty_id', 'file_url', 'type', 'note', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Tasks: ['id', 'title', 'description', 'assignee_id', 'assigned_by', 'due_date', 'priority', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  KPIs: ['id', 'assignee_id', 'period', 'kra', 'kpi', 'target', 'actual', 'unit', 'weight', 'score', 'status', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  Notifications: ['id', 'recipient_user_id', 'role_target', 'title', 'message', 'type', 'link_url', 'is_read', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  ChatMessages: ['id', 'batch_id', 'sender_id', 'sender_name', 'sender_role', 'message', 'file_url', 'file_name', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  EmailLog: ['id', 'recipient_email', 'template_name', 'subject', 'status', 'error_message', 'sent_at', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted'],
  AuditLog: ['id', 'action', 'entity', 'entity_id', 'details', 'actor_role', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted']
};

/**
 * Main seed executor: run once inside Google Apps Script editor
 */
function seedDatabase() {
  var db = getDb();

  // 1. Create all missing sheets and set header row
  for (var tabName in TAB_DEFINITIONS) {
    var sheet = db.getSheetByName(tabName);
    var cols = TAB_DEFINITIONS[tabName];
    if (!sheet) {
      sheet = db.insertSheet(tabName);
    }
    sheet.clear();
    sheet.appendRow(cols);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#061B4D').setFontColor('#FFFFFF');
  }

  // 2. Counters Initialization
  var countersSheet = db.getSheetByName('Counters');
  var currentYear = new Date().getFullYear();
  insertRecord('Counters', { key: 'ADM_ONLINE', value: 0 }, 'SEED');
  insertRecord('Counters', { key: 'ADM_OFFLINE', value: 0 }, 'SEED');
  insertRecord('Counters', { key: 'RECEIPT_SEQ', value: 100 }, 'SEED');

  // 3. Settings Initialization
  var settings = [
    { key: 'registration_fee', value: '500', description: 'Registration fee amount' },
    { key: 'start_day_balance', value: '2450', description: 'Balance registration fee due on batch start date' },
    { key: 'installments', value: '4', description: 'Number of standard course installments' },
    { key: 'first_installment_days', value: '7', description: 'Days after start date for 1st installment' },
    { key: 'gap_days', value: '30', description: 'Days between subsequent installments' },
    { key: 'eligibility_pct', value: '85', description: 'Minimum attendance percentage for placement eligibility' },
    { key: 'allow_student_password_change', value: 'true', description: 'Whether students can change their login password' },
    { key: 'LOCATIONS', value: JSON.stringify(['Calicut', 'Kannur', 'Malappuram', 'Palakkad', 'Kochi', 'Bangalore']), description: 'Placement Locations' },
    { key: 'ROLES_LIST', value: JSON.stringify([
      'Administrative Executive', 'Operations Executive', 'Business Development Executive', 'Sales Executive',
      'Marketing Executive', 'Customer Relationship Executive', 'Customer Support Executive', 'MIS Executive',
      'Office Administrator', 'Project Coordinator', 'HR Executive', 'HR Assistant', 'HR Coordinator',
      'Recruitment Executive', 'Talent Acquisition Executive', 'Payroll Executive', 'HR Operations Executive',
      'Training & Development Executive', 'Employee Relations Executive', 'HR MIS Executive', 'Hospital Administration Executive',
      'Hospital Operations Executive', 'Hospital Coordinator', 'Patient Care Coordinator', 'Patient Relations Executive',
      'Hospital Front Office Executive', 'Hospital Billing Executive', 'Medical Records Executive', 'Insurance/TPA Executive',
      'Hospital Quality Executive'
    ]), description: 'Placement Candidate Roles' },
    { key: 'GRADE_BANDS', value: JSON.stringify([
      { grade: 'A', min: 90, max: 100, color: '#F5B921', label: 'Gold (Distinction)' },
      { grade: 'B', min: 80, max: 89.99, color: '#0B5FFF', label: 'Blue (Excellent)' },
      { grade: 'C', min: 65, max: 79.99, color: '#0D9488', label: 'Teal (Good)' },
      { grade: 'D', min: 50, max: 64.99, color: '#D97706', label: 'Amber (Pass)' },
      { grade: 'F', min: 0, max: 49.99, color: '#DC2626', label: 'Red (Needs Improvement)' },
      { grade: 'E', min: -1, max: -1, color: '#6B7280', label: 'Grey (Absent)' }
    ]), description: 'Grade calculation threshold matrix' }
  ];

  for (var s = 0; s < settings.length; s++) {
    insertRecord('Settings', settings[s], 'SEED');
  }

  // 4. Courses Seed
  insertRecord('Courses', {
    course_code: 'HRCA',
    title: 'HR & Corporate Administration',
    description: 'Comprehensive 6-module corporate HR & management diploma',
    total_modules: 6,
    total_hours: 117
  }, 'SEED');

  insertRecord('Courses', {
    course_code: 'BHA',
    title: 'Bachelor / Executive Hospital Administration',
    description: '13-module comprehensive curriculum (HRCA 6 modules + 7 Healthcare Administration modules)',
    total_modules: 13,
    total_hours: 187
  }, 'SEED');

  // 5. Modules & Topics Seed
  seedCurriculumData();

  // 6. Seed Initial Users (Main Admin, Ops Admin, Placement Admin, Office Admin, Trainers, HR, Staff)
  seedInitialUsers();

  Logger.log('MLC ERP Seed Completed Successfully!');
}

/**
 * Seed full curriculum with calculated module hours
 */
function seedCurriculumData() {
  var modulesList = [
    { code: 'M01', course: 'HRCA', title: 'Future Career Foundation', desc: 'Personality, AI & workplace foundation', wT: 50, wP: 25, wM: 25 },
    { code: 'M02', course: 'HRCA', title: 'Business Technology Skills', desc: 'Gen AI, Google Workspace, Excel & Tally', wT: 50, wP: 25, wM: 25 },
    { code: 'M03', course: 'HRCA', title: 'Corporate Administration & Management', desc: 'Office operations, SOPs, front office & CXO support', wT: 50, wP: 25, wM: 25 },
    { code: 'M04', course: 'HRCA', title: 'Modern HR Management with AI', desc: 'Recruitment, onboarding, payroll & employee engagement', wT: 50, wP: 25, wM: 25 },
    { code: 'M05', course: 'HRCA', title: 'Sales & Customer Relations Management', desc: 'Sales fundamentals, CRM, closing & relationship building', wT: 50, wP: 25, wM: 25 },
    { code: 'M06', course: 'HRCA', title: 'Professional English & Interview Vocabulary', desc: 'Corporate communication, interview strategy & mock interviews', wT: 40, wP: 30, wM: 30 },
    // HA Modules (BHA only)
    { code: 'HA1', course: 'BHA', title: 'Foundations of Healthcare Management', desc: 'Healthcare ecosystem, hospital administration & structure', wT: 50, wP: 25, wM: 25 },
    { code: 'HA2', course: 'BHA', title: 'Hospital Departments & Services', desc: 'OP/IP workflows, ICU, dialysis, mortuary & nursing admin', wT: 50, wP: 25, wM: 25 },
    { code: 'HA3', course: 'BHA', title: 'Hospital Patient Relations & Service Management', desc: 'Front office, floor management & patient experience', wT: 50, wP: 25, wM: 25 },
    { code: 'HA4', course: 'BHA', title: 'Healthcare Operations & Workflow Management', desc: 'Daily admin checklists, shifts, inter-dept coordination', wT: 50, wP: 25, wM: 25 },
    { code: 'HA5', course: 'BHA', title: 'Bio-medical Waste & Facility Safety', desc: 'BMW categorization, disposal, spillage, infection control', wT: 50, wP: 25, wM: 25 },
    { code: 'HA6', course: 'BHA', title: 'Quality Management in Healthcare', desc: 'NABH overview, OVR, quality indicators, PDCA projects', wT: 50, wP: 25, wM: 25 },
    { code: 'HA7', course: 'BHA', title: 'Insurance & Hospital Billing Systems', desc: 'TPAs, Ayushman/ESI/CGHS, pre-auth, billing desk setup', wT: 50, wP: 25, wM: 25 }
  ];

  var topicsList = [
    // M01 (12 hrs)
    { m: 'M01', c: 'T101', t: 'Ice Breaking & Public Speaking', h: 2, tp: 'Ashif / Ajeesha', aud: 'ALL' },
    { m: 'M01', c: 'T102', t: 'Gen AI & Career Clarity', h: 2, tp: 'Vajid / Farhan', aud: 'ALL' },
    { m: 'M01', c: 'T103', t: 'Digital Literacy for the Workplace', h: 2, tp: 'Rasheed / Shahabaz / Zahadh', aud: 'ALL' },
    { m: 'M01', c: 'T104', t: 'LinkedIn & Personal Branding', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M01', c: 'T105', t: 'Personal Vlogging & Professional Content', h: 2, tp: 'Shahbaz', aud: 'ALL' },
    { m: 'M01', c: 'T106', t: 'Canva Using AI', h: 2, tp: 'Shahbaz / Zahadh / Vajid', aud: 'ALL' },

    // M02 (30 hrs)
    { m: 'M02', c: 'T201', t: 'Gen AI for Business & Administration', h: 4, tp: 'Vajid', aud: 'ALL' },
    { m: 'M02', c: 'T202', t: 'Google Workspace for Business', h: 4, tp: 'Zahadh / Rasheed', aud: 'ALL' },
    { m: 'M02', c: 'T203', t: 'Digital Documentation Using AI', h: 4, tp: 'Zahadh / Rasheed', aud: 'ALL' },
    { m: 'M02', c: 'T204', t: 'Spreadsheet & Data Management Using AI', h: 10, tp: 'Rasheed', aud: 'ALL' },
    { m: 'M02', c: 'T205', t: 'Digital Presentation Using AI', h: 2, tp: 'Zahadh / Rasheed', aud: 'ALL' },
    { m: 'M02', c: 'T206', t: 'Presentation Skills', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M02', c: 'T207', t: 'Tally — Practical Basics', h: 4, tp: 'Noora', aud: 'ALL' },

    // M03 (30 hrs)
    { m: 'M03', c: 'T301', t: 'Understanding a Company & Who Does What', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T302', t: 'Build & Present Your Own Company', h: 2, tp: 'Shahbaz / Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T303', t: 'Set Up Your Office', h: 1, tp: 'Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T304', t: 'Know the Departments', h: 1, tp: 'Kamaru', aud: 'ALL' },
    { m: 'M03', c: 'T305', t: 'Workplace Manners, Professional Conduct & Grooming', h: 2, tp: 'Kamaru', aud: 'ALL' },
    { m: 'M03', c: 'T306', t: 'Customer, Client & Visitor Handling', h: 6, tp: 'Kamaru', aud: 'ALL' },
    { m: 'M03', c: 'T307', t: 'Front Office Practical', h: 4, tp: 'Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T308', t: 'Office Administration: Role & Daily Work', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T309', t: 'Secretary to CXO: Executive Support & Work Management', h: 2, tp: 'Kamaru', aud: 'ALL' },
    { m: 'M03', c: 'T310', t: 'Corporate Systems, SOPs, Processes & Policies', h: 2, tp: 'Vajid / Kamaru', aud: 'ALL' },
    { m: 'M03', c: 'T311', t: 'Workplace Communication: Email, Chat & Digital Collaboration', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T312', t: 'Event Management & Coordination: Plan, Run & Close', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M03', c: 'T313', t: 'Build, Verify & Finalise the Report', h: 2, tp: 'Vajid', aud: 'ALL' },

    // M04 (26 hrs)
    { m: 'M04', c: 'T401', t: 'Manpower Planning & Job Design', h: 2, tp: 'Kamaru', aud: 'ALL' },
    { m: 'M04', c: 'T402', t: 'Recruitment & Selection', h: 6, tp: 'Zahadh / Vajid / Subru / Kamaru', aud: 'ALL' },
    { m: 'M04', c: 'T403', t: 'Onboarding & Employee Integration', h: 4, tp: 'Zahadh / Vajid / Subru / Kamaru', aud: 'ALL' },
    { m: 'M04', c: 'T404', t: 'Training & Development', h: 2, tp: 'Subru', aud: 'ALL' },
    { m: 'M04', c: 'T405', t: 'Compensation & Benefits Management', h: 2, tp: 'Subru / Vajid', aud: 'ALL' },
    { m: 'M04', c: 'T406', t: 'Employee Engagement & Retention', h: 2, tp: 'Subru', aud: 'ALL' },
    { m: 'M04', c: 'T407', t: 'Performance Management & KPI', h: 2, tp: 'Vajid', aud: 'ALL' },
    { m: 'M04', c: 'T408', t: 'Exit Management & HR Documentation', h: 2, tp: 'Zahadh / Vajid / Subru / Kamaru', aud: 'ALL' },
    { m: 'M04', c: 'T409', t: 'HR Email Etiquette & Employee Communication', h: 2, tp: 'Subru / Vajid', aud: 'ALL' },
    { m: 'M04', c: 'T410', t: 'HR Practical: JD, Screening, Interview & Selection', h: 2, tp: 'Zahadh / Vajid / Subru / Kamaru', aud: 'ALL' },

    // M05 (16 hrs)
    { m: 'M05', c: 'T501', t: 'Sales Fundamentals & Sales Process', h: 4, tp: 'Vajid / Subru', aud: 'ALL' },
    { m: 'M05', c: 'T502', t: 'Sales Pitching Mastery & Discovery Calls', h: 2, tp: 'Vajid / Subru', aud: 'ALL' },
    { m: 'M05', c: 'T503', t: 'Lead Generation, Follow-up & CRM', h: 2, tp: 'Vajid / Subru', aud: 'ALL' },
    { m: 'M05', c: 'T504', t: 'Customer Relations Management', h: 2, tp: 'Vajid / Subru', aud: 'ALL' },
    { m: 'M05', c: 'T505', t: 'Handling Customers, Guests, Patients & Visitors', h: 2, tp: 'Vajid / Subru', aud: 'ALL' },
    { m: 'M05', c: 'T506', t: 'Complaint Handling & Difficult People Management', h: 2, tp: 'Vajid / Subru', aud: 'ALL' },
    { m: 'M05', c: 'T507', t: 'Objection Handling, Negotiation & Closing', h: 2, tp: 'Vajid / Subru', aud: 'ALL' },

    // M06 (13 hrs)
    { m: 'M06', c: 'T601', t: 'English for Interviews – Basics', h: 1, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T602', t: 'Self-Introduction & Personal Profile', h: 2, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T603', t: 'Job & Company Interview Questions', h: 1, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T604', t: 'Situational & Behavioural Questions', h: 1, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T605', t: 'Professional English & Interview Vocabulary', h: 2, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T606', t: 'Interview Speaking Confidence & Body Language', h: 1, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T607', t: 'Answering Techniques & Interview Strategies', h: 2, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T608', t: 'Difficult Interview Questions', h: 1, tp: 'Pending Assignment', aud: 'ALL' },
    { m: 'M06', c: 'T609', t: 'Mock Interview & Performance Feedback', h: 2, tp: 'Pending Assignment', aud: 'ALL' },

    // HA1 - Foundations of Healthcare Management (10 hrs)
    { m: 'HA1', c: 'HA101', t: 'Introduction to Healthcare Ecosystem & Structure', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA1', c: 'HA102', t: 'Introduction to Hospitals & Classification', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA1', c: 'HA103', t: 'Hospital Administration & Core Responsibilities', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA1', c: 'HA104', t: 'Administrative Departments & Governance', h: 1, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA1', c: 'HA105', t: 'Types of Healthcare Facilities & Polyclinics', h: 1, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA1', c: 'HA106', t: 'Medical Departments & Clinical Hierarchy', h: 1, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA1', c: 'HA107', t: 'Supportive & Technical Hospital Departments', h: 1, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },

    // HA2 - Hospital Departments & Services (10 hrs)
    { m: 'HA2', c: 'HA201', t: 'OP & IP Clinical Workflow Management', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA2', c: 'HA202', t: 'OT, ICU, Ambulance & Mortuary Protocols', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA2', c: 'HA203', t: 'Dialysis & Labour Room Operational Standards', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA2', c: 'HA204', t: 'Housekeeping, CSSD & Support Services', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA2', c: 'HA205', t: 'Nursing Administration & Shift Rota Planning', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },

    // HA3 - Hospital Patient Relations & Service Management (10 hrs)
    { m: 'HA3', c: 'HA301', t: 'Front Office & Floor Management in Hospitals', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA3', c: 'HA302', t: 'Patient Admission, Transfer & Discharge Procedures', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA3', c: 'HA303', t: 'Patient Feedback, Grievance & Escalation Handling', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA3', c: 'HA304', t: 'Hospital Information Systems (HIS) Practical', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA3', c: 'HA305', t: 'VIP Patient Handling & Service Excellence', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },

    // HA4 - Healthcare Operations & Workflow Management (10 hrs)
    { m: 'HA4', c: 'HA401', t: 'Daily Admin Operations & Morning Checklists', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA4', c: 'HA402', t: 'Staff Coordination & Duty Handover Protocols', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA4', c: 'HA403', t: 'Inter-Departmental Communication & Conflict Resolution', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA4', c: 'HA404', t: 'Task Management, Crisis Response & Escalation Matrix', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA4', c: 'HA405', t: 'Time Management in High-Pressure Clinical Settings', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },

    // HA5 - Bio-medical Waste & Facility Safety (10 hrs)
    { m: 'HA5', c: 'HA501', t: 'BMW Categorisation & Safe Disposal Guidelines', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA5', c: 'HA502', t: 'Chemical & Mercury Spillage Management Protocols', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA5', c: 'HA503', t: 'Hospital Infection Control (HICC) & Hand Hygiene', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA5', c: 'HA504', t: 'Waste Segregation, Colour Coding & Labeling Standards', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA5', c: 'HA505', t: 'Vendor Coordination, PCB Audits & Documentation', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },

    // HA6 - Quality Management in Healthcare (10 hrs)
    { m: 'HA6', c: 'HA601', t: 'Quality & NABH Accreditation Overview', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA6', c: 'HA602', t: 'Occurrence Variance Reporting (OVR) & Sentinel Events', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA6', c: 'HA603', t: 'Core 7 Quality Tools & Root Cause Analysis', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA6', c: 'HA604', t: 'Hospital Key Quality Indicators & Metrics', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA6', c: 'HA605', t: 'PDCA Cycles & Quality Improvement Projects', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },

    // HA7 - Insurance & Hospital Billing Systems (10 hrs)
    { m: 'HA7', c: 'HA701', t: 'Health Insurance & Third Party Administrators (TPAs)', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA7', c: 'HA702', t: 'Government & Private Schemes (Ayushman, ESI, CGHS)', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA7', c: 'HA703', t: 'Claim Forms, Pre-Authorisation & Reimbursements', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA7', c: 'HA704', t: 'Hospital Billing Desk Setup, Tariff & Package Rates', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' },
    { m: 'HA7', c: 'HA705', t: 'Coverage Communication, Software & Billing Scenarios', h: 2, tp: 'Dr. Anoop', aud: 'BHA_ONLY' }
  ];

  // Insert Topics
  var moduleHoursMap = {};
  for (var i = 0; i < topicsList.length; i++) {
    var top = topicsList[i];
    moduleHoursMap[top.m] = (moduleHoursMap[top.m] || 0) + top.h;
    insertRecord('Topics', {
      module_code: top.m,
      topic_code: top.c,
      title: top.t,
      hours: top.h,
      trainers_pool: top.tp,
      audience: top.aud,
      sequence: i + 1
    }, 'SEED');
  }

  // Insert Modules with exact SUM of topics hours
  for (var m = 0; m < modulesList.length; m++) {
    var mod = modulesList[m];
    var calculatedHours = moduleHoursMap[mod.code] || 0;
    insertRecord('Modules', {
      course_code: mod.course,
      module_code: mod.code,
      title: mod.title,
      sequence: m + 1,
      total_hours: calculatedHours,
      description: mod.desc,
      weight_test: mod.wT,
      weight_presentation: mod.wP,
      weight_mock: mod.wM
    }, 'SEED');

    insertRecord('AssessmentConfig', {
      course_code: mod.course,
      module_code: mod.code,
      test_weight: mod.wT,
      presentation_weight: mod.wP,
      mock_weight: mod.wM
    }, 'SEED');
  }
}

/**
 * Seed initial administrative, trainer, and student accounts with secure salted hashes
 */
function seedInitialUsers() {
  var salt = 'MLC_SALT_' + Utilities.getUuid().substring(0, 8);
  var defaultPassHash = hashSecret(salt, 'Mastered@2026');

  var users = [
    { username: 'admin@mastered.in', email: 'admin@mastered.in', mobile: '9847000001', full_name: 'Director (Main Admin)', role: 'MAIN_ADMIN', department: 'Management' },
    { username: 'ops@mastered.in', email: 'ops@mastered.in', mobile: '9847000002', full_name: 'Suresh Kumar', role: 'OPS_ADMIN', department: 'Operations' },
    { username: 'opsexec@mastered.in', email: 'opsexec@mastered.in', mobile: '9847000003', full_name: 'Fathima Nasrin', role: 'OPS_EXEC', department: 'Operations' },
    { username: 'office@mastered.in', email: 'office@mastered.in', mobile: '9847000004', full_name: 'Anjali Ramesh', role: 'OFFICE_ADMIN', department: 'Administration' },
    { username: 'placement@mastered.in', email: 'placement@mastered.in', mobile: '9847000005', full_name: 'Vipin Das', role: 'PLACEMENT_ADMIN', department: 'Placement Cell' },
    { username: 'hr@mastered.in', email: 'hr@mastered.in', mobile: '9847000006', full_name: 'Deepa Menon', role: 'HR', department: 'Human Resources' },
    { username: 'marketinghead@mastered.in', email: 'marketinghead@mastered.in', mobile: '9847000007', full_name: 'Shahbaz K', role: 'DEPT_HEAD', department: 'Marketing' },
    { username: 'saleshead@mastered.in', email: 'saleshead@mastered.in', mobile: '9847000008', full_name: 'Farhan A', role: 'DEPT_HEAD', department: 'Sales' },
    { username: 'sales1@mastered.in', email: 'sales1@mastered.in', mobile: '9847000009', full_name: 'Ajeesha M', role: 'STAFF', department: 'Sales' },
    { username: 'vajid@mastered.in', email: 'vajid@mastered.in', mobile: '9847000010', full_name: 'Vajid Trainer', role: 'TRAINER', department: 'Academics', trainer_id: 'TR-101' },
    { username: 'anoop@mastered.in', email: 'anoop@mastered.in', mobile: '9847000011', full_name: 'Dr. Anoop Nair', role: 'TRAINER', department: 'Healthcare Academics', trainer_id: 'TR-102' }
  ];

  for (var u = 0; u < users.length; u++) {
    var usr = users[u];
    var userSalt = salt;
    var userPass = 'Mastered@2026';
    if (usr.role === 'TRAINER') {
      userPass = usr.trainer_id; // Trainer password = Trainer ID
    }
    var hash = hashSecret(userSalt, userPass);

    insertRecord('Users', {
      username: usr.username,
      email: usr.email,
      mobile: usr.mobile,
      full_name: usr.full_name,
      role: usr.role,
      department: usr.department,
      trainer_id: usr.trainer_id || '',
      staff_id: usr.role === 'STAFF' || usr.role === 'DEPT_HEAD' ? 'ST-' + (u + 1) : '',
      salt: userSalt,
      password_hash: hash,
      failed_attempts: 0
    }, 'SEED');

    if (usr.role === 'TRAINER') {
      insertRecord('Trainers', {
        trainer_id: usr.trainer_id,
        full_name: usr.full_name,
        email: usr.email,
        mobile: usr.mobile,
        specialization: usr.trainer_id === 'TR-102' ? 'Hospital Administration' : 'Corporate Management & AI',
        is_active: true
      }, 'SEED');
    }
  }

  // Seed standard Duty Templates for recurring staff tasks
  var dutyTemplates = [
    { title: 'Follow-up with New Inbound Inquiries (20 Calls)', description: 'Call fresh portal leads and update CRM notes', role: 'STAFF', department: 'Sales', recurrence: 'DAILY', requires_evidence: true },
    { title: 'Publish 2 Reels & 1 Carousel on Instagram & LinkedIn', description: 'Post approved creative assets with tags and call to action', role: 'STAFF', department: 'Marketing', requires_evidence: true },
    { title: 'Check & Reconcile Today\'s Fee Collections', description: 'Cross-check bank receipts with ERP payment vouchers', role: 'OFFICE_ADMIN', department: 'Administration', recurrence: 'DAILY', requires_evidence: true },
    { title: 'Conduct Morning Batch Attendance & Shortfall Audit', description: 'Identify absent students and notify operations desk', role: 'OPS_EXEC', department: 'Operations', recurrence: 'DAILY', requires_evidence: false }
  ];

  for (var d = 0; d < dutyTemplates.length; d++) {
    insertRecord('DutyTemplates', dutyTemplates[d], 'SEED');
  }
}
