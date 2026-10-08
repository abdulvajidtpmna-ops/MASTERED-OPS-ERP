import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
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
} from 'lucide-react';

export function FeeCollectionPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
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

  const toast = useToast();

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await apiCall('getAdmissions');
      const items = res?.items || [];
      setStudents(items);
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
    const total = Number(student.total_fee) || 25000;
    const isStudent2 = student.student_id === 'STU-002';

    // Build installment list for UI display
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
    loadStudents();
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

  const formatINR = (val) => '₹' + (Number(val) || 0).toLocaleString('en-IN');

  const totalFee = Number(selectedStudent?.total_fee) || 25000;
  const totalPaid = installments.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
  const totalBalance = totalFee - totalPaid;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Office Administration Desk</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Fee Collection & Vouchers</h1>
          <p className="text-xs text-brand-100 mt-1">Record payments, generate instant receipts, submit postponement requests and track reminders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Selector List */}
        <Card title="Student Accounts" subtitle="Select candidate to view fee ledger">
          <div className="space-y-2 max-h-[580px] overflow-y-auto">
            {students.map((s) => (
              <div
                key={s.id}
                onClick={() => selectStudent(s)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedStudent?.id === s.id
                    ? 'bg-brand-50 border-brand-500 shadow-sm ring-1 ring-brand-500/30'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-xs text-brand-900">{s.full_name}</h5>
                    <p className="font-mono text-[11px] text-brand-700">{s.admission_no}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{formatINR(s.total_fee)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <span>{s.course_code} • {s.mode}</span>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right 2 Columns: Selected Student Fee Plan & Installments Table */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent && (
            <>
              {/* Financial Snapshot Summary Card */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Fee</span>
                  <h4 className="text-xl font-poppins font-bold text-brand-900 mt-1">{formatINR(totalFee)}</h4>
                  <span className="text-[11px] text-gray-500">{selectedStudent.course_code} Course Plan</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Total Paid</span>
                  <h4 className="text-xl font-poppins font-bold text-emerald-800 mt-1">{formatINR(totalPaid)}</h4>
                  <span className="text-[11px] text-emerald-600 font-medium">Acknowledged</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                  <span className="text-[10px] text-amber-700 font-bold uppercase">Balance Pending</span>
                  <h4 className="text-xl font-poppins font-bold text-amber-800 mt-1">{formatINR(totalBalance)}</h4>
                  <span className="text-[11px] text-amber-600 font-medium">Installments due</span>
                </div>
              </div>

              {/* Installments Table */}
              <Card
                title={`Fee Plan: ${selectedStudent.full_name} (${selectedStudent.admission_no})`}
                subtitle="Registration fee, start-day balance, and 4 course installments"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 uppercase font-poppins">
                        <th className="pb-3">Item / Installment</th>
                        <th className="pb-3">Due Date</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-right">Paid</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {installments.map((inst, idx) => (
                        <tr key={idx} className="hover:bg-brand-50/30">
                          <td className="py-3 font-semibold text-brand-900">
                            {inst.title}
                          </td>
                          <td className="py-3 text-gray-600">{inst.due_date}</td>
                          <td className="py-3 text-right font-bold text-gray-800">{formatINR(inst.amount)}</td>
                          <td className="py-3 text-right font-semibold text-emerald-600">{formatINR(inst.paid_amount || 0)}</td>
                          <td className="py-3 text-center">
                            <StatusBadge status={inst.status} />
                          </td>
                          <td className="py-3 text-right">
                            {inst.status !== 'PAID' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={IndianRupee}
                                  onClick={() => {
                                    setActiveInstallment(inst);
                                    setPayData({
                                      amount: String(inst.amount - (inst.paid_amount || 0)),
                                      payment_mode: 'UPI',
                                      reference_no: '',
                                      remarks: '',
                                    });
                                    setPaymentModalOpen(true);
                                  }}
                                >
                                  Collect
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={CalendarClock}
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
                              <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid on {inst.paid_date}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Reminders Dispatch Audit Log */}
              <Card title="Fee Reminder Notifications Dispatched" subtitle="Automated 08:00 AM daily trigger log">
                <div className="space-y-2">
                  {[
                    { type: '3 Days Before Due Date', date: '2026-02-09', channel: 'Email + In-App', status: 'Delivered' },
                    { type: 'Payment Receipt Confirmation', date: '2026-02-10', channel: 'Email (PDF attached)', status: 'Delivered' },
                  ].map((rem, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MailCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <strong className="text-brand-900">{rem.type}</strong>
                          <p className="text-[11px] text-gray-500">Sent on {rem.date} via {rem.channel}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {rem.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Fee Payment & Issue Receipt"
        subtitle={`Student: ${selectedStudent?.full_name} • ${activeInstallment?.title}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Amount to Collect (₹) *
            </label>
            <input
              type="number"
              required
              value={payData.amount}
              onChange={(e) => setPayData({ ...payData, amount: e.target.value })}
              className="w-full p-2.5 text-base font-bold bg-white border border-gray-200 rounded-xl text-brand-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Mode *
              </label>
              <select
                value={payData.payment_mode}
                onChange={(e) => setPayData({ ...payData, payment_mode: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
              >
                <option value="UPI">UPI / Google Pay / PhonePe</option>
                <option value="CASH">Cash at Office Desk</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
                <option value="CARD">Credit / Debit Card POS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Transaction / Reference Number
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-92384729"
                value={payData.reference_no}
                onChange={(e) => setPayData({ ...payData, reference_no: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in full for 1st installment"
              value={payData.remarks}
              onChange={(e) => setPayData({ ...payData, remarks: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Confirm Payment & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Postpone Request Modal */}
      <Modal
        isOpen={postponeModalOpen}
        onClose={() => setPostponeModalOpen(false)}
        title="Submit Fee Postponement Request"
        subtitle={`For: ${activeInstallment?.title} (Current Due: ${activeInstallment?.due_date})`}
      >
        <form onSubmit={handleRequestPostpone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              New Requested Due Date *
            </label>
            <input
              type="date"
              required
              value={postponeData.requested_due_date}
              onChange={(e) => setPostponeData({ ...postponeData, requested_due_date: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Justification & Reason *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Student requested 15 days extension due to family emergency..."
              value={postponeData.reason}
              onChange={(e) => setPostponeData({ ...postponeData, reason: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <p className="text-[11px] text-gray-500">
            ★ Note: As per institute policy, fee date modifications require approval by the Operations Administrator.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setPostponeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Submit for Ops Admin Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fee Receipt Preview Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Payment Receipt"
        subtitle={`Receipt No: ${lastReceipt?.receipt_no}`}
        maxWidth="max-w-lg"
        footer={
          <Button variant="primary" size="md" onClick={() => setReceiptModalOpen(false)}>
            Done & Send to Email
          </Button>
        }
      >
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-white space-y-4">
          <div className="text-center border-b pb-3">
            <h3 className="font-poppins font-bold text-brand-900 text-lg">Mastered Skill Academy</h3>
            <p className="text-xs text-gray-500">Official Fee Payment Receipt</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Receipt No</span>
              <strong className="font-mono text-brand-700">{lastReceipt?.receipt_no}</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Date</span>
              <strong>{lastReceipt?.date}</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Student Name</span>
              <strong className="text-brand-900">{lastReceipt?.student?.full_name}</strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Admission No</span>
              <strong className="font-mono text-brand-700">{lastReceipt?.student?.admission_no}</strong>
            </div>
          </div>

          <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">{lastReceipt?.installment?.title}</p>
              <p className="text-[10px] text-gray-500">Mode: {lastReceipt?.mode} ({lastReceipt?.ref || 'N/A'})</p>
            </div>
            <span className="text-xl font-poppins font-black text-emerald-700">
              {formatINR(lastReceipt?.amount)}
            </span>
          </div>

          <p className="text-[10px] text-center text-gray-400 italic">
            This receipt has been automatically emailed to {lastReceipt?.student?.personal_email}.
          </p>
        </div>
      </Modal>
    </div>
  );
}
