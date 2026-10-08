import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { GradeBadge, StatusBadge } from '../components/common/Badge';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  IndianRupee,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  Bell,
  Sparkles,
  ExternalLink,
  Eye,
  Building,
  UserCheck,
  BookOpen,
} from 'lucide-react';

export function StudentPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW | MODULES | NOTES | FEES | CHAT
  const [summary, setSummary] = useState(null);
  const [tomorrowClass, setTomorrowClass] = useState(null);
  const [notes, setNotes] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // In-App Document Viewer State (Section 6)
  const [viewingNote, setViewingNote] = useState(null);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);

  const toast = useToast();

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        const [attRes, tomorrowRes, notesRes, chatRes] = await Promise.all([
          apiCall('getAttendanceSummary', { student_id: user?.student_id || 'STU-001' }),
          apiCall('getStudentTomorrowClass', { student_id: user?.student_id || 'STU-001' }),
          apiCall('getAccessibleNotes', { batch_id: user?.batch_id || 'batch-1' }),
          apiCall('getBatchChatMessages', { batch_id: user?.batch_id || 'batch-1' }),
        ]);
        setSummary(attRes);
        setTomorrowClass(tomorrowRes);
        setNotes(notesRes?.notes || []);
        setChatMessages(chatRes?.messages || []);
      } catch (err) {
        console.error('Student portal load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const msg = await apiCall('sendBatchChatMessage', {
        batch_id: user?.batch_id || 'batch-1',
        message: newMessage,
      });
      setChatMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  const handleOpenNoteViewer = (note) => {
    setViewingNote(note);
    setViewerModalOpen(true);
  };

  const attPct = summary?.overall_percentage ?? 95.0;
  const isEligible = summary?.is_eligible ?? true;
  const shortfall = summary?.overall_shortfall_hours ?? 0;

  // Build Drive/Doc Embedded Preview Link
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    if (url.includes('docs.google.com')) {
      return url.replace('/edit', '/preview');
    }
    return url;
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Candidate Learning Center</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Welcome, {user?.full_name || 'Student'}</h1>
          <p className="text-xs text-brand-100 mt-1">Admission No: <strong>{user?.username || 'OMA1034'}</strong> • Course: <strong>HR & Corporate Admin</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <GradeBadge grade="A" />
          <span className="px-3 py-1 bg-gold-shine text-brand-900 font-bold text-xs rounded-xl shadow-gold-glow">
            Active Enrolled
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: TOMORROW'S CLASS CARD (STUDENT VIEW)
          ========================================================================= */}
      {tomorrowClass?.is_published ? (
        <div className="p-5 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white rounded-2xl border-2 border-gold-400/40 shadow-soft-blue flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-gold-400 text-brand-900 font-black text-xs uppercase tracking-wider rounded-lg">
                ⚡ Tomorrow's Class Session
              </span>
              <span className="text-xs text-brand-200">
                {tomorrowClass.date} • Slot: <strong>{tomorrowClass.slot}</strong> ({tomorrowClass.hours || 2} hrs)
              </span>
            </div>
            <h3 className="font-poppins font-bold text-lg text-white mt-1">
              {tomorrowClass.module_code}: {tomorrowClass.module_title}
            </h3>
            <p className="text-xs text-brand-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold-400 shrink-0" />
              <span>Topic: <strong>{tomorrowClass.topic}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-brand-700/60">
            <div className="p-2.5 bg-brand-800/80 rounded-xl border border-brand-600/60 text-xs">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Assigned Faculty</span>
              <strong className="text-gold-300 font-semibold">{tomorrowClass.trainer_name}</strong>
            </div>
            <div className="p-2.5 bg-brand-800/80 rounded-xl border border-brand-600/60 text-xs">
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">Classroom</span>
              <strong className="text-white font-semibold">🏛️ {tomorrowClass.classroom}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <strong className="text-brand-900 block">Tomorrow's Class Schedule:</strong>
              <span>Not published yet for your batch cohort. Please check back later this evening.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'OVERVIEW' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-gold-400" />
          Overview & Attendance
        </button>
        <button
          onClick={() => setActiveTab('MODULES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'MODULES' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4 text-gold-400" />
          Module Marks & Progress
        </button>
        <button
          onClick={() => setActiveTab('NOTES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'NOTES' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4 text-gold-400" />
          Study Materials ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('FEES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'FEES' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <IndianRupee className="w-4 h-4 text-gold-400" />
          Fee Status (Read-Only)
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'CHAT' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-gold-400" />
          Batch Group Chat
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Gauge Card */}
          <Card title="Attendance & Eligibility Gauge" subtitle="Minimum 85% required across all modules">
            <div className="text-center py-4 space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="58" stroke="#E2E8F0" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke={attPct >= 85 ? '#10B981' : '#F59E0B'}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="364"
                    strokeDashoffset={364 - (364 * attPct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-poppins font-black text-brand-900">{attPct}%</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Overall</span>
                </div>
              </div>

              {/* Eligibility Badge */}
              <div>
                {isEligible ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Placement Eligible (≥85% All Modules)</span>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Shortfall Alert: Attend {shortfall} more hours to be eligible</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Academic Standing */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Academic Summary & Grade Bands" subtitle="Current calculated letter grade">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-gold-50 rounded-xl border border-gold-200">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Overall Score</span>
                  <h4 className="text-2xl font-poppins font-bold text-gold-600 mt-1">90.5 / 100</h4>
                </div>
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-200">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Letter Grade</span>
                  <h4 className="text-2xl font-poppins font-bold text-brand-700 mt-1">Grade A</h4>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Conducted Hours</span>
                  <h4 className="text-2xl font-poppins font-bold text-purple-700 mt-1">10.0 Hrs</h4>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Attended Hours</span>
                  <h4 className="text-2xl font-poppins font-bold text-emerald-700 mt-1">10.0 Hrs</h4>
                </div>
              </div>
            </Card>

            <Card title="Current Cohort Batch" subtitle="Enrolled batch timing & classroom">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-brand-900 font-bold">BH17 (HR & Corporate Administration)</strong>
                  <p className="text-gray-500">Standard Slot: 10:30 AM • Lead Faculty: Vajid Trainer</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-brand-700 font-semibold rounded border border-brand-200">
                  Active Cohort
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. MODULES BREAKDOWN */}
      {activeTab === 'MODULES' && (
        <Card title="Curriculum Module Performance & Attendance" subtitle="Detailed module-by-module breakdown">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins">
                  <th className="pb-3">Module Code & Title</th>
                  <th className="pb-3 text-right">Conducted / Attended</th>
                  <th className="pb-3 text-right">Attendance %</th>
                  <th className="pb-3 text-right">Assessment Score</th>
                  <th className="pb-3 text-center">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(summary?.modules || [
                  { module_code: 'M01', title: 'Future Career Foundation', conducted_hours: 6, attended_hours: 6, percentage: 100, eligible: true },
                  { module_code: 'M02', title: 'Business Technology Skills', conducted_hours: 4, attended_hours: 4, percentage: 100, eligible: true },
                  { module_code: 'M03', title: 'Corporate Administration & Management', conducted_hours: 0, attended_hours: 0, percentage: 100, eligible: true },
                  { module_code: 'M04', title: 'Modern HR Management with AI', conducted_hours: 0, attended_hours: 0, percentage: 100, eligible: true },
                ]).map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-brand-900">
                      <span className="font-mono text-[10px] text-brand-500 block">{m.module_code}</span>
                      {m.title}
                    </td>
                    <td className="py-3 text-right text-gray-600 font-mono">
                      {m.conducted_hours}h / {m.attended_hours}h
                    </td>
                    <td className="py-3 text-right font-bold text-brand-900">{m.percentage}%</td>
                    <td className="py-3 text-right font-semibold text-gold-600">92 / 100</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">
                        Eligible
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =========================================================================
          SECTION 6: STUDY MATERIALS & IN-APP DOCUMENT VIEWER
          ========================================================================= */}
      {activeTab === 'NOTES' && (
        <Card
          title="Study Materials & Module Notes"
          subtitle="Open documents inside the app viewer or download directly to your device"
        >
          <div className="space-y-4">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-4 sm:p-5 rounded-2xl border-2 border-gray-200/80 bg-white hover:border-brand-400 hover:shadow-md transition-all flex flex-col justify-between gap-4 overflow-hidden"
              >
                {/* Header: Module Tag + Format + Title */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 bg-brand-50 text-brand-700 rounded-2xl border border-brand-200/80 shrink-0">
                    <FileText className="w-6 h-6 text-brand-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                        {n.module_code}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200 uppercase">
                        {n.file_type || 'PDF'}
                      </span>
                    </div>
                    <h4 className="font-poppins font-bold text-sm sm:text-base text-brand-900 leading-snug break-words">
                      {n.title}
                    </h4>
                    {n.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {n.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Full-Width Action Buttons: Grid layout guarantees zero overflow on any device */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-gray-100 w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleOpenNoteViewer(n)}
                    className="w-full justify-center text-xs py-2"
                  >
                    Open Inside App
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={() => window.open(n.file_url, '_blank')}
                    className="w-full justify-center text-xs py-2 shadow-gold-glow"
                  >
                    Download File
                  </Button>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="py-12 text-center text-gray-400 italic">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p>No study materials assigned to your cohort yet.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 4. FEE STATUS (READ-ONLY) */}
      {activeTab === 'FEES' && (
        <Card title="Fee Schedule & Ledger" subtitle="Read-only fee records and official payment vouchers">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Agreed Course Fee</span>
                <h4 className="text-xl font-bold text-brand-900 mt-1">₹25,000</h4>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Total Paid</span>
                <h4 className="text-xl font-bold text-emerald-800 mt-1">₹8,462</h4>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-700 font-bold uppercase">Upcoming Due</span>
                <h4 className="text-xl font-bold text-amber-800 mt-1">₹16,538</h4>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins">
                    <th className="pb-3">Installment</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Paid</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-brand-900">Registration Fee</td>
                    <td className="py-3 text-gray-600">2026-02-01</td>
                    <td className="py-3 text-right font-bold">₹500</td>
                    <td className="py-3 text-right text-emerald-600 font-bold">₹500</td>
                    <td className="py-3 text-right"><StatusBadge status="PAID" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-brand-900">Balance Registration Fee</td>
                    <td className="py-3 text-gray-600">2026-02-05</td>
                    <td className="py-3 text-right font-bold">₹2,450</td>
                    <td className="py-3 text-right text-emerald-600 font-bold">₹2,450</td>
                    <td className="py-3 text-right"><StatusBadge status="PAID" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-brand-900">1st Course Installment</td>
                    <td className="py-3 text-gray-600">2026-02-12</td>
                    <td className="py-3 text-right font-bold">₹5,512</td>
                    <td className="py-3 text-right text-emerald-600 font-bold">₹5,512</td>
                    <td className="py-3 text-right"><StatusBadge status="PAID" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-brand-900">2nd Course Installment</td>
                    <td className="py-3 text-gray-600">2026-03-14</td>
                    <td className="py-3 text-right font-bold">₹5,512</td>
                    <td className="py-3 text-right text-gray-400">₹0</td>
                    <td className="py-3 text-right"><StatusBadge status="UNPAID" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* 5. BATCH CHAT */}
      {activeTab === 'CHAT' && (
        <Card title="Batch Discussion Room" subtitle="Communicate with your trainers and classmates">
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl max-w-md ${
                    m.sender_role === 'STUDENT'
                      ? 'bg-blue-shine text-white ml-auto'
                      : 'bg-white border border-gray-200 text-brand-900 mr-auto'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                    <strong>{m.sender_name}</strong>
                    <span>{new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Ask a question or post a query to your batch..."
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

      {/* =========================================================================
          IN-APP DOCUMENT VIEWER MODAL (SECTION 6)
          ========================================================================= */}
      <Modal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        title={viewingNote?.title || 'Study Material Viewer'}
        subtitle={`Module: ${viewingNote?.module_code} • Format: ${viewingNote?.file_type || 'PDF'}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-600 font-medium truncate max-w-md">
              {viewingNote?.file_url}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ExternalLink}
                onClick={() => window.open(viewingNote?.file_url, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => window.open(viewingNote?.file_url, '_blank')}
              >
                Download File
              </Button>
            </div>
          </div>

          {/* Embedded Viewer iFrame */}
          <div className="w-full h-[520px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-300 relative shadow-inner">
            <iframe
              src={getEmbedUrl(viewingNote?.file_url)}
              title="In-App Document Viewer"
              className="w-full h-full border-none"
              allow="autoplay"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
