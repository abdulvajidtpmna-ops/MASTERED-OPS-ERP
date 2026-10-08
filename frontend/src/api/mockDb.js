/**
 * MLC ERP - Client-Side Mock Database & Engine
 * Mirroring the Google Apps Script backend with initial seed data.
 */

const STORAGE_KEY = 'MLC_ERP_MOCK_STORAGE_V1';

const INITIAL_DATA = {
  users: [
    { id: 'usr-1', username: 'admin@mastered.in', email: 'admin@mastered.in', mobile: '9847000001', full_name: 'Director (Main Admin)', role: 'MAIN_ADMIN', department: 'Management' },
    { id: 'usr-2', username: 'ops@mastered.in', email: 'ops@mastered.in', mobile: '9847000002', full_name: 'Suresh Kumar', role: 'OPS_ADMIN', department: 'Operations' },
    { id: 'usr-3', username: 'opsexec@mastered.in', email: 'opsexec@mastered.in', mobile: '9847000003', full_name: 'Fathima Nasrin', role: 'OPS_EXEC', department: 'Operations' },
    { id: 'usr-4', username: 'office@mastered.in', email: 'office@mastered.in', mobile: '9847000004', full_name: 'Anjali Ramesh', role: 'OFFICE_ADMIN', department: 'Administration' },
    { id: 'usr-5', username: 'placement@mastered.in', email: 'placement@mastered.in', mobile: '9847000005', full_name: 'Vipin Das', role: 'PLACEMENT_ADMIN', department: 'Placement Cell' },
    { id: 'usr-6', username: 'hr@mastered.in', email: 'hr@mastered.in', mobile: '9847000006', full_name: 'Deepa Menon', role: 'HR', department: 'Human Resources' },
    { id: 'usr-7', username: 'marketinghead@mastered.in', email: 'marketinghead@mastered.in', mobile: '9847000007', full_name: 'Shahbaz K', role: 'DEPT_HEAD', department: 'Marketing' },
    { id: 'usr-8', username: 'saleshead@mastered.in', email: 'saleshead@mastered.in', mobile: '9847000008', full_name: 'Farhan A', role: 'DEPT_HEAD', department: 'Sales' },
    { id: 'usr-9', username: 'sales1@mastered.in', email: 'sales1@mastered.in', mobile: '9847000009', full_name: 'Ajeesha M', role: 'STAFF', department: 'Sales', staff_id: 'ST-01' },
    { id: 'usr-10', username: 'vajid@mastered.in', email: 'vajid@mastered.in', mobile: '9847000010', full_name: 'Vajid Trainer', role: 'TRAINER', department: 'Academics', trainer_id: 'TR-101' },
    { id: 'usr-11', username: 'anoop@mastered.in', email: 'anoop@mastered.in', mobile: '9847000011', full_name: 'Dr. Anoop Nair', role: 'TRAINER', department: 'Healthcare Academics', trainer_id: 'TR-102' },
    { id: 'usr-12', username: 'ON-2026-0001', email: 'rahul.k@gmail.com', mobile: '9847123456', full_name: 'Rahul Krishnan', role: 'STUDENT', department: 'Students', student_id: 'STU-001' },
    { id: 'usr-13', username: 'ON-2026-0002', email: 'sneha.m@gmail.com', mobile: '9847654321', full_name: 'Sneha Mohan', role: 'STUDENT', department: 'Students', student_id: 'STU-002' }
  ],
  students: [
    { id: 'st-1', student_id: 'STU-001', admission_no: 'ON-2026-0001', mode: 'ONLINE', full_name: 'Rahul Krishnan', mobile: '9847123456', personal_email: 'rahul.k@gmail.com', professional_email: 'rahul.krishnan@mlctalent.in', course_code: 'HRCA', status: 'ACTIVE', sales_staff_id: 'ST-01', batch_id: 'batch-1', total_fee: 25000, joined_date: '2026-02-01' },
    { id: 'st-2', student_id: 'STU-002', admission_no: 'ON-2026-0002', mode: 'ONLINE', full_name: 'Sneha Mohan', mobile: '9847654321', personal_email: 'sneha.m@gmail.com', professional_email: 'sneha.mohan@mlctalent.in', course_code: 'BHA', status: 'ACTIVE', sales_staff_id: 'ST-01', batch_id: 'batch-1', total_fee: 35000, joined_date: '2026-02-01' },
    { id: 'st-3', student_id: 'STU-003', admission_no: 'OF-2026-0001', mode: 'OFFLINE', full_name: 'Muhammed Nihal', mobile: '9847888999', personal_email: 'nihal.m@gmail.com', professional_email: '', course_code: 'HRCA', status: 'LEAD_CONVERTED', sales_staff_id: 'ST-01', batch_id: '', total_fee: 25000, joined_date: '2026-02-10' }
  ],
  batches: [
    { id: 'batch-1', batch_code: 'HRCA-B26-01', course_code: 'HRCA', name: 'HRCA / BHA Morning Super Batch', start_date: '2026-02-05', end_date: '2026-05-15', mode: 'ONLINE', status: 'ACTIVE', default_trainer_id: 'TR-101' },
    { id: 'batch-2', batch_code: 'HRCA-B26-02', course_code: 'HRCA', name: 'Corporate Weekend Cohort', start_date: '2026-03-01', end_date: '2026-06-30', mode: 'ONLINE', status: 'UPCOMING', default_trainer_id: 'TR-101' }
  ],
  modules: [
    { code: 'M01', title: 'Future Career Foundation', hours: 12, course: 'HRCA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'M02', title: 'Business Technology Skills', hours: 30, course: 'HRCA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'M03', title: 'Corporate Administration & Management', hours: 30, course: 'HRCA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'M04', title: 'Modern HR Management with AI', hours: 26, course: 'HRCA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'M05', title: 'Sales & Customer Relations Management', hours: 16, course: 'HRCA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'M06', title: 'Professional English & Interview Vocabulary', hours: 13, course: 'HRCA', weight_test: 40, weight_presentation: 30, weight_mock: 30 },
    { code: 'HA1', title: 'Foundations of Healthcare Management', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'HA2', title: 'Hospital Departments & Services', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'HA3', title: 'Hospital Patient Relations & Service Management', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'HA4', title: 'Healthcare Operations & Workflow Management', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'HA5', title: 'Bio-medical Waste & Facility Safety', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'HA6', title: 'Quality Management in Healthcare', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 },
    { code: 'HA7', title: 'Insurance & Hospital Billing Systems', hours: 10, course: 'BHA', weight_test: 50, weight_presentation: 25, weight_mock: 25 }
  ],
  sessions: [
    { id: 'ses-1', session_id: 'SES-001', batch_id: 'batch-1', module_code: 'M01', date: '2026-02-05', start_time: '10:00', end_time: '12:00', hours: 2, audience: 'ALL', status: 'DONE', topics_covered_note: 'Ice Breaking & Public Speaking' },
    { id: 'ses-2', session_id: 'SES-002', batch_id: 'batch-1', module_code: 'M01', date: '2026-02-06', start_time: '10:00', end_time: '12:00', hours: 2, audience: 'ALL', status: 'DONE', topics_covered_note: 'Gen AI & Career Clarity' },
    { id: 'ses-3', session_id: 'SES-003', batch_id: 'batch-1', module_code: 'M02', date: '2026-02-07', start_time: '10:00', end_time: '14:00', hours: 4, audience: 'ALL', status: 'DONE', topics_covered_note: 'Gen AI for Business & Administration' },
    { id: 'ses-4', session_id: 'SES-004', batch_id: 'batch-1', module_code: 'HA1', date: '2026-02-08', start_time: '15:00', end_time: '17:00', hours: 2, audience: 'BHA_ONLY', status: 'DONE', topics_covered_note: 'Healthcare Ecosystem Overview' },
    { id: 'ses-5', session_id: 'SES-005', batch_id: 'batch-1', module_code: 'M02', date: '2026-02-12', start_time: '10:00', end_time: '12:00', hours: 2, audience: 'ALL', status: 'PLANNED', topics_covered_note: '' }
  ],
  attendance: [
    { id: 'att-1', session_id: 'SES-001', student_id: 'STU-001', status: 'P', marked_at: '2026-02-05T12:05:00Z' },
    { id: 'att-2', session_id: 'SES-001', student_id: 'STU-002', status: 'P', marked_at: '2026-02-05T12:05:00Z' },
    { id: 'att-3', session_id: 'SES-002', student_id: 'STU-001', status: 'P', marked_at: '2026-02-06T12:05:00Z' },
    { id: 'att-4', session_id: 'SES-002', student_id: 'STU-002', status: 'L', marked_at: '2026-02-06T12:05:00Z' },
    { id: 'att-5', session_id: 'SES-003', student_id: 'STU-001', status: 'P', marked_at: '2026-02-07T14:05:00Z' },
    { id: 'att-6', session_id: 'SES-003', student_id: 'STU-002', status: 'P', marked_at: '2026-02-07T14:05:00Z' },
    { id: 'att-7', session_id: 'SES-004', student_id: 'STU-002', status: 'P', marked_at: '2026-02-08T17:05:00Z' }
  ],
  assessments: [
    { id: 'ass-1', student_id: 'STU-001', batch_id: 'batch-1', module_code: 'M01', type: 'TEST', score: 92, max_score: 100, absent: false },
    { id: 'ass-2', student_id: 'STU-001', batch_id: 'batch-1', module_code: 'M01', type: 'PRESENTATION', score: 88, max_score: 100, absent: false },
    { id: 'ass-3', student_id: 'STU-001', batch_id: 'batch-1', module_code: 'M01', type: 'MOCK_INTERVIEW', score: 90, max_score: 100, absent: false },
    { id: 'ass-4', student_id: 'STU-002', batch_id: 'batch-1', module_code: 'M01', type: 'TEST', score: 85, max_score: 100, absent: false }
  ],
  grades: [
    { id: 'gr-1', student_id: 'STU-001', batch_id: 'batch-1', overall_score: 90.5, grade: 'A', status: 'PASSED' },
    { id: 'gr-2', student_id: 'STU-002', batch_id: 'batch-1', overall_score: 85.0, grade: 'B', status: 'PASSED' }
  ],
  installments: [
    { id: 'inst-1', student_id: 'STU-001', installment_no: 0, title: 'Registration Fee', due_date: '2026-02-01', amount: 500, status: 'PAID', paid_amount: 500, paid_date: '2026-02-01' },
    { id: 'inst-2', student_id: 'STU-001', installment_no: 0.5, title: 'Balance Registration Fee', due_date: '2026-02-05', amount: 2450, status: 'PAID', paid_amount: 2450, paid_date: '2026-02-05' },
    { id: 'inst-3', student_id: 'STU-001', installment_no: 1, title: '1st Course Installment', due_date: '2026-02-12', amount: 5512, status: 'PAID', paid_amount: 5512, paid_date: '2026-02-10' },
    { id: 'inst-4', student_id: 'STU-001', installment_no: 2, title: '2nd Course Installment', due_date: '2026-03-14', amount: 5512, status: 'UNPAID', paid_amount: 0 },
    { id: 'inst-5', student_id: 'STU-001', installment_no: 3, title: '3rd Course Installment', due_date: '2026-04-13', amount: 5512, status: 'UNPAID', paid_amount: 0 },
    { id: 'inst-6', student_id: 'STU-001', installment_no: 4, title: '4th Course Installment', due_date: '2026-05-13', amount: 5514, status: 'UNPAID', paid_amount: 0 },
    { id: 'inst-7', student_id: 'STU-002', installment_no: 0, title: 'Registration Fee', due_date: '2026-02-01', amount: 500, status: 'PAID', paid_amount: 500, paid_date: '2026-02-01' },
    { id: 'inst-8', student_id: 'STU-002', installment_no: 0.5, title: 'Balance Registration Fee', due_date: '2026-02-05', amount: 2450, status: 'PAID', paid_amount: 2450, paid_date: '2026-02-05' },
    { id: 'inst-9', student_id: 'STU-002', installment_no: 1, title: '1st Course Installment', due_date: '2026-02-12', amount: 8012, status: 'UNPAID', paid_amount: 0 }
  ],
  payments: [
    { id: 'pay-1', student_id: 'STU-001', installment_id: 'inst-1', amount: 500, payment_mode: 'UPI', reference_no: 'UPI-982348123', payment_date: '2026-02-01', receipt_no: 'REC-2026-00101' },
    { id: 'pay-2', student_id: 'STU-001', installment_id: 'inst-2', amount: 2450, payment_mode: 'UPI', reference_no: 'UPI-982349921', payment_date: '2026-02-05', receipt_no: 'REC-2026-00102' },
    { id: 'pay-3', student_id: 'STU-001', installment_id: 'inst-3', amount: 5512, payment_mode: 'BANK_TRANSFER', reference_no: 'NEFT-883491', payment_date: '2026-02-10', receipt_no: 'REC-2026-00103' },
    { id: 'pay-4', student_id: 'STU-002', installment_id: 'inst-7', amount: 500, payment_mode: 'UPI', reference_no: 'UPI-112233', payment_date: '2026-02-01', receipt_no: 'REC-2026-00104' },
    { id: 'pay-5', student_id: 'STU-002', installment_id: 'inst-8', amount: 2450, payment_mode: 'CASH', reference_no: 'CASH-OFFICE', payment_date: '2026-02-05', receipt_no: 'REC-2026-00105' }
  ],
  preferences: [
    { id: 'pref-1', student_id: 'STU-001', location_1: 'Calicut', location_2: 'Kochi', location_3: 'Bangalore', role_1: 'HR Executive', role_2: 'Operations Executive', role_3: 'Administrative Executive', entered_by: 'usr-5', professional_email_confirmed: true }
  ],
  interviews: [
    { id: 'int-1', student_id: 'STU-001', company: 'Aster DM Healthcare', position: 'HR Executive', location: 'Calicut', interview_date: '2026-02-25', interview_time: '11:00 AM', status: 'COMPLETED', result: 'OFFER_MADE', email_sent_at: '2026-02-20T10:00:00Z' }
  ],
  offers: [
    { id: 'off-1', student_id: 'STU-001', company: 'Aster DM Healthcare', position: 'HR Executive', location: 'Calicut', package_lpa: 3.6, offer_date: '2026-02-27', joining_date: '2026-03-15', status: 'ACCEPTED', email_sent_at: '2026-02-27T15:30:00Z' }
  ],
  placementStatuses: [
    { id: 'ps-1', student_id: 'STU-001', state: 'PLACED', reason: 'Joined Aster DM Healthcare' },
    { id: 'ps-2', student_id: 'STU-002', state: 'READY', reason: 'Preferences registered' }
  ],
  duties: [
    { id: 'dut-1', assignee_id: 'ST-01', date: new Date().toISOString().substring(0, 10), title: 'Follow-up with New Inbound Inquiries (20 Calls)', status: 'DONE', requires_evidence: true, done_at: '2026-02-10T14:30:00Z', remark: 'Completed 22 prospective calls. 3 scheduled for admissions.', review_rating: 5, review_comment: 'Excellent conversion rate!' },
    { id: 'dut-2', assignee_id: 'ST-01', date: new Date().toISOString().substring(0, 10), title: 'Update CRM daily pipeline notes', status: 'PENDING', requires_evidence: false }
  ],
  dutyEvidence: [
    { id: 'ev-1', duty_id: 'dut-1', file_url: 'https://drive.google.com/call_logs_feb10.png', type: 'IMAGE', note: 'Call tracker screenshot' }
  ],
  kpis: [
    { id: 'kpi-1', assignee_id: 'ST-01', period: 'February 2026', kra: 'Lead Conversion', kpi: 'New Enrollments', target: 20, actual: 16, unit: 'Students', weight: 40, status: 'ON_TRACK' },
    { id: 'kpi-2', assignee_id: 'ST-01', period: 'February 2026', kra: 'Customer Engagement', kpi: 'Daily Call Volume', target: 400, actual: 420, unit: 'Calls', weight: 30, status: 'ACHIEVED' }
  ],
  notes: [
    { id: 'not-1', module_code: 'M01', title: 'Complete Future Career Foundation Guidebook', file_type: 'PDF', file_url: 'https://mastered.in/notes/M01_Career_Foundation.pdf', uploaded_by: 'usr-1', is_active: true },
    { id: 'not-2', module_code: 'M02', title: 'Gen AI Prompts & Business Workflows Cheatsheet', file_type: 'PDF', file_url: 'https://mastered.in/notes/M02_GenAI_Cheatsheet.pdf', uploaded_by: 'usr-1', is_active: true }
  ],
  noteAssignments: [
    { id: 'na-1', note_id: 'not-1', batch_id: 'batch-1', assigned_by: 'TR-101', assigned_at: '2026-02-05T10:00:00Z' },
    { id: 'na-2', note_id: 'not-2', batch_id: 'batch-1', assigned_by: 'TR-101', assigned_at: '2026-02-07T10:00:00Z' }
  ],
  chatMessages: [
    { id: 'msg-1', batch_id: 'batch-1', sender_id: 'usr-10', sender_name: 'Vajid Trainer', sender_role: 'TRAINER', message: 'Welcome everyone! Please make sure to download the Module 1 study notes before tomorrow class.', created_at: '2026-02-05T09:00:00Z' },
    { id: 'msg-2', batch_id: 'batch-1', student_id: 'STU-001', sender_id: 'usr-12', sender_name: 'Rahul Krishnan', sender_role: 'STUDENT', message: 'Thank you Sir! Looking forward to the AI sessions.', created_at: '2026-02-05T09:15:00Z' }
  ],
  notifications: [
    { id: 'nt-1', recipient_user_id: 'STU-001', role_target: 'STUDENT', title: 'Interview Scheduled', message: 'Your interview with Aster DM Healthcare is confirmed for Feb 25, 11:00 AM.', type: 'INTERVIEW', is_read: false, created_at: '2026-02-20T10:00:00Z' },
    { id: 'nt-2', recipient_user_id: 'ALL_OPS', role_target: 'OPS_ADMIN', title: 'Fee Postponement Request', message: 'New postponement submitted for Sneha Mohan.', type: 'POSTPONE', is_read: false, created_at: '2026-02-08T09:00:00Z' }
  ],
  settings: {
    registration_fee: '500',
    start_day_balance: '2450',
    installments: '4',
    first_installment_days: '7',
    gap_days: '30',
    eligibility_pct: '85',
    LOCATIONS: JSON.stringify(['Calicut', 'Kannur', 'Malappuram', 'Palakkad', 'Kochi', 'Bangalore']),
    ROLES_LIST: JSON.stringify([
      'Administrative Executive', 'Operations Executive', 'Business Development Executive', 'Sales Executive',
      'Marketing Executive', 'Customer Relationship Executive', 'Customer Support Executive', 'MIS Executive',
      'Office Administrator', 'Project Coordinator', 'HR Executive', 'HR Assistant', 'HR Coordinator',
      'Recruitment Executive', 'Talent Acquisition Executive', 'Payroll Executive', 'HR Operations Executive',
      'Training & Development Executive', 'Employee Relations Executive', 'HR MIS Executive', 'Hospital Administration Executive',
      'Hospital Operations Executive', 'Hospital Coordinator', 'Patient Care Coordinator', 'Patient Relations Executive',
      'Hospital Front Office Executive', 'Hospital Billing Executive', 'Medical Records Executive', 'Insurance/TPA Executive',
      'Hospital Quality Executive'
    ]),
    GRADE_BANDS: JSON.stringify([
      { grade: 'A', min: 90, max: 100, color: '#F5B921', label: 'Gold (Distinction)' },
      { grade: 'B', min: 80, max: 89.99, color: '#0B5FFF', label: 'Blue (Excellent)' },
      { grade: 'C', min: 65, max: 79.99, color: '#0D9488', label: 'Teal (Good)' },
      { grade: 'D', min: 50, max: 64.99, color: '#D97706', label: 'Amber (Pass)' },
      { grade: 'F', min: 0, max: 49.99, color: '#DC2626', label: 'Red (Needs Improvement)' },
      { grade: 'E', min: -1, max: -1, color: '#6B7280', label: 'Grey (Absent)' }
    ])
  },
  auditLogs: [
    { id: 'aud-1', action: 'CREATE_ADMISSION', entity: 'Students', entity_id: 'STU-001', details: 'Admission ON-2026-0001 created', actor_role: 'STAFF', created_at: '2026-02-01T10:00:00Z', created_by: 'usr-9' },
    { id: 'aud-2', action: 'START_BATCH', entity: 'Batches', entity_id: 'batch-1', details: 'Batch started with 2 students', actor_role: 'OPS_ADMIN', created_at: '2026-02-05T08:30:00Z', created_by: 'usr-2' },
    { id: 'aud-3', action: 'SCHEDULE_INTERVIEW', entity: 'Interviews', entity_id: 'int-1', details: 'Interview scheduled at Aster DM Healthcare', actor_role: 'PLACEMENT_ADMIN', created_at: '2026-02-20T10:00:00Z', created_by: 'usr-5' }
  ]
};

export function getMockDb() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  return JSON.parse(existing);
}

export function saveMockDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetMockDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}
