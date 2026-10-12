/**
 * MASTERED OPS ERP - Client-Side Database & Engine
 * Official staff users, fresh production state without dummy records,
 * and support for Daily To-Dos (before 10am / 9pm) & Social Media engagement.
 */

const STORAGE_KEY = 'MASTERED_OPS_ERP_STORAGE_V4';

const INITIAL_DATA = {
  users: [
    { id: 'usr-1', username: 'farhan.mankave@gmail.com', email: 'farhan.mankave@gmail.com', mobile: '9847000001', full_name: 'Farhan', role: 'MAIN_ADMIN', department: 'Management' },
    { id: 'usr-2', username: 'ceomsacademy@gmail.com', email: 'ceomsacademy@gmail.com', mobile: '9847000002', full_name: 'Rasheed', role: 'OPS_ADMIN', department: 'Operations' },
    { id: 'usr-3', username: 'qualitymastered25@gmail.com', email: 'qualitymastered25@gmail.com', mobile: '9847000003', full_name: 'Zahad', role: 'OPS_EXEC', department: 'Operations' },
    { id: 'usr-4', username: 'ashifirkkur111@gmail.com', email: 'ashifirkkur111@gmail.com', mobile: '9847000004', full_name: 'Ashif (Sales Head)', role: 'SALES_HEAD', department: 'Sales', staff_id: 'SH-01' },
    { id: 'usr-5', username: 'safnasafnat2001@gmail.com', email: 'safnasafnat2001@gmail.com', mobile: '9847000005', full_name: 'Safna', role: 'SALES_EXEC', department: 'Sales', staff_id: 'ST-01' },
    { id: 'usr-6', username: 'fasnaofficialsales@gmail.com', email: 'fasnaofficialsales@gmail.com', mobile: '9847000006', full_name: 'Fasna', role: 'SALES_EXEC', department: 'Sales', staff_id: 'ST-02' },
    { id: 'usr-7', username: 'Shabanashababasha@gmail.com', email: 'Shabanashababasha@gmail.com', mobile: '9847000007', full_name: 'Shabana', role: 'SALES_EXEC', department: 'Sales', staff_id: 'ST-03' },
    { id: 'usr-8', username: 'shahabasbinriyas@gmail.com', email: 'shahabasbinriyas@gmail.com', mobile: '9847000008', full_name: 'Shahabas', role: 'MARKETING_HEAD', department: 'Marketing' },
    { id: 'usr-9', username: 'Shahalcalicut86@gmail.com', email: 'Shahalcalicut86@gmail.com', mobile: '9847000009', full_name: 'Shahal', role: 'SOCIAL_MEDIA_MANAGER', department: 'Marketing' },
    { id: 'usr-10', username: 'adheelafathima8@gmail.com', email: 'adheelafathima8@gmail.com', mobile: '9847000010', full_name: 'Adheela', role: 'VIDEO_EDITOR', department: 'Marketing' },
    { id: 'usr-11', username: 'vvgayathri22@gmail.com', email: 'vvgayathri22@gmail.com', mobile: '9847000011', full_name: 'Gayathri', role: 'POSTER_DESIGNER', department: 'Marketing' },
    { id: 'usr-12', username: 'ashif.placement@mastered.in', email: 'ashifirkkur111@gmail.com', mobile: '9847000004', full_name: 'Ashif Irikkur (Placement)', role: 'PLACEMENT_ADMIN', department: 'Placement Cell' },
    { id: 'usr-13', username: 'trainer@mastered.in', email: 'trainer@mastered.in', mobile: '9847000012', full_name: 'Faculty Trainer', role: 'TRAINER', department: 'Academics', trainer_id: 'TR-101' },
    { id: 'usr-14', username: 'hr@mastered.in', email: 'hr@mastered.in', mobile: '9847000013', full_name: 'HR Coordinator', role: 'HR', department: 'Human Resources' },
    { id: 'usr-15', username: 'office@mastered.in', email: 'office@mastered.in', mobile: '9847000014', full_name: 'Office Admin', role: 'OFFICE_ADMIN', department: 'Administration' }
  ],
  students: [],
  batches: [
    { id: 'batch-1', batch_code: 'BH17', course_code: 'HRCA', name: 'BH17', slot: '10:30 AM', start_date: '2026-10-15', original_start_date: '2026-10-15', start_date_history_json: '[]', end_date: '2027-01-15', mode: 'ONLINE', status: 'ACTIVE', default_trainer_id: 'TR-101' }
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
  timetable: [],
  timetableLogs: [],
  salesDailyCounts: [],
  sessions: [],
  attendance: [],
  assessments: [],
  grades: [],
  installments: [],
  payments: [],
  preferences: [],
  interviews: [],
  offers: [],
  placementStatuses: [],
  duties: [],
  dutyEvidence: [],
  kpis: [],
  // Daily To-Dos (Creation before 10 AM, Update before 9 PM, Sunday Leave)
  dailyToDos: [],
  // Mandatory Instagram Engagement Posts
  socialPosts: [
    {
      id: 'sp-1',
      title: 'Mastered Skill Academy Leadership Reel',
      post_url: 'https://www.instagram.com/p/DFzL1MpvX_8/',
      caption: 'Mandatory engagement: Like, comment positive thoughts, and save the reel.',
      created_by: 'usr-9',
      created_by_name: 'Shahal (Social Media Manager)',
      created_at: new Date().toISOString()
    }
  ],
  // Records of staff who liked & commented
  socialEngagements: [],
  notes: [
    { id: 'not-1', module_code: 'M01', title: 'Mastered Career Foundation Official Guidebook', file_type: 'PDF', file_url: 'https://mastered.in/notes/M01_Career_Foundation.pdf', uploaded_by: 'usr-1', is_active: true }
  ],
  noteAssignments: [],
  chatMessages: [],
  notifications: [],
  settings: {
    next_offline_no: '2017',
    next_online_no: '1034',
    timetable_lock_hours: '24',
    incentive_pct: '10',
    incentive_includes_registration: 'true',
    drop_penalty: '250',
    registration_fee: '500',
    start_day_balance: '2450',
    installments: '4',
    first_installment_days: '7',
    gap_days: '30',
    eligibility_pct: '85',
    ROOMS_LIST: JSON.stringify(['IT Tech Lab', 'Success Room', 'Future CEO', 'Growth Room', 'Idea Room', 'BSchool']),
    SLOTS_LIST: JSON.stringify(['8:30 AM', '10:30 AM', '12:30 PM']),
    LOCATIONS: JSON.stringify(['Calicut', 'Kannur', 'Malappuram', 'Palakkad', 'Kochi', 'Bangalore']),
    ROLES_LIST: JSON.stringify([
      'MAIN_ADMIN', 'OPS_ADMIN', 'OPS_EXEC', 'SALES_HEAD', 'SALES_EXEC',
      'MARKETING_HEAD', 'SOCIAL_MEDIA_MANAGER', 'VIDEO_EDITOR', 'POSTER_DESIGNER',
      'PLACEMENT_ADMIN', 'TRAINER', 'HR', 'OFFICE_ADMIN', 'STUDENT'
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
    { id: 'aud-1', action: 'SYSTEM_INITIALIZED', entity: 'System', entity_id: 'ROOT', details: 'Mastered OPS ERP initialized with official faculty & staff directory', actor_role: 'MAIN_ADMIN', created_at: new Date().toISOString(), created_by: 'usr-1' }
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
