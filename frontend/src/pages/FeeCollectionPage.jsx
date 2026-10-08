import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  IndianRupee,
  Receipt,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Download,
  MailCheck,
  AlertTriangle,
  History,
  ShieldCheck,
  UserX,
} from 'lucide-react';

export function FeeCollectionPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Payment Form State
  const [payData, setPayData] = useState({
    amount: '',
    payment_mode: 'UPI',
    reference_no: '',
    remarks: '',
  });

  // Postpone Form State
  const [postponeData, setPostponeData] = useState({
    requested_due_date: '',
    reason: '',
  });

  // Outcome Status State (Section 8)
  const [outcomeForm, setOutcomeForm] = useState({
    outcome_status: 'ACTIVE',
    reason: '',
  });

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStudents, resBatches] = await Promise.all([
        apiCall('getAdmissions'),
        apiCall('getBatchesList'),
      ]);
      const items = resStudents?.items || [];
      setStudents(items);
      setBatches(resBatches || []);
      if (items.length && !selectedStudent) {
        selectStudent(items[0]);
      }
    } catch (err) {
      toast.error('Failed to load fee registry.');
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    const isStudent2 = student.student_id === 'STU-002';

    const instList = [
      {
        id: 'inst-0',
        installment_no: 0,
        title: 'Registration Fee',
        due_date: student.joined_date || '2026-02-01',
        amount: 500,
        paid_amount: 500,
        status: 'PAID',
        paid_date: student.joined_date || '2026-02-01',
      },
      {
        id: 'inst-0.5',
        installment_no: 0.5,
        title: 'Balance Registration Fee',
        due_date: '2026-02-05',
        amount: 2450,
        paid_amount: 2450,
        status: 'PAID',
        paid_date: '2026-02-05',
      },
      {
        id: 'inst-1',
        installment_no: 1,
        title: '1st Course Installment',
        due_date: '2026-02-12',
        amount: isStudent2 ? 8012 : 5512,
        paid_amount: isStudent2 ? 0 : 5512,
        status: isStudent2 ? 'UNPAID' : 'PAID',
        paid_date: isStudent2 ? null : '2026-02-10',
      },
      {
        id: 'inst-2',
        installment_no: 2,
        title: '2nd Course Installment',
        due_date: '2026-03-14',
        amount: isStudent2 ? 8012 : 5512,
        paid_amount: 0,
        status: 'UNPAID',
      },
      {
        id: 'inst-3',
        installment_no: 3,
        title: '3rd Course Installment',
        due_date: '2026-04-13',
        amount: isStudent2 ? 8012 : 5512,
        paid_amount: 0,
        status: 'UNPAID',
      },
      {
        id: 'inst-4',
        installment_no: 4,
        title: '4th Course Installment',
        due_date: '2026-05-13',
        amount: isStudent2 ? 8014 : 5514,
        paid_amount: 0,
        status: 'UNPAID',
      },
    ];
    setInstallments(instList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !activeInstallment || !payData.amount) return;

    setSubmitting(true);
    try {
      const res = await apiCall('recordPayment', {
        student_id: selectedStudent.student_id,
        installment_id: activeInstallment.id,
        amount: Number(payData.amount),
        payment_mode: payData.payment_mode,
        reference_no: payData.reference_no,
        remarks: payData.remarks,
        idempotency_key: `PAY_${selectedStudent.student_id}_${activeInstallment.id}_${Date.now()}`,
      });

      toast.success(`Payment recorded! Generated Receipt #${res.receipt_no}`);
      setLastReceipt({
        receipt_no: res.receipt_no,
        amount: payData.amount,
        mode: payData.payment_mode,
        ref: payData.reference_no,
        date: new Date().toLocaleDateString('en-IN'),
        student: selectedStudent,
        installment: activeInstallment,
      });
      setPaymentModalOpen(false);
      setReceiptModalOpen(true);
      selectStudent(selectedStudent);
    } catch (err) {
      toast.error(err.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPostpone = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !activeInstallment || !postponeData.requested_due_date || !postponeData.reason) {
      toast.error('Please specify new requested date and reason.');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('requestPostpone', {
        installment_id: activeInstallment.id,
        student_id: selectedStudent.student_id,
        requested_due_date: postponeData.requested_due_date,
        reason: postponeData.reason,
      });
      toast.success('Postponement request submitted for Ops Admin approval.');
      setPostponeModalOpen(false);
      setPostponeData({ requested_due_date: '', reason: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Student Outcome Status Update (Section 8)
  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      await apiCall('setStudentOutcomeStatus', {
        student_id: selectedStudent.student_id,
        outcome_status: outcomeForm.outcome_status,
        reason: outcomeForm.reason,
      });

      toast.success(`Student outcome updated to '${outcomeForm.outcome_status}'!`);
      setOutcomeModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update outcome status.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val) => '₹' + (Number(val) || 0).toLocaleString('en-IN');

  const assignedBatch = batches.find((b) => b.id === selectedStudent?.batch_id);
  let batchPostponed = false;
  if (assignedBatch?.start_date_history_json) {
    try {
      const hist = JSON.parse(assignedBatch.start_date_history_json);
      batchPostponed = hist.length > 0;
    } catch (e) {}
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Office Admin & Accounts</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Fee Collections, Receipts & Ledger</h1>
          <p className="text-xs text-brand-100 mt-1">Record payments with automated due/paid month tagging and update student outcome retention statuses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selector Card */}
        <Card title="Select Student" subtitle="Search candidate roster">
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {students.map((st) => (
              <div
                key={st.id || st.student_id}
                onClick={() => selectStudent(st)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedStudent?.student_id === st.student_id
                    ? 'bg-brand-50 border-brand-500 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-700">{st.admission_no}</span>
                  <StatusBadge status={st.status} />
                </div>
                <h4 className="font-bold text-brand-900 text-sm mt-1">{st.full_name}</h4>
                <p className="text-[11px] text-gray-500">{st.course_code} • {st.mobile}</p>
                {st.outcome_status && st.outcome_status !== 'ACTIVE' && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {st.outcome_status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Selected Student Ledger & Action Desk */}
        <div className="lg:col-span-2 space-y-4">
          {/* Postponement Warning Banner (Section 1) */}
          {batchPostponed && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="text-sm font-bold text-amber-900 block">
                    Batch Start Date Moved — Review Installment Dates!
                  </strong>
                  <span>
                    Cohort <strong>{assignedBatch?.name}</strong> start date was postponed to {assignedBatch?.start_date}. Review student installment schedules if needed.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Student Profile & Outcome Status Bar */}
          <Card
            title={
              <div className="flex items-center gap-3">
                <span>{selectedStudent?.full_name || 'Student Ledger'}</span>
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {selectedStudent?.admission_no}
                </span>
              </div>
            }
            subtitle={`Course: ${selectedStudent?.course_code} • Total Fee: ${formatINR(selectedStudent?.total_fee || 25000)}`}
            action={
              <Button
                variant="secondary"
                size="sm"
                icon={UserX}
                onClick={() => {
                  setOutcomeForm({
                    outcome_status: selectedStudent?.outcome_status || 'ACTIVE',
                    reason: selectedStudent?.outcome_reason || '',
                  });
                  setOutcomeModalOpen(true);
                }}
              >
                Set Outcome Status
              </Button>
            }
          >
            {/* Installments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins text-[11px] bg-gray-50">
                    <th className="py-3 px-3">Installment Title</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {installments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-brand-50/30">
                      <td className="py-3 px-3 font-semibold text-brand-900">{inst.title}</td>
                      <td className="py-3 px-3 text-gray-600 font-mono">{inst.due_date}</td>
                      <td className="py-3 px-3 text-right font-bold text-brand-900">{formatINR(inst.amount)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-600">{formatINR(inst.paid_amount || 0)}</td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={inst.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {inst.status !== 'PAID' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={IndianRupee}
                              onClick={() => {
                                setActiveInstallment(inst);
                                setPayData({
                                  amount: inst.amount - (inst.paid_amount || 0),
                                  payment_mode: 'UPI',
                                  reference_no: '',
                                  remarks: '',
                                });
                                setPaymentModalOpen(true);
                              }}
                            >
                              Pay
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveInstallment(inst);
                                setPostponeData({ requested_due_date: '', reason: '' });
                                setPostponeModalOpen(true);
                              }}
                            >
                              Postpone
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">✓ Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Fee Payment Receipt"
        subtitle={`Student: ${selectedStudent?.full_name} • ${activeInstallment?.title}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              required
              value={payData.amount}
              onChange={(e) => setPayData({ ...payData, amount: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Mode *
              </label>
              <select
                value={payData.payment_mode}
                onChange={(e) => setPayData({ ...payData, payment_mode: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
                <option value="CASH">Cash Deposit at Academy</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Transaction / UTR Reference No
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-98471203492"
                value={payData.reference_no}
                onChange={(e) => setPayData({ ...payData, reference_no: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Remarks & Accounting Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Verified by Accounts desk (Anjali)"
              value={payData.remarks}
              onChange={(e) => setPayData({ ...payData, remarks: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
            ℹ️ Stores <strong>paid_month</strong> ({new Date().toISOString().substring(0, 7)}) and attributes 10% commission to Sales Rep ({selectedStudent?.sales_staff_id || 'Staff'}).
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Generate Receipt & Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Set Student Outcome Status Modal (Section 8) */}
      <Modal
        isOpen={outcomeModalOpen}
        onClose={() => setOutcomeModalOpen(false)}
        title="Update Student Outcome Status"
        subtitle={`Student: ${selectedStudent?.full_name} (${selectedStudent?.admission_no})`}
      >
        <form onSubmit={handleSaveOutcome} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Outcome Status *
            </label>
            <select
              value={outcomeForm.outcome_status}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome_status: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
            >
              <option value="ACTIVE">ACTIVE (Ongoing Active Student)</option>
              <option value="COMPLETED">COMPLETED (Course Finished / Alumni)</option>
              <option value="DROPPED_AFTER_CAME">DROPPED_AFTER_CAME (Attended ≥1 class, No Penalty)</option>
              <option value="DROPPED_WITHOUT_CAME">DROPPED_WITHOUT_CAME (Zero Attendance, −₹250 Sales Penalty)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Reason / Justification *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Student relocated to Gulf for family reasons prior to attending any sessions."
              value={outcomeForm.reason}
              onChange={(e) => setOutcomeForm({ ...outcomeForm, reason: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
            ⚠️ <strong>Validation Rule:</strong> If the student has ever marked attendance in any class session, <code>DROPPED_WITHOUT_CAME</code> will be strictly rejected. Use <code>DROPPED_AFTER_CAME</code>.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setOutcomeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Save Outcome Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Postpone Request Modal */}
      <Modal
        isOpen={postponeModalOpen}
        onClose={() => setPostponeModalOpen(false)}
        title="Request Installment Due Date Extension"
        subtitle={`Student: ${selectedStudent?.full_name} • ${activeInstallment?.title}`}
      >
        <form onSubmit={handleRequestPostpone} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              New Requested Due Date *
            </label>
            <input
              type="date"
              required
              value={postponeData.requested_due_date}
              onChange={(e) => setPostponeData({ ...postponeData, requested_due_date: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Justification Reason *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Salary delay from employer; requested 7-day grace period."
              value={postponeData.reason}
              onChange={(e) => setPostponeData({ ...postponeData, reason: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setPostponeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
