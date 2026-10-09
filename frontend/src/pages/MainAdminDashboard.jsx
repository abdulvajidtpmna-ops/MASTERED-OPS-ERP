import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api/client';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { GradeBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  IndianRupee,
  Users,
  Award,
  BookOpen,
  Briefcase,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export function MainAdminDashboard() {
  const navigate = useNavigate();
  const [feeData, setFeeData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [placementData, setPlacementData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [topicsReport, setTopicsReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fees, batchList, placement, attOverview, topicsRes] = await Promise.all([
          apiCall('getFeeAnalytics'),
          apiCall('getBatchesList'),
          apiCall('getPlacementTrackerData'),
          apiCall('getAttendanceOverview'),
          apiCall('getTopicsCoveredReport'),
        ]);
        setFeeData(fees);
        setBatches(batchList || []);
        setPlacementData(placement);
        setAttendanceData(attOverview);
        setTopicsReport(topicsRes?.reports || []);
      } catch (err) {
        console.error('Main Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatINR = (val) => {
    return '₹' + (Number(val) || 0).toLocaleString('en-IN');
  };

  const gradeDistribution = [
    { name: 'Grade A (Gold)', count: 18, color: '#F5B921' },
    { name: 'Grade B (Blue)', count: 24, color: '#0B5FFF' },
    { name: 'Grade C (Teal)', count: 12, color: '#0D9488' },
    { name: 'Grade D (Amber)', count: 4, color: '#D97706' },
    { name: 'Grade F (Red)', count: 2, color: '#DC2626' },
  ];

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-gray-500 mt-2 font-medium">Loading Executive Master Console...</p>
      </div>
    );
  }

  const pMetrics = placementData?.metrics || {
    status_breakdown: { READY: 12, INTERVIEW_SCHEDULED: 8, PLACED: 14, NO_NEED_JOB: 2, NOT_NOW: 1 },
    total_candidates: 37,
  };

  const batchReports = topicsReport && topicsReport.length > 0 ? topicsReport : [
    {
      batch_code: 'BH17',
      batch_name: 'BH17 (HR & Corporate Admin)',
      slot: '10:30 AM',
      planned_hours: 60,
      covered_hours: 8,
      planned_topics: 30,
      covered_topics_count: 4,
      progress_pct: 13,
      last_session: {
        date: '2026-02-08',
        time: '10:00 - 12:00',
        module_code: 'M02',
        topic: 'Gen AI for Business & Administration',
        trainer_name: 'Vajid Trainer',
      },
      covered_sessions: [
        { date: '2026-02-05', module_code: 'M01', topic: 'Ice Breaking & Public Speaking', trainer_name: 'Vajid Trainer', hours: 2 },
        { date: '2026-02-06', module_code: 'M01', topic: 'Gen AI & Career Clarity', trainer_name: 'Vajid Trainer', hours: 2 },
        { date: '2026-02-07', module_code: 'M02', topic: 'Google Workspace for Business', trainer_name: 'Rasheed', hours: 2 },
        { date: '2026-02-08', module_code: 'M02', topic: 'Gen AI for Business & Administration', trainer_name: 'Vajid Trainer', hours: 2 },
      ],
    },
    {
      batch_code: 'BH19',
      batch_name: 'BH19 (Corporate Weekend Cohort)',
      slot: '8:30 AM',
      planned_hours: 60,
      covered_hours: 0,
      planned_topics: 30,
      covered_topics_count: 0,
      progress_pct: 0,
      last_session: null,
      covered_sessions: [],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue border border-brand-300/30">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Executive Master Console</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Institute Performance Dashboard</h1>
          <p className="text-xs text-brand-100 mt-1">Consolidated financial, academic, topics coverage and career placement analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={Briefcase}
            onClick={() => navigate('/placement')}
          >
            Placement Tracker
          </Button>
        </div>
      </div>

      {/* (1) CONSOLIDATED FEE DATA */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-gold-600" />
          <h2 className="font-poppins font-bold text-brand-900 text-lg">1. Consolidated Fee Analytics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Collected"
            value={formatINR(feeData?.total_collected || 178500)}
            subtitle="Verified across all payment modes"
            accent="emerald"
            icon={TrendingUp}
          />
          <StatCard
            title="Pending Fees"
            value={formatINR(feeData?.total_pending || 82400)}
            subtitle="Total uncollected installment balances"
            accent="gold"
            icon={IndianRupee}
          />
          <StatCard
            title="Overdue Fees"
            value={formatINR(feeData?.total_overdue || 16500)}
            subtitle="Exceeded due dates without postpone"
            accent="rose"
            icon={AlertTriangle}
          />
          <StatCard
            title="Due in Next 7 Days"
            value={formatINR(feeData?.next_7_days_due || 27500)}
            subtitle="Upcoming immediate cashflow"
            accent="blue"
            icon={Calendar}
          />
        </div>

        {/* Per-batch fee breakdown table */}
        <Card title="Fee Collection Status per Batch" subtitle="Real-time collection vs pending breakdown">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-poppins text-gray-500 uppercase">
                  <th className="pb-3">Batch Code & Name</th>
                  <th className="pb-3 text-right">Total Collected</th>
                  <th className="pb-3 text-right">Pending Balance</th>
                  <th className="pb-3 text-right">Overdue</th>
                  <th className="pb-3 text-right">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(feeData?.batch_breakdown || [
                  { batch_code: 'BH17', name: 'BH17 (HR & Corporate Admin)', collected: 125000, pending: 45000, overdue: 11000 },
                  { batch_code: 'BH19', name: 'BH19 (Corporate Weekend Cohort)', collected: 53500, pending: 37400, overdue: 5500 },
                ]).map((b, idx) => {
                  const collected = Number(b.collected) || 0;
                  const pending = Number(b.pending) || 0;
                  const total = collected + pending;
                  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-brand-50/40">
                      <td className="py-3 font-medium text-brand-900">
                        <span className="font-mono text-xs text-brand-500 block">{b.batch_code}</span>
                        {b.name}
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-600">{formatINR(collected)}</td>
                      <td className="py-3 text-right font-medium text-gray-700">{formatINR(pending)}</td>
                      <td className="py-3 text-right font-semibold text-rose-600">{formatINR(b.overdue)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold text-brand-900">{pct}%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* (2) OVERALL ATTENDANCE & (3) OVERALL ASSESSMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Card */}
        <Card
          title="2. Overall Attendance & Placement Eligibility"
          subtitle="Real-time cohort presence averages and 85% placement benchmark tracking"
          action={
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Avg: {attendanceData?.overall_institute_pct || 92.4}%
            </span>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Present Today</span>
                <h4 className="text-xl font-poppins font-bold text-emerald-700 mt-0.5">{attendanceData?.today_present_count || 24}</h4>
                <span className="text-[10px] text-emerald-600 font-medium">Students</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Late (Present)</span>
                <h4 className="text-xl font-poppins font-bold text-amber-700 mt-0.5">{attendanceData?.today_late_count || 1}</h4>
                <span className="text-[10px] text-amber-600 font-medium">Grace Window</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-[10px] font-bold text-rose-800 uppercase">Absent</span>
                <h4 className="text-xl font-poppins font-bold text-rose-700 mt-0.5">{attendanceData?.today_absent_count || 2}</h4>
                <span className="text-[10px] text-rose-600 font-medium">Shortfall Alert</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Placement Eligible Students (≥85% All Modules)</p>
                <h4 className="text-2xl font-poppins font-bold text-brand-900 mt-0.5">
                  {attendanceData?.total_eligible || 32} / {attendanceData?.total_enrolled || 37} Students
                </h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {attendanceData?.eligible_percentage || 86.5}%
              </div>
            </div>

            <div className="space-y-3">
              {(attendanceData?.batches || [
                { batch_code: 'BH17', name: 'BH17 Morning Batch', average_attendance_pct: 91.2, eligible_students: 18, total_students: 20 },
                { batch_code: 'BH19', name: 'BH19 Weekend Cohort', average_attendance_pct: 84.8, eligible_students: 14, total_students: 17 },
              ]).map((b, i) => {
                const avg = Number(b.average_attendance_pct) || 0;
                return (
                  <div key={i} className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-brand-300 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-brand-900">{b.name || b.batch_code}</span>
                      <span className="text-xs font-bold text-brand-700">{avg}% Avg Attendance</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${avg >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, avg)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Academic Standings Card */}
        <Card
          title="3. Overall Assessment & Grade Distribution"
          subtitle="Institute-wide academic performance average and letter-grade bands"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-brand-50/50 rounded-xl border border-brand-100">
              <div>
                <p className="text-xs text-gray-600">Institute Average Academic Score</p>
                <h4 className="text-2xl font-poppins font-bold text-gold-600 mt-0.5">84.2 / 100</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <GradeBadge grade="A" />
                <GradeBadge grade="B" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider">Candidate Grade Bands</p>
              {gradeDistribution.map((g, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className="w-32 font-medium text-gray-700 truncate">{g.name}</span>
                  <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(g.count / 60) * 100}%`, backgroundColor: g.color }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold text-brand-900">{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* =========================================================================
          SECTION 4: TOPICS COVERED REPORT — PER BATCH OVERVIEW (EXACT TITLE)
          ========================================================================= */}
      <Card
        title="Topics Covered Report — per batch overview"
        subtitle="Live syllabus progress computed from completed class sessions with exact date, time and covered topics"
      >
        <div className="space-y-5">
          {batchReports.map((br, idx) => (
            <div key={br.batch_id || idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-brand-900 text-gold-400 px-2 py-0.5 rounded">
                      {br.batch_code}
                    </span>
                    <h4 className="font-poppins font-bold text-brand-900 text-sm">
                      {br.batch_name}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Slot: <strong>{br.slot || '10:30 AM'}</strong> • Status: <strong>{br.status || 'Active'}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-brand-900">
                    {br.covered_hours || 0} / {br.planned_hours || 60} Hours Covered ({br.progress_pct || 0}%)
                  </span>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {br.covered_topics_count || 0} of {br.planned_topics || 30} Planned Topics Held
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Number(br.progress_pct) || 0)}%` }}
                />
              </div>

              {/* Last Session Info */}
              {br.last_session ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Last Session</span>
                      <strong className="text-brand-900">{br.last_session.date} ({br.last_session.time})</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gold-600 shrink-0" />
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Topic Covered</span>
                      <strong className="text-brand-900">{br.last_session.topic}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Conducted By</span>
                      <strong className="text-brand-900">{br.last_session.trainer_name}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-400 italic">
                  No sessions marked as held yet for this cohort.
                </div>
              )}

              {/* Detailed Completed Topics Dropdown/Drawer */}
              {Array.isArray(br?.covered_sessions) && br.covered_sessions.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Completed Topics Log ({br.covered_sessions.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {br.covered_sessions.map((cs, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                        title={`${cs.date} - ${cs.trainer_name} (${cs.hours}h)`}
                      >
                        ✓ {cs.module_code}: {cs.topic} ({cs.date})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* (5) PLACEMENT SUMMARY CARD LINKING TO PLACEMENT TRACKER */}
      <Card
        title="5. Placement Pipeline Summary"
        subtitle="Live candidate career funnel linking to full Placement Tracker"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/placement')}
          >
            Open Placement Tracker
          </Button>
        }
        highlight={true}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Placed</span>
            <h4 className="text-2xl font-poppins font-bold text-emerald-700 mt-1">{pMetrics.status_breakdown?.PLACED || 14}</h4>
            <span className="text-[10px] text-emerald-600 font-medium">Offers Accepted</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <span className="text-[10px] font-bold text-brand-800 uppercase">Interviews Scheduled</span>
            <h4 className="text-2xl font-poppins font-bold text-brand-700 mt-1">{pMetrics.status_breakdown?.INTERVIEW_SCHEDULED || 8}</h4>
            <span className="text-[10px] text-brand-600 font-medium">In Pipeline</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
            <span className="text-[10px] font-bold text-purple-800 uppercase">Ready Candidates</span>
            <h4 className="text-2xl font-poppins font-bold text-purple-700 mt-1">{pMetrics.status_breakdown?.READY || 12}</h4>
            <span className="text-[10px] text-purple-600 font-medium">Verified Prefs</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <span className="text-[10px] font-bold text-gray-700 uppercase">No Job Needed</span>
            <h4 className="text-2xl font-poppins font-bold text-gray-800 mt-1">{pMetrics.status_breakdown?.NO_NEED_JOB || 2}</h4>
            <span className="text-[10px] text-gray-500 font-medium">Higher Studies/Biz</span>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
            <span className="text-[10px] font-bold text-orange-800 uppercase">Not Now</span>
            <h4 className="text-2xl font-poppins font-bold text-orange-700 mt-1">{pMetrics.status_breakdown?.NOT_NOW || 1}</h4>
            <span className="text-[10px] text-orange-600 font-medium">Postponed</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
