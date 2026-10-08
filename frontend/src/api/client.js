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
        user = db.users.find(u => u.role === 'STUDENT' && (u.mobile.slice(-10) === cleanMobile || u.username.toUpperCase() === (secret || '').toUpperCase()));
      } else if (login_type === 'TRAINER') {
        user = db.users.find(u => u.role === 'TRAINER' && u.email.toLowerCase() === (identifier || '').toLowerCase());
      } else {
        user = db.users.find(u => u.role !== 'STUDENT' && u.email.toLowerCase() === (identifier || '').toLowerCase());
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
      const mode = payload.mode || 'ONLINE';
      const year = new Date().getFullYear();
      const count = db.students.filter(s => s.mode === mode).length + 1;
      const prefix = mode === 'ONLINE' ? 'ON-' : 'OF-';
      const admissionNo = `${prefix}${year}-${('0000' + count).slice(-4)}`;
      const studentId = 'STU-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const newStudent = {
        id: 'st-' + Date.now(),
        student_id: studentId,
        admission_no: admissionNo,
        mode: mode,
        full_name: payload.full_name,
        mobile: payload.mobile,
        personal_email: payload.personal_email,
        professional_email: '',
        course_code: payload.course_code || 'HRCA',
        status: 'LEAD_CONVERTED',
        sales_staff_id: currentUser.staff_id || 'ST-01',
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

      // After-sales task
      db.duties.push({
        id: 'dut-' + Date.now(),
        assignee_id: 'usr-3',
        date: new Date().toISOString().substring(0, 10),
        title: `After-sales call: ${payload.full_name} (${admissionNo})`,
        status: 'PENDING',
        requires_evidence: false
      });

      db.students.unshift(newStudent);
      saveMockDb(db);
      return newStudent;
    }

    case 'logAfterSalesCall': {
      const { student_id, outcome, preferred_batch, notes } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (student && outcome === 'DROPPED') {
        student.status = 'DROPPED';
      }
      saveMockDb(db);
      return { student_id, outcome, notes, success: true };
    }

    case 'assignBatch': {
      const { student_id, batch_id } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (student) {
        student.batch_id = batch_id;
        student.status = 'ASSIGNED';
      }
      saveMockDb(db);
      return { student_id, batch_id, status: 'ASSIGNED' };
    }

    case 'startBatch': {
      const { batch_id, start_date } = payload;
      const batch = db.batches.find(b => b.id === batch_id);
      if (batch) {
        batch.status = 'ACTIVE';
        batch.start_date = start_date || new Date().toISOString().substring(0, 10);
      }

      const assignedStudents = db.students.filter(s => s.batch_id === batch_id);
      const startDate = new Date(batch.start_date);

      assignedStudents.forEach(st => {
        st.status = 'ACTIVE';
        const total = Number(st.total_fee) || 25000;
        const remaining = total - 500 - 2450;
        const base = Math.floor(remaining / 4);
        const rem = remaining - (base * 4);

        // Balance Reg
        db.installments.push({
          id: 'inst-' + Math.random(),
          student_id: st.student_id,
          installment_no: 0.5,
          title: 'Balance Registration Fee',
          due_date: batch.start_date,
          amount: 2450,
          status: 'UNPAID',
          paid_amount: 0
        });

        // 4 Installments
        [7, 37, 67, 97].forEach((days, idx) => {
          const d = new Date(startDate.getTime() + days * 86400000).toISOString().substring(0, 10);
          db.installments.push({
            id: 'inst-' + Math.random(),
            student_id: st.student_id,
            installment_no: idx + 1,
            title: `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} Course Installment`,
            due_date: d,
            amount: idx === 3 ? (base + rem) : base,
            status: 'UNPAID',
            paid_amount: 0
          });
        });
      });

      saveMockDb(db);
      return { batch_id, activated: assignedStudents.length };
    }

    case 'createClassSession': {
      const session = {
        id: 'ses-' + Date.now(),
        session_id: 'SES-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        batch_id: payload.batch_id,
        module_code: payload.module_code,
        date: payload.date,
        start_time: payload.start_time || '10:00',
        end_time: payload.end_time || '12:00',
        hours: Number(payload.hours) || 2,
        audience: payload.audience || 'ALL',
        status: payload.status || 'PLANNED',
        topics_covered_note: payload.topics_covered_note || ''
      };
      db.sessions.push(session);
      saveMockDb(db);
      return session;
    }

    case 'bulkSaveDailyTimetable': {
      const { date, entries } = payload;
      const saved = [];
      (entries || []).forEach(e => {
        if (e.is_active === false) return;
        let s = db.sessions.find(item => item.batch_id === e.batch_id && item.date === date);
        if (s) {
          s.module_code = e.module_code || 'M01';
          s.trainer_id = e.trainer_id || 'TR-101';
          s.start_time = e.start_time || '10:00';
          s.end_time = e.end_time || '12:00';
          s.hours = Number(e.hours) || 2;
          s.audience = e.audience || 'ALL';
          s.topics_covered_note = e.topics_covered_note || '';
          saved.push(s);
        } else {
          const newSess = {
            id: 'ses-' + Date.now() + Math.random().toString(36).substring(2, 5),
            session_id: 'SES-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            batch_id: e.batch_id,
            module_code: e.module_code || 'M01',
            trainer_id: e.trainer_id || 'TR-101',
            date: date,
            start_time: e.start_time || '10:00',
            end_time: e.end_time || '12:00',
            hours: Number(e.hours) || 2,
            audience: e.audience || 'ALL',
            status: 'PLANNED',
            topics_covered_note: e.topics_covered_note || ''
          };
          db.sessions.push(newSess);
          saved.push(newSess);
        }
      });
      saveMockDb(db);
      return { count: saved.length, date, items: saved };
    }

    case 'getBatchesList': {
      return db.batches;
    }

    case 'markAttendance': {
      const { session_id, rows, topics_covered_note } = payload;
      const sess = db.sessions.find(s => s.session_id === session_id || s.id === session_id);
      if (sess) {
        sess.status = 'DONE';
        if (topics_covered_note) sess.topics_covered_note = topics_covered_note;
      }

      rows.forEach(r => {
        const exist = db.attendance.find(a => (a.session_id === session_id || a.session_id === sess?.session_id) && a.student_id === r.student_id);
        if (exist) {
          exist.status = r.status;
          exist.marked_at = new Date().toISOString();
        } else {
          db.attendance.push({
            id: 'att-' + Math.random(),
            session_id: sess ? sess.session_id : session_id,
            student_id: r.student_id,
            status: r.status,
            marked_at: new Date().toISOString()
          });
        }
      });

      saveMockDb(db);
      return { marked_count: rows.length };
    }

    case 'getAttendanceSummary': {
      const studentId = payload.student_id || currentUser.student_id || 'STU-001';
      const student = db.students.find(s => s.student_id === studentId) || db.students[0];
      const isBHA = student.course_code === 'BHA';

      const doneSessions = db.sessions.filter(s => s.status === 'DONE' && (s.audience !== 'BHA_ONLY' || isBHA));
      const stuAttendance = db.attendance.filter(a => a.student_id === student.student_id);

      let totalConducted = 0;
      let totalAttended = 0;
      let allPass85 = true;

      const modMap = {};
      db.modules.filter(m => isBHA || m.course === 'HRCA').forEach(m => {
        modMap[m.code] = { module_code: m.code, title: m.title, conducted_hours: 0, attended_hours: 0, percentage: 100, shortfall_hours: 0, eligible: true };
      });

      doneSessions.forEach(sess => {
        const h = Number(sess.hours) || 2;
        totalConducted += h;
        if (modMap[sess.module_code]) modMap[sess.module_code].conducted_hours += h;

        const att = stuAttendance.find(a => a.session_id === sess.session_id);
        if (att && (att.status === 'P' || att.status === 'L' || att.status === 'EXCUSED')) {
          totalAttended += h;
          if (modMap[sess.module_code]) modMap[sess.module_code].attended_hours += h;
        }
      });

      const modulesList = Object.values(modMap).map(m => {
        if (m.conducted_hours > 0) {
          m.percentage = Number(((m.attended_hours / m.conducted_hours) * 100).toFixed(1));
          const req = Math.ceil(m.conducted_hours * 0.85);
          if (m.attended_hours < req) {
            m.shortfall_hours = req - m.attended_hours;
            m.eligible = false;
            allPass85 = false;
          }
        }
        return m;
      });

      const overallPct = totalConducted > 0 ? Number(((totalAttended / totalConducted) * 100).toFixed(1)) : 100;
      const overallReq = Math.ceil(totalConducted * 0.85);
      const overallShortfall = totalAttended < overallReq ? (overallReq - totalAttended) : 0;

      return {
        student_id: student.student_id,
        admission_no: student.admission_no,
        full_name: student.full_name,
        course_code: student.course_code,
        total_conducted_hours: totalConducted,
        total_attended_hours: totalAttended,
        overall_percentage: overallPct,
        overall_shortfall_hours: overallShortfall,
        is_eligible: overallPct >= 85 && allPass85,
        modules: modulesList
      };
    }

    case 'getAttendanceOverview': {
      const allStudents = db.students.filter(s => s.status !== 'DROPPED');
      const allBatches = db.batches;
      const allSessions = db.sessions;
      const allAtt = db.attendance;

      const batchStats = allBatches.map(b => {
        const bStudents = allStudents.filter(s => s.batch_id === b.id);
        const bSessions = allSessions.filter(s => s.batch_id === b.id && s.status === 'DONE');
        const totalPossibilities = bStudents.length * (bSessions.length || 1);
        let presentCount = 0;
        let eligibleCount = 0;

        bStudents.forEach(st => {
          const stAtt = allAtt.filter(a => a.student_id === st.student_id && (a.status === 'P' || a.status === 'L' || a.status === 'EXCUSED'));
          presentCount += stAtt.length;
          const pct = bSessions.length > 0 ? (stAtt.length / bSessions.length) * 100 : 100;
          if (pct >= 85) eligibleCount++;
        });

        const batchPct = bSessions.length > 0 ? Number(((presentCount / totalPossibilities) * 100).toFixed(1)) : 94.5;

        return {
          batch_id: b.id,
          batch_code: b.batch_code,
          name: b.name,
          status: b.status,
          total_students: bStudents.length,
          conducted_sessions: bSessions.length,
          average_attendance_pct: batchPct,
          eligible_students: eligibleCount,
          low_attendance_count: Math.max(0, bStudents.length - eligibleCount)
        };
      });

      const totalEnrolled = allStudents.length;
      const totalEligible = batchStats.reduce((sum, b) => sum + b.eligible_students, 0);

      return {
        overall_institute_pct: 92.4,
        total_enrolled: totalEnrolled,
        total_eligible: totalEligible || 2,
        eligible_percentage: totalEnrolled > 0 ? Number(((totalEligible / totalEnrolled) * 100).toFixed(1)) : 88.0,
        today_present_count: 24,
        today_absent_count: 2,
        today_late_count: 1,
        batches: batchStats
      };
    }

    case 'saveAssessment': {
      const { student_id, batch_id, module_code, type, score, absent } = payload;
      let ass = db.assessments.find(a => a.student_id === student_id && a.module_code === module_code && a.type === type);
      if (ass) {
        ass.score = absent ? 0 : Number(score);
        ass.absent = !!absent;
      } else {
        db.assessments.push({
          id: 'ass-' + Date.now(),
          student_id,
          batch_id,
          module_code,
          type,
          score: absent ? 0 : Number(score),
          max_score: 100,
          absent: !!absent
        });
      }
      saveMockDb(db);
      return { success: true };
    }

    case 'recordPayment': {
      const { student_id, installment_id, amount, payment_mode, reference_no, remarks } = payload;
      const inst = db.installments.find(i => i.id === installment_id);
      const receiptNo = 'REC-2026-' + Math.floor(10000 + Math.random() * 90000);

      if (inst) {
        inst.paid_amount = (Number(inst.paid_amount) || 0) + Number(amount);
        inst.status = inst.paid_amount >= inst.amount ? 'PAID' : 'PARTIAL';
        inst.paid_date = new Date().toISOString().substring(0, 10);
      }

      const pay = {
        id: 'pay-' + Date.now(),
        student_id,
        installment_id,
        amount: Number(amount),
        payment_mode: payment_mode || 'UPI',
        reference_no: reference_no || receiptNo,
        payment_date: new Date().toISOString(),
        receipt_no: receiptNo,
        remarks: remarks || ''
      };

      db.payments.push(pay);
      saveMockDb(db);
      return { payment: pay, receipt_no: receiptNo };
    }

    case 'getFeeAnalytics': {
      let totalCollected = db.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      let totalPending = 0;
      let totalOverdue = 0;
      let next7Days = 0;

      const now = new Date();
      const todayStr = now.toISOString().substring(0, 10);
      const in7Str = new Date(now.getTime() + 7 * 86400000).toISOString().substring(0, 10);

      db.installments.forEach(i => {
        const bal = (Number(i.amount) || 0) - (Number(i.paid_amount) || 0);
        if (bal > 0) {
          totalPending += bal;
          if (i.due_date < todayStr) totalOverdue += bal;
          else if (i.due_date <= in7Str) next7Days += bal;
        }
      });

      return {
        total_collected: totalCollected,
        total_pending: totalPending,
        total_overdue: totalOverdue,
        next_7_days_due: next7Days,
        batch_breakdown: db.batches.map(b => ({
          batch_id: b.id,
          batch_code: b.batch_code,
          name: b.name,
          collected: Math.round(totalCollected * 0.7),
          pending: Math.round(totalPending * 0.7),
          overdue: Math.round(totalOverdue * 0.7)
        }))
      };
    }

    case 'savePreferences': {
      const { student_id, location_1, location_2, location_3, role_1, role_2, role_3, professional_email } = payload;
      const student = db.students.find(s => s.student_id === student_id);
      if (student) student.professional_email = professional_email;

      let pref = db.preferences.find(p => p.student_id === student_id);
      if (pref) {
        Object.assign(pref, { location_1, location_2, location_3, role_1, role_2, role_3, professional_email_confirmed: true });
      } else {
        db.preferences.push({
          id: 'pref-' + Date.now(),
          student_id,
          location_1, location_2, location_3,
          role_1, role_2, role_3,
          professional_email_confirmed: true
        });
      }
      saveMockDb(db);
      return { success: true };
    }

    case 'scheduleInterview': {
      const interview = {
        id: 'int-' + Date.now(),
        student_id: payload.student_id,
        company: payload.company,
        position: payload.position,
        location: payload.location,
        interview_date: payload.interview_date,
        interview_time: payload.interview_time,
        status: 'SCHEDULED',
        result: 'PENDING',
        email_sent_at: new Date().toISOString()
      };
      db.interviews.push(interview);
      saveMockDb(db);
      return interview;
    }

    case 'recordOffer': {
      const offer = {
        id: 'off-' + Date.now(),
        student_id: payload.student_id,
        company: payload.company,
        position: payload.position,
        location: payload.location,
        package_lpa: Number(payload.package_lpa) || 3.5,
        offer_date: payload.offer_date || new Date().toISOString().substring(0, 10),
        joining_date: payload.joining_date,
        status: 'ACCEPTED',
        email_sent_at: new Date().toISOString()
      };
      db.offers.push(offer);
      const st = db.placementStatuses.find(p => p.student_id === payload.student_id);
      if (st) st.state = 'PLACED';
      else db.placementStatuses.push({ id: 'ps-' + Date.now(), student_id: payload.student_id, state: 'PLACED' });

      saveMockDb(db);
      return offer;
    }

    case 'getPlacementTrackerData': {
      const batchId = payload.batch_id;
      const students = db.students.filter(s => !batchId || s.batch_id === batchId);

      const items = students.map(s => {
        const pref = db.preferences.find(p => p.student_id === s.student_id);
        const ps = db.placementStatuses.find(p => p.student_id === s.student_id) || { state: 'READY', reason: '' };
        const ints = db.interviews.filter(i => i.student_id === s.student_id);
        const offs = db.offers.filter(o => o.student_id === s.student_id);
        const gr = db.grades.find(g => g.student_id === s.student_id) || { grade: 'A', overall_score: 90 };

        return {
          student_id: s.student_id,
          admission_no: s.admission_no,
          full_name: s.full_name,
          mobile: s.mobile,
          personal_email: s.personal_email,
          professional_email: s.professional_email,
          professional_email_confirmed: pref?.professional_email_confirmed || false,
          course_code: s.course_code,
          batch_id: s.batch_id,
          grade: gr.grade,
          overall_score: gr.overall_score,
          attendance_percentage: 95.0,
          is_eligible: true,
          shortfall_hours: 0,
          preferences: pref,
          placement_state: ps.state,
          placement_reason: ps.reason,
          interviews_count: ints.length,
          offers_count: offs.length,
          interviews: ints,
          offers: offs
        };
      });

      return {
        students: items,
        metrics: {
          total_candidates: items.length,
          placement_percentage: 85.5,
          conversion_percentage: 75.0,
          interviews_per_student: 1.8,
          status_breakdown: { READY: 2, INTERVIEW_SCHEDULED: 1, PLACED: 1, OFFERED: 0, NO_NEED_JOB: 0, NOT_NOW: 0, PREF_PENDING: 0 },
          company_breakdown: { 'Aster DM Healthcare': 2, 'KIMS Health': 1, 'Baby Memorial Hospital': 1 },
          location_breakdown: { Calicut: 3, Kochi: 2, Kannur: 1 },
          role_breakdown: { 'HR Executive': 2, 'Hospital Administration Executive': 1, 'Operations Executive': 1 }
        }
      };
    }

    case 'submitDutyDone': {
      const { duty_id, remark, evidence } = payload;
      const duty = db.duties.find(d => d.id === duty_id);
      if (duty) {
        duty.status = 'DONE';
        duty.done_at = new Date().toISOString();
        duty.remark = remark;
      }
      if (evidence && evidence.length) {
        evidence.forEach(e => {
          db.dutyEvidence.push({
            id: 'ev-' + Date.now(),
            duty_id,
            file_url: e.file_url,
            type: e.type || 'IMAGE',
            note: e.note || ''
          });
        });
      }
      saveMockDb(db);
      return { success: true };
    }

    case 'reviewDuty': {
      const { duty_id, rating, comment } = payload;
      const duty = db.duties.find(d => d.id === duty_id);
      if (duty) {
        duty.status = 'REVIEWED';
        duty.review_rating = rating;
        duty.review_comment = comment;
      }
      saveMockDb(db);
      return { success: true };
    }

    case 'getStaffDutiesAndKPIs': {
      return {
        duties: db.duties,
        tasks: [],
        kpis: db.kpis
      };
    }

    case 'getHRStaffReviewData': {
      const staffList = db.users.filter(u => u.role !== 'STUDENT' && u.role !== 'MAIN_ADMIN');
      return {
        staff: staffList.map(s => ({
          user_id: s.id,
          staff_id: s.staff_id || 'ST-01',
          full_name: s.full_name,
          role: s.role,
          department: s.department,
          today_duties_total: 3,
          today_duties_done: 2,
          today_completion_pct: 67,
          total_missed_duties: 0,
          kpi_score: 92.5
        })),
        total_staff: staffList.length
      };
    }

    case 'getAccessibleNotes': {
      return {
        notes: db.notes,
        assignments: db.noteAssignments
      };
    }

    case 'saveNote': {
      let existingNote = payload.id ? db.notes.find(n => n.id === payload.id) : null;
      if (existingNote) {
        existingNote.module_code = payload.module_code;
        existingNote.title = payload.title;
        existingNote.file_type = payload.file_type || 'PDF';
        existingNote.file_url = payload.file_url;
        existingNote.description = payload.description || '';
        existingNote.assigned_trainer_id = payload.assigned_trainer_id || '';
        existingNote.updated_at = new Date().toISOString();
        if (payload.batch_id) {
          const existAssign = db.noteAssignments.find(a => a.note_id === existingNote.id && a.batch_id === payload.batch_id);
          if (!existAssign) {
            db.noteAssignments.push({ id: 'na-' + Date.now(), note_id: existingNote.id, batch_id: payload.batch_id, assigned_at: new Date().toISOString() });
          }
        }
        saveMockDb(db);
        return existingNote;
      }

      const newNote = {
        id: 'not-' + Date.now(),
        module_code: payload.module_code,
        title: payload.title,
        file_type: payload.file_type || 'PDF',
        file_url: payload.file_url,
        description: payload.description || '',
        assigned_trainer_id: payload.assigned_trainer_id || 'TR-101',
        is_active: true,
        created_at: new Date().toISOString()
      };
      db.notes.push(newNote);

      if (payload.batch_id) {
        db.noteAssignments.push({
          id: 'na-' + Date.now(),
          note_id: newNote.id,
          batch_id: payload.batch_id,
          assigned_at: new Date().toISOString()
        });
      }

      saveMockDb(db);
      return newNote;
    }

    case 'deleteNote': {
      const noteId = payload.note_id || payload.id;
      db.notes = db.notes.filter(n => n.id !== noteId);
      db.noteAssignments = db.noteAssignments.filter(a => a.note_id !== noteId);
      saveMockDb(db);
      return { note_id: noteId, deleted: true };
    }

    case 'assignNoteToBatch': {
      const exist = db.noteAssignments.find(a => a.note_id === payload.note_id && a.batch_id === payload.batch_id);
      if (exist) return exist;
      const assign = {
        id: 'na-' + Date.now(),
        note_id: payload.note_id,
        batch_id: payload.batch_id,
        assigned_at: new Date().toISOString()
      };
      db.noteAssignments.push(assign);
      saveMockDb(db);
      return assign;
    }

    case 'getBatchChatMessages': {
      return {
        messages: db.chatMessages.filter(m => m.batch_id === payload.batch_id || !payload.batch_id)
      };
    }

    case 'sendBatchChatMessage': {
      const msg = {
        id: 'msg-' + Date.now(),
        batch_id: payload.batch_id,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_role: currentUser.role,
        message: payload.message,
        file_url: payload.file_url || '',
        file_name: payload.file_name || '',
        created_at: new Date().toISOString()
      };
      db.chatMessages.push(msg);
      saveMockDb(db);
      return msg;
    }

    case 'getSettings': {
      return db.settings;
    }

    case 'getUsersList': {
      return db.users;
    }

    case 'getAuditLogs': {
      return db.auditLogs;
    }

    default:
      console.warn('Unhandled mock action:', action);
      return { success: true };
  }
}
