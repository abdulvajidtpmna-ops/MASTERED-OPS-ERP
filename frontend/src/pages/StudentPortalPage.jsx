import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
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
} from 'lucide-react';

export function StudentPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW | MODULES | NOTES | FEES | CHAT
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        const [attRes, notesRes, chatRes] = await Promise.all([
          apiCall('getAttendanceSummary', { student_id: user?.student_id || 'STU-001' }),
          apiCall('getAccessibleNotes', { batch_id: 'batch-1' }),
          apiCall('getBatchChatMessages', { batch_id: 'batch-1' }),
        ]);
        setSummary(attRes);
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
        batch_id: 'batch-1',
        message: newMessage,
      });
      setChatMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  const attPct = summary?.overall_percentage ?? 95.0;
  const isEligible = summary?.is_eligible ?? true;
  const shortfall = summary?.overall_shortfall_hours ?? 0;

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Candidate Learning Center</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Welcome, {user?.full_name || 'Student'}</h1>
          <p className="text-xs text-brand-100 mt-1">Admission No: <strong>{user?.username || 'ON-2026-0001'}</strong> • Course: <strong>HR & Corporate Admin</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <GradeBadge grade="A" />
          <span className="px-3 py-1 bg-gold-shine text-brand-900 font-bold text-xs rounded-xl shadow-gold-glow">
            Active Enrolled
          </span>
        </div>
      </div>

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
          Study Materials
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

            <Card title="Upcoming Timetable Sessions" subtitle="Check schedule for the week ahead">
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-brand-900">M02: Google Workspace for Business</strong>
                    <p className="text-gray-500">Feb 12, 2026 • 10:00 AM - 12:00 PM • Trainer: Zahadh / Rasheed</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-brand-700 font-semibold rounded border border-brand-200">
                    Virtual Classroom
                  </span>
                </div>
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

      {/* 3. STUDY MATERIALS */}
      {activeTab === 'NOTES' && (
        <Card title="Study Materials & Notes" subtitle="Course notes assigned by your trainers">
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-brand-700 shrink-0" />
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-500">{n.module_code}</span>
                    <h5 className="font-semibold text-xs text-brand-900">{n.title}</h5>
                    <p className="text-[10px] text-gray-500">Format: {n.file_type || 'PDF'}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={() => window.open(n.file_url, '_blank')}
                >
                  Download Note
                </Button>
              </div>
            ))}
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
    </div>
  );
}
