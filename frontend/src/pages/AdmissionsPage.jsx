import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import {
  UserPlus,
  Sparkles,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  FileCheck,
  Calendar,
  Save,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export function AdmissionsPage() {
  const { user } = useAuth();
  const isExecutive = ['MAIN_ADMIN', 'HR', 'DEPT_HEAD', 'OFFICE_ADMIN', 'OPS_ADMIN'].includes(user?.role);

  const [activeTab, setActiveTab] = useState('NEW_ADMISSION'); // NEW_ADMISSION | DAILY_COUNTS | MY_INCENTIVES
  const [selectedStaffId, setSelectedStaffId] = useState(user?.staff_id || user?.id || 'ST-01');
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().substring(0, 7)); // e.g. "2026-02"

  // 1. Admission Form State
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    personal_email: '',
    course_code: 'HRCA',
    mode: 'ONLINE',
    total_fee: 25000,
  });

  // 2. Daily Lead Counts Form State (Section 7)
  const [dailyCountsDate, setDailyCountsDate] = useState(new Date().toISOString().substring(0, 10));
  const [dailyCountsForm, setDailyCountsForm] = useState({
    leads: 0,
    qualified: 0,
    interested: 0,
    bucket_new: 0,
    bucket_lost: 0,
  });
  const [dailyCountsReport, setDailyCountsReport] = useState({
    staff_id: '',
    staff_list: [],
    summary: {
      total_leads: 0,
      total_qualified: 0,
      total_interested: 0,
      total_bucket_new: 0,
      total_bucket_lost: 0,
      current_bucket_balance: 0,
    },
    entries: [],
  });

  // 3. Incentives & My Students State (Section 8)
  const [incentiveData, setIncentiveData] = useState({
    staff_id: '',
    month: '',
    summary: {
      collections_total: 0,
      incentive_rate_pct: 10,
      gross_incentive: 0,
      dropped_without_came_count: 0,
      drop_penalty_per_student: 250,
      total_deductions: 0,
      net_incentive: 0,
    },
    payments: [],
    students: [],
  });
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL'); // ALL | Active | Completed | Dropped After Came | Dropped Without Came

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [resAdmissions, resCounts, resIncentives] = await Promise.all([
        apiCall('getAdmissions'),
        apiCall('getSalesDailyCounts', { staff_id: selectedStaffId }),
        apiCall('getMyIncentives', { staff_id: selectedStaffId, month: targetMonth }),
      ]);

      setAdmissions(resAdmissions?.items || []);
      setDailyCountsReport(resCounts || { summary: {}, entries: [] });
      setIncentiveData(resIncentives || { summary: {}, payments: [], students: [] });

      // Match today's counts if already logged
      const todayEntry = resCounts?.entries?.find((e) => e.date === dailyCountsDate);
      if (todayEntry) {
        setDailyCountsForm({
          leads: todayEntry.leads || 0,
          qualified: todayEntry.qualified || 0,
          interested: todayEntry.interested || 0,
          bucket_new: todayEntry.bucket_new || 0,
          bucket_lost: todayEntry.bucket_lost || 0,
        });
      }
    } catch (err) {
      console.error('Admissions page load error:', err);
      toast.error('Failed to load sales and admissions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStaffId, targetMonth]);

  const handleCourseChange = (course) => {
    setFormData((prev) => ({
      ...prev,
      course_code: course,
      total_fee: course === 'BHA' ? 35000 : 25000,
    }));
  };

  // 1. Create Admission Submit (MA for offline, OMA for online)
  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || formData.mobile.replace(/\D/g, '').length !== 10) {
      toast.error('Please enter student full name and a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiCall('createAdmission', formData);
      toast.success(`Admission registered successfully! ID: ${created.admission_no}`);
      setShowModal(false);
      setFormData({
        full_name: '',
        mobile: '',
        personal_email: '',
        course_code: 'HRCA',
        mode: 'ONLINE',
        total_fee: 25000,
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create admission.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Save Daily Counts Submit (Section 7)
  const handleDailyCountsSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall('saveSalesDailyCounts', {
        staff_id: selectedStaffId,
        date: dailyCountsDate,
        ...dailyCountsForm,
      });
      toast.success(`Daily counts saved for ${dailyCountsDate}! Bucket list report updated.`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save daily lead counts.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admission live preview helper
  const onlineCount = admissions.filter((a) => a.mode === 'ONLINE').length + 1034;
  const offlineCount = admissions.filter((a) => a.mode === 'OFFLINE').length + 2017;
  const previewNo = formData.mode === 'ONLINE' ? `OMA${onlineCount}` : `MA${offlineCount}`;

  const formatINR = (val) => '₹' + (Number(val) || 0).toLocaleString('en-IN');

  // Filter My Students roster by outcome status
  const filteredMyStudents = (incentiveData.students || []).filter((s) => {
    const outcome = s.outcome_status || (s.status === 'ACTIVE' ? 'ACTIVE' : 'ACTIVE');
    if (studentStatusFilter === 'ALL') return true;
    if (studentStatusFilter === 'Active') return outcome === 'ACTIVE';
    if (studentStatusFilter === 'Completed') return outcome === 'COMPLETED';
    if (studentStatusFilter === 'Dropped After Came') return outcome === 'DROPPED_AFTER_CAME';
    if (studentStatusFilter === 'Dropped Without Came') return outcome === 'DROPPED_WITHOUT_CAME';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 to-brand-700 p-6 rounded-2xl text-white shadow-soft-blue">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">
            Sales & Admissions Command
          </span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">
            Student Enrollments, Daily Lead Counts & Incentives
          </h1>
          <p className="text-xs text-brand-100 mt-1">
            Register new admissions with MA/OMA sequential IDs, track daily bucket balances, and monitor monthly 10% collection incentives
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isExecutive && dailyCountsReport.staff_list?.length > 0 && (
            <div className="flex items-center gap-2 bg-brand-800/80 p-2 rounded-xl border border-brand-500/40">
              <span className="text-[11px] font-bold text-gold-400 uppercase">Viewing Staff:</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-brand-900 text-white font-semibold text-xs rounded-lg px-2.5 py-1 border border-brand-400 focus:outline-none"
              >
                {dailyCountsReport.staff_list.map((st) => (
                  <option key={st.id} value={st.staff_id || st.id}>
                    {st.full_name} ({st.staff_id || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={() => setShowModal(true)}
          >
            New Admission
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('NEW_ADMISSION')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'NEW_ADMISSION'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <UserPlus className="w-4 h-4 text-gold-400" />
          🎓 Admissions Registry ({admissions.length})
        </button>
        <button
          onClick={() => setActiveTab('DAILY_COUNTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DAILY_COUNTS'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Target className="w-4 h-4 text-gold-400" />
          🎯 Daily Lead Counts & Bucket List Report
        </button>
        <button
          onClick={() => setActiveTab('MY_INCENTIVES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'MY_INCENTIVES'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <IndianRupee className="w-4 h-4 text-gold-400" />
          💰 My Incentive & My Students
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ADMISSIONS REGISTRY
          ========================================================================= */}
      {activeTab === 'NEW_ADMISSION' && (
        <Card
          title="Student Admissions Registry"
          subtitle="Real-time synchronized candidate admissions with auto-generated MA/OMA identifiers"
          action={
            <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setShowModal(true)}>
              Register Admission
            </Button>
          }
        >
          <Table
            columns={[
              {
                header: 'Admission No',
                accessor: 'admission_no',
                cell: (row) => (
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg border border-brand-200">
                    {row.admission_no}
                  </span>
                ),
              },
              {
                header: 'Student Name',
                accessor: 'full_name',
                cell: (row) => (
                  <div>
                    <p className="font-semibold text-brand-900">{row.full_name}</p>
                    <p className="text-[11px] text-gray-500">{row.mobile} • {row.personal_email}</p>
                  </div>
                ),
              },
              {
                header: 'Course & Mode',
                accessor: 'course_code',
                cell: (row) => (
                  <span className="font-semibold text-xs text-brand-900 bg-gold-50 text-gold-700 px-2 py-0.5 rounded border border-gold-200">
                    {row.course_code} ({row.mode})
                  </span>
                ),
              },
              {
                header: 'Total Fee',
                accessor: 'total_fee',
                cell: (row) => (
                  <span className="font-bold text-gray-800">
                    ₹{Number(row.total_fee || 0).toLocaleString('en-IN')}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: 'status',
                cell: (row) => <StatusBadge status={row.status} />,
              },
              {
                header: 'Joined Date',
                accessor: 'joined_date',
              },
            ]}
            data={admissions}
            searchPlaceholder="Search student name, admission no, or mobile..."
            exportFileName="MLC_Admissions_List.csv"
            pageSize={10}
            emptyTitle="No Admissions Registered"
            emptyMessage="Click 'Register Admission' above to enroll the first candidate."
          />
        </Card>
      )}

      {/* =========================================================================
          TAB 2: DAILY LEAD COUNTS & BUCKET LIST REPORT (SECTION 7)
          - Replace CRM records with integer counts:
            1. Daily leads
            2. Qualified leads
            3. Interested leads
            4. New to bucket list
            5. Lost from bucket list
          - Running Bucket Balance = Cumulative New - Cumulative Lost
          - Table default sorted by Lost leads (highest first)
          ========================================================================= */}
      {activeTab === 'DAILY_COUNTS' && (
        <div className="space-y-6">
          {/* Daily Entry Form Card */}
          <Card
            title="Log Daily Lead Counts"
            subtitle={`Record daily pipeline counts for ${dailyCountsDate} (Editable same day)`}
          >
            <form onSubmit={handleDailyCountsSubmit} className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700 uppercase">Entry Date:</span>
                <input
                  type="date"
                  value={dailyCountsDate}
                  onChange={(e) => setDailyCountsDate(e.target.value)}
                  className="p-2 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    1. Daily Leads
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dailyCountsForm.leads}
                    onChange={(e) => setDailyCountsForm({ ...dailyCountsForm, leads: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    2. Qualified Leads
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dailyCountsForm.qualified}
                    onChange={(e) => setDailyCountsForm({ ...dailyCountsForm, qualified: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    3. Interested Leads
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dailyCountsForm.interested}
                    onChange={(e) => setDailyCountsForm({ ...dailyCountsForm, interested: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    4. New to Bucket List
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dailyCountsForm.bucket_new}
                    onChange={(e) => setDailyCountsForm({ ...dailyCountsForm, bucket_new: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-rose-800 uppercase tracking-wider mb-1">
                    5. Lost from Bucket List
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dailyCountsForm.bucket_lost}
                    onChange={(e) => setDailyCountsForm({ ...dailyCountsForm, bucket_lost: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-rose-50 border border-rose-300 rounded-xl font-bold text-rose-900 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md" icon={Save} loading={submitting}>
                  Save Daily Lead Counts
                </Button>
              </div>
            </form>
          </Card>

          {/* Running Bucket List KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Leads Logged"
              value={dailyCountsReport.summary?.total_leads || 0}
              subtitle="Cumulative inbound inquiries"
              accent="blue"
              icon={Users}
            />
            <StatCard
              title="New to Bucket List"
              value={dailyCountsReport.summary?.total_bucket_new || 0}
              subtitle="Cumulative added prospective candidates"
              accent="emerald"
              icon={TrendingUp}
            />
            <StatCard
              title="Lost from Bucket List"
              value={dailyCountsReport.summary?.total_bucket_lost || 0}
              subtitle="Cumulative dropped/unreachable"
              accent="rose"
              icon={TrendingDown}
            />
            <StatCard
              title="Current Bucket Balance"
              value={dailyCountsReport.summary?.current_bucket_balance || 0}
              subtitle="Cumulative New − Cumulative Lost"
              accent="gold"
              icon={Sparkles}
            />
          </div>

          {/* Bucket List History Table (Default Sorted by Lost Leads Highest First) */}
          <Card
            title="Bucket List Trend & Daily History"
            subtitle="Sorted by Lost leads (highest first) to prioritize leak analysis"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins text-[11px] bg-gray-50">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Daily Leads</th>
                    <th className="py-3 px-3 text-right">Qualified</th>
                    <th className="py-3 px-3 text-right">Interested</th>
                    <th className="py-3 px-3 text-right text-emerald-700 font-bold">New to Bucket (+)</th>
                    <th className="py-3 px-3 text-right text-rose-700 font-bold">Lost from Bucket (−)</th>
                    <th className="py-3 px-3 text-right font-bold">Net Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(dailyCountsReport.entries || []).map((entry) => {
                    const shift = (Number(entry.bucket_new) || 0) - (Number(entry.bucket_lost) || 0);
                    return (
                      <tr key={entry.id || entry.date} className="hover:bg-brand-50/30">
                        <td className="py-3 px-3 font-semibold text-brand-900">{entry.date}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{entry.leads}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{entry.qualified}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{entry.interested}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">+{entry.bucket_new}</td>
                        <td className="py-3 px-3 text-right font-bold text-rose-700">−{entry.bucket_lost}</td>
                        <td className="py-3 px-3 text-right font-black">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              shift >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {shift >= 0 ? `+${shift}` : shift}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MY INCENTIVE & MY STUDENTS (SECTION 8)
          - 10% collections in paid_month
          - ₹250 deduction per student who dropped without coming
          - Net monthly incentive (allows negative)
          - My Students with status filters: Active, Completed, Dropped After Came, Dropped Without Came
          ========================================================================= */}
      {activeTab === 'MY_INCENTIVES' && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-600" />
              <span className="text-xs font-bold text-brand-900 uppercase">Select Incentive Month:</span>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="p-1.5 bg-gray-50 border border-brand-300 rounded-lg text-xs font-bold text-brand-900"
              />
            </div>

            <span className="text-xs text-gray-500 font-medium">
              Incentive Policy: <strong>10% of Paid Collections</strong> − <strong>₹250 per Dropped Without Came</strong>
            </span>
          </div>

          {/* Incentive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Collections"
              value={formatINR(incentiveData.summary?.collections_total || 0)}
              subtitle={`All payments received in ${targetMonth}`}
              accent="blue"
              icon={IndianRupee}
            />
            <StatCard
              title="10% Gross Incentive"
              value={formatINR(incentiveData.summary?.gross_incentive || 0)}
              subtitle="10% of total paid collections"
              accent="emerald"
              icon={TrendingUp}
            />
            <StatCard
              title="Drop Deductions"
              value={`−${formatINR(incentiveData.summary?.total_deductions || 0)}`}
              subtitle={`${incentiveData.summary?.dropped_without_came_count || 0} student(s) × ₹250`}
              accent="rose"
              icon={TrendingDown}
            />
            <StatCard
              title="Net Monthly Incentive"
              value={formatINR(incentiveData.summary?.net_incentive || 0)}
              subtitle="Gross incentive − deductions"
              accent="gold"
              icon={Sparkles}
            />
          </div>

          {/* Payment Collections Breakdown Table */}
          <Card
            title={`Fee Collections & Commission Ledger (${targetMonth})`}
            subtitle="Itemized payment receipts contributing to monthly sales incentive"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins text-[11px] bg-gray-50">
                    <th className="py-3 px-3">Receipt & Student</th>
                    <th className="py-3 px-3">Due Month</th>
                    <th className="py-3 px-3">Paid Month</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3 text-right">Collected Amount</th>
                    <th className="py-3 px-3 text-right text-emerald-700 font-bold">10% Incentive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(incentiveData.payments || []).map((pay) => (
                    <tr key={pay.payment_id} className="hover:bg-brand-50/30">
                      <td className="py-3 px-3">
                        <strong className="text-brand-900 block">{pay.student_name}</strong>
                        <span className="font-mono text-[10px] text-gray-500">{pay.admission_no} • {pay.receipt_no}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{pay.due_month}</td>
                      <td className="py-3 px-3 text-gray-600 font-semibold">{pay.paid_month}</td>
                      <td className="py-3 px-3 text-gray-600">{pay.payment_mode}</td>
                      <td className="py-3 px-3 text-right font-bold text-brand-900">{formatINR(pay.amount)}</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700">+{formatINR(pay.incentive_amount)}</td>
                    </tr>
                  ))}
                  {(!incentiveData.payments || incentiveData.payments.length === 0) && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-gray-400 italic">
                        No fee payments recorded in {targetMonth} for your enrolled candidates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* My Students with Outcome Status Filter */}
          <Card
            title="My Enrolled Candidates & Outcome Statuses"
            subtitle="Review retention statuses and track penalty exemptions"
            action={
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-brand-900"
                >
                  <option value="ALL">All Enrolled</option>
                  <option value="Active">Active Students</option>
                  <option value="Completed">Completed Alumni</option>
                  <option value="Dropped After Came">Dropped After Came (Exempt from Penalty)</option>
                  <option value="Dropped Without Came">Dropped Without Came (₹250 Penalty)</option>
                </select>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins text-[11px] bg-gray-50">
                    <th className="py-3 px-3">Admission No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Course & Mode</th>
                    <th className="py-3 px-3">Outcome Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMyStudents.map((st) => {
                    const outcome = st.outcome_status || 'ACTIVE';
                    return (
                      <tr key={st.student_id || st.id} className="hover:bg-brand-50/30">
                        <td className="py-3 px-3 font-mono font-bold text-brand-700">{st.admission_no}</td>
                        <td className="py-3 px-3 font-bold text-brand-900">{st.full_name}</td>
                        <td className="py-3 px-3 text-gray-500">{st.mobile} • {st.personal_email}</td>
                        <td className="py-3 px-3 font-semibold text-gray-700">{st.course_code} ({st.mode})</td>
                        <td className="py-3 px-3">
                          {outcome === 'ACTIVE' && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold border border-emerald-200">
                              Active Student
                            </span>
                          )}
                          {outcome === 'COMPLETED' && (
                            <span className="px-2 py-0.5 bg-blue-50 text-brand-800 rounded font-bold border border-brand-200">
                              Completed Alumni
                            </span>
                          )}
                          {outcome === 'DROPPED_AFTER_CAME' && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200">
                              Dropped After Came (No Penalty)
                            </span>
                          )}
                          {outcome === 'DROPPED_WITHOUT_CAME' && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-bold border border-rose-200">
                              Dropped Without Came (−₹250 Penalty)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Create Admission Modal (Section 2: MA / OMA sequential IDs) */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Student Admission"
        subtitle="Generates MA/OMA sequential ID and queues After-Sales task"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAdmissionSubmit} className="space-y-4 text-xs">
          {/* Live ID Preview Chip */}
          <div className="p-3 bg-gradient-to-r from-gold-50 to-brand-50 border border-gold-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span className="text-xs font-bold text-brand-900">Next Admission ID Preview:</span>
            </div>
            <span className="font-mono text-sm font-black text-brand-900 bg-white px-3 py-1 rounded-lg border border-gold-400 shadow-sm">
              {previewNo}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammed Nihal"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                10-Digit Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9847123456"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Personal Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. student@gmail.com"
                value={formData.personal_email}
                onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Mode of Study (MA for Offline, OMA for Online)
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-brand-900"
              >
                <option value="ONLINE">ONLINE (Virtual Classroom) ➔ OMA series</option>
                <option value="OFFLINE">OFFLINE (Campus Classroom) ➔ MA series</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Course Selection
              </label>
              <select
                value={formData.course_code}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-brand-900"
              >
                <option value="HRCA">HRCA (HR & Corporate Admin - 6 Modules)</option>
                <option value="BHA">BHA (Executive Hospital Admin - 13 Modules)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Agreed Total Course Fee (₹)
              </label>
              <input
                type="number"
                value={formData.total_fee}
                onChange={(e) => setFormData({ ...formData, total_fee: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <p>✓ <strong>Auto-Login:</strong> Student username & password will be set to mobile & generated admission number.</p>
            <p>✓ <strong>Sales Attribution:</strong> Commission incentive (10%) linked to logged-in sales staff ID.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              Confirm Admission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
