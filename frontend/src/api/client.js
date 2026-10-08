/**
 * MLC ERP - API Client & Mock Engine Bridge
 * Interacts with Google Apps Script Web App (doPost with text/plain)
 * or falls back smoothly to interactive local mock database.
 */

import { getMockDb, saveMockDb, resetMockDb } from './mockDb';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Execute RPC Call
 */
export async function apiCall(action, payload = {}, token = null) {
  // If API_URL is configured and not in forced demo mode, call Google Apps Script
  if (API_URL && !localStorage.getItem('FORCE_MOCK_MODE')) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Prevents CORS preflight
        },
        body: JSON.stringify({
          action,
          token: token || localStorage.getItem('MLC_AUTH_TOKEN'),
          payload,
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Server request failed');
      }
      return result.data;
    } catch (err) {
      console.warn(`Apps Script fetch failed for [${action}], falling back to local simulation:`, err);
      // Fall through to mock engine below
    }
  }

  // Local Mock Engine Execution
  return executeMockAction(action, payload, token);
}

/**
 * High-fidelity local simulation of Apps Script backend
 */
function executeMockAction(action, payload, token) {
  const db = getMockDb();
  const currentToken = token || localStorage.getItem('MLC_AUTH_TOKEN');
  const loggedInUserId = localStorage.getItem('MLC_USER_ID') || 'usr-1';
  const currentUser = db.users.find(u => u.id === loggedInUserId) || db.users[0];

  switch (action) {
    case 'login': {
      const { login_type, identifier, secret } = payload;
      let user = null;

      if (login_type === 'STUDENT') {
        const cleanMobile = (identifier || '').replace(/\D/g, '').slice(-10);
        user = db.users.find(u => u.role === 'STUDENT' && (u.mobile?.slice(-10) === cleanMobile || u.username?.toUpperCase() === (secret || '').toUpperCase()));
      } else if (login_type === 'TRAINER') {
        user = db.users.find(u => u.role === 'TRAINER' && u.email?.toLowerCase() === (identifier || '').toLowerCase());
      } else {
        user = db.users.find(u => u.role !== 'STUDENT' && u.email?.toLowerCase() === (identifier || '').toLowerCase());
      }

      if (!user) {
        throw new Error('Invalid credentials. Please check your login details.');
      }

      const mockToken = 'tok_' + Math.random().toString(36).substring(2, 15);
      return {
        token: mockToken,
        expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        user: { ...user }
      };
    }

    case 'getMe': {
      return { user: currentUser };
    }

    case 'getAdmissions': {
      return { items: db.students, total: db.students.length };
    }

    case 'createAdmission': {
      const mode = (payload.mode || 'ONLINE').toUpperCase();
      const prefix = mode === 'ONLINE' ? 'OMA' : 'MA';
      const settingKey = mode === 'ONLINE' ? 'next_online_no' : 'next_offline_no';
      const defaultStart = mode === 'ONLINE' ? 1034 : 2017;

      let currentNo = parseInt(db.settings[settingKey], 10) || defaultStart;

      // Check max existing
      db.students.forEach(st => {
        const adm = st.admission_no || '';
        if (mode === 'ONLINE' && adm.startsWith('OMA')) {
          const n = parseInt(adm.replace('OMA', ''), 10);
          if (n >= currentNo) currentNo = n + 1;
        } else if (mode === 'OFFLINE' && adm.startsWith('MA') && !adm.startsWith('OMA')) {
          const n = parseInt(adm.replace('MA', ''), 10);
          if (n >= currentNo) currentNo = n + 1;
        }
      });

      const admissionNo = `${prefix}${currentNo}`;
      db.settings[settingKey] = String(currentNo + 1);

      const studentId = 'STU-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const newStudent = {
        id: 'st-' + Date.now(),
        student_id: studentId,
        admission_no: admissionNo,
        mode: mode,
        full_name: payload.full_name,
        mobile: payload.mobile,
        personal_email: payload.personal_email || '',
        professional_email: '',
        course_code: payload.course_code || 'HRCA',
        status: 'LEAD_CONVERTED',
        assignment_state: 'PENDING',
        needed_month: '',
        batch_change_log_json: '[]',
        outcome_status: 'ACTIVE',
        outcome_reason: '',
        outcome_date: '',
        sales_staff_id: currentUser.staff_id || currentUser.id || 'ST-01',
        batch_id: '',
        total_fee: Number(payload.total_fee) || (payload.course_code === 'BHA' ? 35000 : 25000),
        joined_date: new Date().toISOString().substring(0, 10),
        photo_url: payload.photo_url || ''
      };

      // Auto-create student login
      db.users.push({
        id: 'usr-' + Date.now(),
        username: admissionNo,
        email: payload.personal_email,
        mobile: payload.mobile,
        full_name: payload.full_name,
        role: 'STUDENT',
        department: 'Students',
        student_id: studentId
      });

      // Initial registration installment
      db.installments.push({
        id: 'inst-' + Date.now(),
        student_id: studentId,
        installment_no: 0,
        title: 'Registration Fee',
        due_date: new Date().toISOString().substring(0, 10),
        amount: 500,
        status: 'UNPAID',
        paid_amount: 0
      });

      db.students.unshift(newStudent);
      saveMockDb(db);
      return newStudent;
    }

    // Section 1: Batches
    case 'createBatch': {
      const rawName = String(payload.name || payload.batch_code || '').trim().toUpperCase();
      const slot = String(payload.slot || '').trim();
      const startDate = String(payload.start_date || '').trim();

      if (!/^BH\d+$/.test(rawName)) {
        throw new Error("Batch name must strictly follow the format 'BH' + number (e.g. BH17, BH19, BH20).");
      }

      if (db.batches.some(b => b.name === rawName || b.batch_code === rawName)) {
        throw new Error(`A batch named '${rawName}' already exists.`);
      }

      if (!['8:30 AM', '10:30 AM', '12:30 PM'].includes(slot)) {
        throw new Error("Invalid time slot. Must be '8:30 AM', '10:30 AM', or '12:30 PM'.");
      }

      const newBatch = {
        id: 'batch-' + Date.now(),
        batch_code: rawName,
        name: rawName,
        slot,
        start_date: startDate,
        original_start_date: startDate,
        start_date_history_json: '[]',
        end_date: '',
        mode: payload.mode || 'ONLINE',
        course_code: payload.course_code || 'HRCA',
        status: 'PLANNED',
        default_trainer_id: payload.default_trainer_id || 'TR-101'
      };

      db.batches.push(newBatch);
      saveMockDb(db);
      return newBatch;
    }

    case 'postponeBatchStartDate': {
      const { batch_id, new_start_date, reason } = payload;
      const batch = db.batches.find(b => b.id === batch_id);
      if (!batch) throw new Error('Batch not found');

      // Check held classes
      const hasHeldClasses = db.sessions.some(s => s.batch_id === batch_id && s.status === 'DONE');
      if (hasHeldClasses && currentUser.role !== 'MAIN_ADMIN') {
        throw new Error('Cannot postpone start date: this batch already has classes marked as held.');
      }

      let history = [];
      try {
        history = JSON.parse(batch.start_date_history_json || '[]');
      } catch (e) {
        history = [];
      }

      history.push({
        old_date: batch.start_date,
        new_date: new_start_date,
        reason: reason || '',
        by: currentUser.full_name || currentUser.id,
        when: new Date().toISOString()
      });

      batch.start_date = new_start_date;
      batch.start_date_history_json = JSON.stringify(history);
      saveMockDb(db);
      return batch;
    }

    case 'updateBatch': {
      const batch = db.batches.find(b => b.id === payload.batch_id);
      if (!batch) throw new Error('Batch not found');
      if (payload.name) batch.name = payload.name;
      if (payload.slot) batch.slot = payload.slot;
      if (payload.default_trainer_id) batch.default_trainer_id = payload.default_trainer_id;
      saveMockDb(db);
      return batch;
    }

    // Section 3: After Sales
    case 'getAfterSalesData': {
      const userMap = {};
      db.users.forEach(u => { userMap[u.id] = u.full_name; if (u.staff_id) userMap[u.staff_id] = u.full_name; });

      const batchSeatsMap = {};
      db.batches.forEach(b => {
        batchSeatsMap[b.id] = db.students.filter(s => s.batch_id === b.id).length;
      });

      const pending = [];
      const deferred = [];
      const assigned = [];

      db.students.filter(s => s.status !== 'DROPPED').forEach(s => {
        const item = {
          ...s,
          sales_person_name: userMap[s.sales_staff_id] || s.sales_staff_id || 'Direct / Online'
        };
        if (item.assignment_state === 'DEFERRED') {
          deferred.push(item);
        } else if (item.assignment_state === 'ASSIGNED' && item.batch_id) {
          assigned.push(item);
        } else {
          pending.push(item);
        }
      });

      const enhancedBatches = db.batches.map(b => ({
        ...b,
        seats_assigned: batchSeatsMap[b.id] || 0
      }));

      return { pending, deferred, assigned, batches: enhancedBatches };
    }

    case 'assignBatch': {
      const { student_id, batch_id } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (student) {
        student.batch_id = batch_id;
        student.assignment_state = 'ASSIGNED';
        student.status = 'ASSIGNED';
      }
      saveMockDb(db);
      return { student_id, batch_id, status: 'ASSIGNED' };
    }

    case 'deferStudent': {
      const { student_id, needed_month, reason } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (student) {
        student.assignment_state = 'DEFERRED';
        student.needed_month = needed_month;
        student.batch_id = '';
      }
      saveMockDb(db);
      return { student_id, assignment_state: 'DEFERRED', needed_month };
    }

    case 'changeStudentBatch': {
      const { student_id, new_batch_id, reason } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (!student) throw new Error('Student not found');

      let logs = [];
      try {
        logs = JSON.parse(student.batch_change_log_json || '[]');
      } catch (e) {
        logs = [];
      }

      logs.push({
        old_batch_id: student.batch_id,
        new_batch_id,
        reason,
        by: currentUser.full_name || currentUser.id,
        when: new Date().toISOString()
      });

      student.batch_id = new_batch_id;
      student.assignment_state = 'ASSIGNED';
      student.batch_change_log_json = JSON.stringify(logs);
      saveMockDb(db);
      return { student_id, batch_id: new_batch_id, assignment_state: 'ASSIGNED' };
    }

    case 'logAfterSalesCall': {
      const { student_id, outcome, preferred_batch, notes } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (student && outcome === 'DROPPED') {
        student.status = 'DROPPED';
        student.assignment_state = 'DROPPED';
      }
      saveMockDb(db);
      return { student_id, outcome, notes, success: true };
    }

    case 'startBatch': {
      const { batch_id, start_date } = payload;
      const batch = db.batches.find(b => b.id === batch_id);
      if (batch) {
        batch.status = 'ACTIVE';
        batch.start_date = start_date || new Date().toISOString().substring(0, 10);
      }
      saveMockDb(db);
      return { batch_id, activated: 2 };
    }

    case 'getBatchesList': {
      return db.batches;
    }

    // Section 4: Timetable
    case 'getTimetableForDate': {
      const date = payload.date || new Date(Date.now() + 86400000).toISOString().substring(0, 10);
      const rooms = ['IT Tech Lab', 'Success Room', 'Future CEO', 'Growth Room', 'Idea Room', 'BSchool'];
      const slots = ['8:30 AM', '10:30 AM', '12:30 PM'];

      const grid = db.batches.map(b => {
        const existing = (db.timetable || []).find(t => t.batch_id === b.id && t.date === date);
        return {
          batch_id: b.id,
          batch_code: b.batch_code,
          batch_name: b.name,
          batch_status: b.status,
          course_code: b.course_code,
          mode: b.mode,
          date,
          slot: existing?.slot || b.slot || '10:30 AM',
          module_code: existing?.module_code || (b.course_code === 'BHA' ? 'HA1' : 'M01'),
          topic_id: existing?.topic_id || 'Interactive Discussion & Workshop',
          trainer_id: existing?.trainer_id || b.default_trainer_id || 'TR-101',
          room: existing?.room || 'IT Tech Lab',
          is_locked: false,
          can_edit: true,
          lock_reason: '',
          topics_covered_note: existing?.topic_id || ''
        };
      });

      return { date, lock_hours: 24, rooms, slots, grid, warnings: [] };
    }

    case 'bulkSaveTimetableGrid': {
      const { date, entries } = payload;
      if (!db.timetable) db.timetable = [];

      (entries || []).forEach(e => {
        const idx = db.timetable.findIndex(t => t.batch_id === e.batch_id && t.date === date);
        const item = {
          id: 'tt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          batch_id: e.batch_id,
          date: date,
          slot: e.slot,
          module_code: e.module_code,
          topic_id: e.topic_id,
          trainer_id: e.trainer_id,
          room: e.room,
          locked: false
        };
        if (idx !== -1) {
          db.timetable[idx] = item;
        } else {
          db.timetable.push(item);
        }
      });

      saveMockDb(db);
      return { saved_count: (entries || []).length, errors: [], warnings: [] };
    }

    // Section 5: Student Tomorrow Class
    case 'getStudentTomorrowClass': {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
      const student = db.students.find(s => s.student_id === payload.student_id) || db.students[0];
      const entry = (db.timetable || []).find(t => t.batch_id === student?.batch_id && t.date === tomorrow) || {
        slot: '10:30 AM',
        module_code: 'M02',
        topic_id: 'AI Workplace Prompts & Automation Case Studies',
        trainer_id: 'TR-101',
        room: 'IT Tech Lab'
      };

      return {
        date: tomorrow,
        is_published: true,
        slot: entry.slot || '10:30 AM',
        module_code: entry.module_code || 'M02',
        module_title: 'Business Technology Skills & Gen AI',
        topic: entry.topic_id || 'AI Workplace Prompts & Automation Case Studies',
        trainer_id: entry.trainer_id || 'TR-101',
        trainer_name: 'Vajid Trainer (Lead Corporate & AI)',
        classroom: entry.room || 'IT Tech Lab',
        hours: 2
      };
    }

    // Section 4: Main Admin Topics Covered Report
    case 'getTopicsCoveredReport': {
      const reports = db.batches.map(b => {
        const coveredCount = b.id === 'batch-1' ? 4 : 0;
        const totalPlanned = b.course_code === 'BHA' ? 45 : 30;
        const coveredHours = coveredCount * 2;
        const totalHours = b.course_code === 'BHA' ? 90 : 60;
        return {
          batch_id: b.id,
          batch_code: b.batch_code,
          batch_name: b.name,
          slot: b.slot || '10:30 AM',
          course_code: b.course_code,
          start_date: b.start_date,
          status: b.status,
          planned_hours: totalHours,
          covered_hours: coveredHours,
          planned_topics: totalPlanned,
          covered_topics_count: coveredCount,
          progress_pct: Math.round((coveredHours / totalHours) * 100),
          last_session: coveredCount > 0 ? {
            date: '2026-02-08',
            time: '10:00 - 12:00',
            module_code: 'M02',
            topic: 'Gen AI for Business & Administration (M02)',
            trainer_name: 'Vajid Trainer'
          } : null,
          covered_sessions: [
            { session_id: 'ses-1', date: '2026-02-05', time: '10:00 - 12:00', module_code: 'M01', topic: 'Ice Breaking & Public Speaking', trainer_name: 'Vajid Trainer', hours: 2 },
            { session_id: 'ses-2', date: '2026-02-06', time: '10:00 - 12:00', module_code: 'M01', topic: 'Gen AI & Career Clarity', trainer_name: 'Vajid Trainer', hours: 2 },
            { session_id: 'ses-3', date: '2026-02-07', time: '10:00 - 12:00', module_code: 'M02', topic: 'Google Workspace for Business', trainer_name: 'Rasheed', hours: 2 },
            { session_id: 'ses-4', date: '2026-02-08', time: '10:00 - 12:00', module_code: 'M02', topic: 'Gen AI for Business & Administration', trainer_name: 'Vajid Trainer', hours: 2 }
          ]
        };
      });
      return { total_batches: db.batches.length, reports };
    }

    // Section 7: Sales Daily Counts
    case 'saveSalesDailyCounts': {
      if (!db.salesDailyCounts) db.salesDailyCounts = [];
      const staffId = payload.staff_id || currentUser.staff_id || 'ST-01';
      const date = payload.date || new Date().toISOString().substring(0, 10);

      const idx = db.salesDailyCounts.findIndex(c => c.staff_id === staffId && c.date === date);
      const item = {
        id: 'sdc-' + Date.now(),
        staff_id: staffId,
        date: date,
        leads: Number(payload.leads) || 0,
        qualified: Number(payload.qualified) || 0,
        interested: Number(payload.interested) || 0,
        bucket_new: Number(payload.bucket_new) || 0,
        bucket_lost: Number(payload.bucket_lost) || 0
      };

      if (idx !== -1) {
        db.salesDailyCounts[idx] = item;
      } else {
        db.salesDailyCounts.unshift(item);
      }
      saveMockDb(db);
      return item;
    }

    case 'getSalesDailyCounts': {
      const counts = db.salesDailyCounts || [];
      const totalLeads = counts.reduce((sum, c) => sum + (Number(c.leads) || 0), 0);
      const totalQualified = counts.reduce((sum, c) => sum + (Number(c.qualified) || 0), 0);
      const totalInterested = counts.reduce((sum, c) => sum + (Number(c.interested) || 0), 0);
      const totalBucketNew = counts.reduce((sum, c) => sum + (Number(c.bucket_new) || 0), 0);
      const totalBucketLost = counts.reduce((sum, c) => sum + (Number(c.bucket_lost) || 0), 0);

      const sorted = counts.slice().sort((a, b) => (Number(b.bucket_lost) || 0) - (Number(a.bucket_lost) || 0));

      return {
        staff_id: payload.staff_id || 'ST-01',
        staff_list: [
          { id: 'usr-9', staff_id: 'ST-01', full_name: 'Ajeesha M', email: 'sales1@mastered.in' },
          { id: 'usr-8', staff_id: 'ST-02', full_name: 'Farhan A (Sales Head)', email: 'saleshead@mastered.in' }
        ],
        summary: {
          total_leads: totalLeads,
          total_qualified: totalQualified,
          total_interested: totalInterested,
          total_bucket_new: totalBucketNew,
          total_bucket_lost: totalBucketLost,
          current_bucket_balance: totalBucketNew - totalBucketLost
        },
        entries: sorted
      };
    }

    // Section 8: Sales Incentives
    case 'getMyIncentives': {
      const month = payload.month || '2026-02';
      const staffId = payload.staff_id || currentUser.staff_id || 'ST-01';

      const myStudents = db.students.filter(s => s.sales_staff_id === staffId || staffId === 'ALL');
      const myStudentIds = new Set(myStudents.map(s => s.student_id));

      const monthPayments = (db.payments || []).filter(p => myStudentIds.has(p.student_id) && (p.paid_month === month || p.payment_date?.startsWith(month)));
      const collectionsTotal = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const grossIncentive = Math.round(collectionsTotal * 0.1);

      const droppedWithout = myStudents.filter(s => s.outcome_status === 'DROPPED_WITHOUT_CAME' && (s.outcome_date?.startsWith(month) || s.joined_date?.startsWith(month)));
      const deductions = droppedWithout.length * 250;
      const net = grossIncentive - deductions;

      const paymentRecords = monthPayments.map(p => {
        const student = myStudents.find(s => s.student_id === p.student_id);
        const amt = Number(p.amount) || 0;
        return {
          payment_id: p.id,
          student_id: p.student_id,
          student_name: student ? student.full_name : 'Student',
          admission_no: student ? student.admission_no : '',
          amount: amt,
          due_month: p.due_month || month,
          paid_month: p.paid_month || month,
          payment_mode: p.payment_mode,
          receipt_no: p.receipt_no,
          incentive_amount: Math.round(amt * 0.1)
        };
      });

      return {
        staff_id: staffId,
        month,
        summary: {
          collections_total: collectionsTotal,
          incentive_rate_pct: 10,
          gross_incentive: grossIncentive,
          dropped_without_came_count: droppedWithout.length,
          drop_penalty_per_student: 250,
          total_deductions: deductions,
          net_incentive: net
        },
        payments: paymentRecords,
        students: myStudents
      };
    }

    case 'setStudentOutcomeStatus': {
      const { student_id, outcome_status, reason, outcome_date } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (!student) throw new Error('Student not found');

      if (outcome_status === 'DROPPED_WITHOUT_CAME') {
        const hasAttendance = (db.attendance || []).some(a => a.student_id === student_id && ['P', 'L', 'EXCUSED'].includes(a.status));
        if (hasAttendance) {
          throw new Error("Validation Error: Student has attended classes. 'DROPPED_WITHOUT_CAME' is not permitted. Please select 'DROPPED_AFTER_CAME'.");
        }
      }

      student.outcome_status = outcome_status;
      student.outcome_reason = reason || '';
      student.outcome_date = outcome_date || new Date().toISOString().substring(0, 10);
      if (['DROPPED_AFTER_CAME', 'DROPPED_WITHOUT_CAME'].includes(outcome_status)) {
        student.status = 'DROPPED';
        student.assignment_state = 'DROPPED';
      } else if (outcome_status === 'COMPLETED') {
        student.status = 'COMPLETED';
      } else {
        student.status = 'ACTIVE';
      }

      saveMockDb(db);
      return student;
    }

    case 'recordPayment': {
      const { student_id, installment_id, amount, payment_mode, reference_no, remarks } = payload;
      const receiptNo = 'REC-2026-' + Math.floor(10000 + Math.random() * 90000);
      const nowIso = new Date().toISOString();
      const currentMonth = nowIso.substring(0, 7);

      const student = db.students.find(s => s.student_id === student_id);
      const installment = db.installments.find(i => i.id === installment_id);

      const payment = {
        id: 'pay-' + Date.now(),
        student_id,
        installment_id,
        amount: Number(amount),
        due_month: installment?.due_date ? String(installment.due_date).substring(0, 7) : currentMonth,
        paid_month: currentMonth,
        sales_staff_id: student?.sales_staff_id || 'ST-01',
        payment_mode: payment_mode || 'UPI',
        reference_no: reference_no || 'REF-' + Date.now(),
        payment_date: nowIso,
        receipt_no: receiptNo,
        remarks: remarks || ''
      };

      if (!db.payments) db.payments = [];
      db.payments.push(payment);

      if (installment) {
        installment.paid_amount = (Number(installment.paid_amount) || 0) + Number(amount);
        installment.status = (installment.paid_amount >= installment.amount) ? 'PAID' : 'PARTIAL';
        installment.paid_date = nowIso;
      }

      saveMockDb(db);
      return { payment, receipt_no: receiptNo, installment_status: installment?.status || 'PAID', paid_amount: installment?.paid_amount || amount };
    }

    case 'getAttendanceSummary': {
      return {
        overall_percentage: 95.0,
        overall_shortfall_hours: 0,
        is_eligible: true,
        modules: [
          { module_code: 'M01', title: 'Future Career Foundation', conducted_hours: 6, attended_hours: 6, percentage: 100, eligible: true },
          { module_code: 'M02', title: 'Business Technology Skills', conducted_hours: 4, attended_hours: 4, percentage: 100, eligible: true },
          { module_code: 'M03', title: 'Corporate Administration & Management', conducted_hours: 0, attended_hours: 0, percentage: 100, eligible: true },
          { module_code: 'M04', title: 'Modern HR Management with AI', conducted_hours: 0, attended_hours: 0, percentage: 100, eligible: true }
        ]
      };
    }

    case 'getAttendanceOverview': {
      return {
        overall_institute_pct: 92.4,
        total_enrolled: db.students.length,
        total_eligible: db.students.filter(s => s.status !== 'DROPPED').length,
        eligible_percentage: 91.8,
        today_present_count: 24,
        today_late_count: 1,
        today_absent_count: 2,
        batches: db.batches.map(b => ({
          batch_id: b.id,
          batch_code: b.batch_code,
          name: b.name,
          status: b.status,
          average_attendance_pct: 92.5,
          eligible_students: 18,
          total_students: 20
        }))
      };
    }

    case 'getFeeAnalytics': {
      const totalCollected = (db.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      return {
        total_collected: totalCollected || 178500,
        total_pending: 82400,
        total_overdue: 16500,
        next_7_days_due: 27500,
        batch_breakdown: db.batches.map(b => ({
          batch_id: b.id,
          batch_code: b.batch_code,
          name: b.name,
          collected: 125000,
          pending: 45000,
          overdue: 11000
        }))
      };
    }

    case 'getAccessibleNotes': {
      return { notes: db.notes || [], assignments: db.noteAssignments || [] };
    }

    case 'saveNote': {
      const note = {
        id: payload.id || ('not-' + Date.now()),
        module_code: payload.module_code,
        title: payload.title,
        file_type: payload.file_type || 'PDF',
        file_url: payload.file_url,
        description: payload.description || '',
        assigned_trainer_id: payload.assigned_trainer_id || 'TR-101'
      };
      if (!db.notes) db.notes = [];
      const idx = db.notes.findIndex(n => n.id === note.id);
      if (idx !== -1) {
        db.notes[idx] = note;
      } else {
        db.notes.push(note);
      }
      saveMockDb(db);
      return note;
    }

    case 'deleteNote': {
      db.notes = (db.notes || []).filter(n => n.id !== payload.note_id);
      saveMockDb(db);
      return { note_id: payload.note_id, deleted: true };
    }

    case 'assignNoteToBatch': {
      if (!db.noteAssignments) db.noteAssignments = [];
      db.noteAssignments.push({
        id: 'na-' + Date.now(),
        note_id: payload.note_id,
        batch_id: payload.batch_id,
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString()
      });
      saveMockDb(db);
      return { success: true };
    }

    case 'getPlacementTrackerData': {
      return {
        students: db.students.map((s, idx) => ({
          student_id: s.student_id,
          admission_no: s.admission_no,
          full_name: s.full_name,
          mobile: s.mobile,
          personal_email: s.personal_email,
          professional_email: s.professional_email,
          professional_email_confirmed: !!s.professional_email,
          course_code: s.course_code,
          batch_id: s.batch_id,
          total_fee: s.total_fee,
          mode: s.mode,
          grade: 'A',
          overall_score: 90.5,
          attendance_percentage: 95.0,
          is_eligible: true,
          shortfall_hours: 0,
          preferences: db.preferences?.[0] || null,
          placement_state: 'READY',
          placement_reason: 'Interview ready',
          interviews_count: 1,
          offers_count: 1,
          interviews: db.interviews || [],
          offers: db.offers || [],
          agreement_status: 'SIGNED_VERIFIED',
          agreement_id: `AGR-2026-${('0000' + (idx + 1)).slice(-4)}`,
          agreement_signed_date: '2026-02-01',
          agreement_verified_by: 'Office Admin (Anjali)',
          agreement_url: 'https://drive.google.com/signed_student_agreements/sample.pdf'
        })),
        metrics: {
          total_candidates: db.students.length,
          placement_percentage: 85.0,
          conversion_percentage: 75.0,
          interviews_per_student: 1.5,
          status_breakdown: { READY: 2, INTERVIEW_SCHEDULED: 1, PLACED: 1, NO_NEED_JOB: 0, NOT_NOW: 0, PREF_PENDING: 0 },
          agreement_summary: {
            total_enrolled: db.students.length,
            signed_verified: db.students.length,
            pending: 0,
            coverage_percentage: 100
          }
        }
      };
    }

    case 'getBatchChatMessages': {
      return { messages: db.chatMessages || [] };
    }

    case 'sendBatchChatMessage': {
      const msg = {
        id: 'msg-' + Date.now(),
        batch_id: payload.batch_id || 'batch-1',
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_role: currentUser.role,
        message: payload.message,
        created_at: new Date().toISOString()
      };
      if (!db.chatMessages) db.chatMessages = [];
      db.chatMessages.push(msg);
      saveMockDb(db);
      return msg;
    }

    default:
      console.warn('Unhandled mock action:', action, payload);
      return { success: true };
  }
}
