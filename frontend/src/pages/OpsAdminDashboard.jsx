import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Users,
  CalendarDays,
  CheckSquare,
  BookOpen,
  IndianRupee,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export function OpsAdminDashboard() {
  const [admissions, setAdmissions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [feeData, setFeeData] = useState(null);
  const [duties, setDuties] = useState([]);
  const [postponeRequests, setPostponeRequests] = useState([
    {
      id: 'pr-101',
      student_name: 'Sneha Mohan',
      admission_no: 'ON-2026-0002',
      installment: '1st Course Installment (₹8,012)',
      current_due_date: '2026-02-12',
      requested_due_date: '2026-02-28',
      reason: 'Awaiting monthly salary credit from family',
      status: 'PENDING_APPROVAL',
    }
  ]);
  const [selectedPostpone, setSelectedPostpone] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    async function loadOpsData() {
      try {
        const [adm, batchList, fees, dutyData] = await Promise.all([
          apiCall('getAdmissions'),
          apiCall('getBatchesList'),
          apiCall('getFeeAnalytics'),
          apiCall('getStaffDutiesAndKPIs'),
        ]);
        setAdmissions(adm?.items || []);
        setBatches(batchList || []);
        setFeeData(fees);
        setDuties(dutyData?.duties || []);
      } catch (err) {
        console.error('Ops Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOpsData();
  }, []);

  const handlePostponeDecision = async (decision) => {
    if (!selectedPostpone) return;
    try {
      await apiCall('approvePostpone', {
        request_id: selectedPostpone.id,
        decision,
        remarks: reviewRemarks,
      });
      toast.success(`Fee postponement request ${decision.toLowerCase()} successfully.`);
      setPostponeRequests((prev) =>
        prev.map((r) => (r.id === selectedPostpone.id ? { ...r, status: decision } : r))
      );
      setSelectedPostpone(null);
      setReviewRemarks('');
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const formatINR = (val) => '₹' + (Number(val) || 0).toLocaleString('en-IN');

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-gray-500 mt-2 font-medium">Loading Operations Control Desk...</p>
      </div>
    );
  }

  // Admissions funnel statistics
  const funnel = {
    converted: admissions.filter(a => a.status === 'LEAD_CONVERTED').length,
    assigned: admissions.filter(a => a.status === 'ASSIGNED').length,
    active: admissions.filter(a => a.status === 'ACTIVE').length,
    total: admissions.length,
  };

  return (
    <div className="space-y-6">
      {/* Ops Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Academic & Operational Desk</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Operations Administration</h1>
          <p className="text-xs text-brand-100 mt-1">Batch allocations, timetable delivery, attendance shortfalls, duties, and fee postponement governance</p>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Admissions Pipeline"
          value={`${funnel.total} Students`}
          subtitle={`${funnel.converted} pending batch assignment`}
          accent="blue"
          icon={Users}
        />
        <StatCard
          title="Active Batches"
          value={`${batches.filter(b => b.status === 'ACTIVE').length} Batches`}
          subtitle="Running in morning & weekend slots"
          accent="gold"
          icon={CalendarDays}
        />
        <StatCard
          title="Fee Collections"
          value={formatINR(feeData?.total_collected || 178500)}
          subtitle={`${formatINR(feeData?.total_pending || 82400)} pending`}
          accent="emerald"
          icon={IndianRupee}
        />
        <StatCard
          title="Pending Postponements"
          value={`${postponeRequests.filter(p => p.status === 'PENDING_APPROVAL').length} Requests`}
          subtitle="Awaiting Ops Admin Approval"
          accent="rose"
          icon={AlertCircle}
        />
      </div>

      {/* Admissions Funnel & Fee Postponement Approval Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admissions Funnel */}
        <Card title="Admissions Onboarding Funnel" subtitle="Real-time conversion stage breakdown">
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">1. Lead Converted (Reg Paid / Pending Call)</span>
              <span className="text-sm font-bold text-brand-900">{funnel.converted}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-800">2. Batch Assigned (After-Sales Complete)</span>
              <span className="text-sm font-bold text-brand-700">{funnel.assigned}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">3. Active Enrolled (Batch Commenced)</span>
              <span className="text-sm font-bold text-emerald-700">{funnel.active}</span>
            </div>
          </div>
        </Card>

        {/* Fee Date Postponement Requests Approval */}
        <Card
          title="Fee Date Postponement Approval"
          subtitle="Exclusive Ops Admin authority to modify installment schedules"
        >
          <div className="space-y-3">
            {postponeRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-poppins font-bold text-sm text-brand-900">{req.student_name}</h5>
                    <p className="text-xs text-gray-500">{req.admission_no} • {req.installment}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <p className="text-gray-700"><strong>Reason:</strong> {req.reason}</p>
                  <p className="text-gray-600 mt-1">
                    Current Due: <strong className="text-rose-600">{req.current_due_date}</strong> ➔ Requested: <strong className="text-emerald-600">{req.requested_due_date}</strong>
                  </p>
                </div>
                {req.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setSelectedPostpone(req); }}
                    >
                      Review & Decide
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Operational Batches & Daily Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Active Batches & Trainer Assignments" subtitle="Current cohorts in delivery">
          <div className="divide-y divide-gray-100">
            {batches.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-xs text-brand-900">{b.name}</h5>
                  <p className="text-[11px] text-gray-500 font-mono">{b.batch_code} • {b.course_code} • Trainer: {b.default_trainer_id || 'TR-101'}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Today's Daily Operational Tasks" subtitle="Routine checklist generated from templates">
          <div className="divide-y divide-gray-100">
            {duties.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-xs text-brand-900">{d.title}</h5>
                    <p className="text-[11px] text-gray-500">{d.remark || 'Awaiting completion'}</p>
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Postponement Review Modal */}
      <Modal
        isOpen={!!selectedPostpone}
        onClose={() => setSelectedPostpone(null)}
        title="Approve / Reject Fee Postponement"
        subtitle={`Student: ${selectedPostpone?.student_name} (${selectedPostpone?.admission_no})`}
        footer={
          <>
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => handlePostponeDecision('REJECTED')}
            >
              Reject Request
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handlePostponeDecision('APPROVED')}
            >
              Approve Postponement
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p><strong>Note:</strong> Approving this request will modify the official installment schedule date and log an unalterable audit entry.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Ops Admin Remarks & Justification
            </label>
            <textarea
              rows={3}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g. Verified with student guardian; approved 16-day extension."
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
