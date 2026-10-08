import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge, GradeBadge } from '../components/common/Badge';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Award,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';

export function TrainerConsolePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ATTENDANCE'); // ATTENDANCE | ASSESSMENTS | NOTES | CHAT
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState({});
  const [topicsCoveredNote, setTopicsCoveredNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Assessment State
  const [assessmentScores, setAssessmentScores] = useState({});
  const [selectedModule, setSelectedModule] = useState('M01');
  const [assessmentType, setAssessmentType] = useState('TEST');

  const toast = useToast();

  const loadTrainerData = async () => {
    try {
      setLoading(true);
      const [batchList, admList, chat] = await Promise.all([
        apiCall('getBatchesList'),
        apiCall('getAdmissions'),
        apiCall('getBatchChatMessages', { batch_id: selectedBatchId }),
      ]);
      setBatches(batchList || []);
      const bId = selectedBatchId || (batchList && batchList.length ? batchList[0].id : '');
      setSelectedBatchId(bId);

      const enrolled = (admList?.items || []).filter(s => !bId || s.batch_id === bId);
      setStudents(enrolled);

      // Default attendance to 'P'
      const initAtt = {};
      const initScores = {};
      enrolled.forEach(s => {
        initAtt[s.student_id] = 'P';
        initScores[s.student_id] = 85;
      });
      setAttendanceRows(initAtt);
      setAssessmentScores(initScores);
      setChatMessages(chat?.messages || []);
    } catch (err) {
      toast.error('Failed to load trainer console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainerData();
  }, [selectedBatchId]);

  const handleSelectAllPresent = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.student_id] = 'P';
    });
    setAttendanceRows(updated);
    toast.info('All students marked as Present (P).');
  };

  const handleSaveAttendance = async () => {
    setSubmitting(true);
    try {
      const rows = Object.entries(attendanceRows).map(([sId, status]) => ({
        student_id: sId,
        status,
      }));

      await apiCall('markAttendance', {
        session_id: 'SES-001',
        rows,
        topics_covered_note: topicsCoveredNote || 'Live classroom practicals conducted.',
      });

      toast.success('Session attendance verified and saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMarks = async () => {
    setSubmitting(true);
    try {
      for (const [studentId, score] of Object.entries(assessmentScores)) {
        await apiCall('saveAssessment', {
          student_id: studentId,
          batch_id: selectedBatchId,
          module_code: selectedModule,
          type: assessmentType,
          score: Number(score),
        });
      }
      toast.success(`Assessment marks for ${selectedModule} (${assessmentType}) recorded and grades re-calculated!`);
    } catch (err) {
      toast.error(err.message || 'Failed to save marks.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const msg = await apiCall('sendBatchChatMessage', {
        batch_id: selectedBatchId,
        message: newMessage,
      });
      setChatMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Faculty Academic Portal</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Trainer Classroom Console</h1>
          <p className="text-xs text-brand-100 mt-1">Daily session attendance grid, multi-component assessments, notes assignment, and batch discussion</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="p-2 text-xs bg-brand-900/80 border border-brand-300/40 rounded-xl text-gold-300 font-bold"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.batch_code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ATTENDANCE'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-gold-400" />
          Attendance Entry
        </button>
        <button
          onClick={() => setActiveTab('ASSESSMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ASSESSMENTS'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4 text-gold-400" />
          Assessment Scoring
        </button>
        <button
          onClick={() => setActiveTab('NOTES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'NOTES'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4 text-gold-400" />
          Notes Assignment
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'CHAT'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-gold-400" />
          Batch Community Chat
        </button>
      </div>

      {/* 1. ATTENDANCE ENTRY GRID */}
      {activeTab === 'ATTENDANCE' && (
        <Card
          title="Today's Session Attendance Grid"
          subtitle="Mark Present (P), Absent (A), or Late (L - counts as present)"
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSelectAllPresent}>
                ✓ Select All Present
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleSaveAttendance}>
                Submit Attendance
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong className="text-brand-900">Module M01: Ice Breaking & Public Speaking</strong>
                <p className="text-gray-500">Session ID: SES-001 • Duration: 2.0 Hours</p>
              </div>
              <span className="font-semibold text-brand-700 bg-white px-2.5 py-1 rounded border border-brand-200">
                Editing Window: Active (Day 1 of 7)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3 text-center">Attendance Toggle</th>
                    <th className="pb-3 text-right">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => {
                    const status = attendanceRows[s.student_id] || 'P';
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 font-semibold text-brand-900">
                          <span className="font-mono text-[10px] text-gray-400 block">{s.admission_no}</span>
                          {s.full_name}
                        </td>
                        <td className="py-3 text-gray-600 font-medium">{s.course_code}</td>
                        <td className="py-3 text-center">
                          <div className="inline-flex rounded-xl bg-gray-100 p-1">
                            <button
                              type="button"
                              onClick={() => setAttendanceRows({ ...attendanceRows, [s.student_id]: 'P' })}
                              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                                status === 'P' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600'
                              }`}
                            >
                              Present (P)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceRows({ ...attendanceRows, [s.student_id]: 'L' })}
                              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                                status === 'L' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'
                              }`}
                            >
                              Late (L)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceRows({ ...attendanceRows, [s.student_id]: 'A' })}
                              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                                status === 'A' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600'
                              }`}
                            >
                              Absent (A)
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs ${
                              status === 'P' ? 'text-emerald-700 bg-emerald-50' : status === 'L' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {status === 'P' ? 'Present' : status === 'L' ? 'Late (Present)' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Topics Covered / Classroom Note
              </label>
              <input
                type="text"
                placeholder="e.g. Conducted 3-minute self introduction presentations with live feedback..."
                value={topicsCoveredNote}
                onChange={(e) => setTopicsCoveredNote(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>
          </div>
        </Card>
      )}

      {/* 2. ASSESSMENTS ENTRY GRID */}
      {activeTab === 'ASSESSMENTS' && (
        <Card
          title="Module Assessment Score Capture"
          subtitle="Weighted: Test (50%), Presentation (25%), Mock Interview (25%)"
          action={
            <Button variant="primary" size="sm" loading={submitting} onClick={handleSaveMarks}>
              Save Marks & Re-calculate Grades
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Select Module</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
                >
                  <option value="M01">M01 - Future Career Foundation</option>
                  <option value="M02">M02 - Business Technology Skills</option>
                  <option value="M03">M03 - Corporate Administration</option>
                  <option value="M04">M04 - Modern HR Management with AI</option>
                  <option value="M05">M05 - Sales & CRM</option>
                  <option value="M06">M06 - Professional English</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Assessment Component</label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
                >
                  <option value="TEST">Written Test (Max 100)</option>
                  <option value="PRESENTATION">Digital Presentation (Max 100)</option>
                  <option value="MOCK_INTERVIEW">Mock Interview (Max 100)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3 text-right">Score (/ 100)</th>
                    <th className="pb-3 text-center">Absent Flag</th>
                    <th className="pb-3 text-right">Letter Grade Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => {
                    const score = assessmentScores[s.student_id] ?? 85;
                    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';
                    return (
                      <tr key={s.id}>
                        <td className="py-3 font-semibold text-brand-900">
                          {s.full_name} ({s.admission_no})
                        </td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setAssessmentScores({ ...assessmentScores, [s.student_id]: e.target.value })}
                            className="w-20 p-1.5 text-right font-bold text-xs bg-white border border-gray-200 rounded-lg text-brand-900"
                          />
                        </td>
                        <td className="py-3 text-center">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssessmentScores({ ...assessmentScores, [s.student_id]: 0 });
                              }
                            }}
                            className="rounded text-brand-500"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <GradeBadge grade={grade} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* 3. NOTES ASSIGNMENT */}
      {activeTab === 'NOTES' && (
        <Card title="Assign Study Materials to Active Cohort" subtitle="Students see only assigned/completed module notes">
          <div className="space-y-3">
            {[
              { id: 'not-1', code: 'M01', title: 'Future Career Foundation Comprehensive Guidebook', file: 'PDF (3.4 MB)', assigned: true },
              { id: 'not-2', code: 'M02', title: 'Gen AI Business Workflows & Prompt Engineering Cheatsheet', file: 'PDF (5.1 MB)', assigned: true },
              { id: 'not-3', code: 'M03', title: 'Corporate SOPs & CXO Secretary Handbook', file: 'PDF (4.8 MB)', assigned: false },
            ].map((n) => (
              <div key={n.id} className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-brand-700 shrink-0" />
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-500">{n.code}</span>
                    <h5 className="font-semibold text-xs text-brand-900">{n.title}</h5>
                    <p className="text-[11px] text-gray-500">{n.file}</p>
                  </div>
                </div>
                <Button
                  variant={n.assigned ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => {
                    apiCall('assignNoteToBatch', { note_id: n.id, batch_id: selectedBatchId });
                    toast.success('Note assigned to batch successfully!');
                  }}
                >
                  {n.assigned ? '✓ Assigned' : 'Assign to Batch'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. BATCH COMMUNITY CHAT */}
      {activeTab === 'CHAT' && (
        <Card title="Batch Discussion Room" subtitle="Real-time interactive group chat with batch students">
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl max-w-md ${
                    m.sender_role === 'TRAINER'
                      ? 'bg-blue-shine text-white ml-auto'
                      : 'bg-white border border-gray-200 text-brand-900 mr-auto'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                    <strong>{m.sender_name} ({m.sender_role})</strong>
                    <span>{new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Type instructions or announcement for batch students..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button type="submit" variant="primary" size="md" icon={Send}>
                Send
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
