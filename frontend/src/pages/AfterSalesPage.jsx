import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  PhoneCall,
  CalendarPlus,
  UserCheck,
  ShieldCheck,
  CalendarClock,
  Layers,
  History,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function AfterSalesPage() {
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | DEFERRED | ASSIGNED
  const [afterSalesData, setAfterSalesData] = useState({
    pending: [],
    deferred: [],
    assigned: [],
    batches: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Call Logger Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callData, setCallData] = useState({
    outcome: 'POSITIVE',
    preferred_batch: '',
    preferred_start_date: '',
    notes: '',
  });

  // Assign Batch Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  // Defer Student Modal ("Not for upcoming batch")
  const [deferModalOpen, setDeferModalOpen] = useState(false);
  const [deferMonth, setDeferMonth] = useState('2026-04');
  const [deferReason, setDeferReason] = useState('');

  // Change Batch Modal
  const [changeBatchModalOpen, setChangeBatchModalOpen] = useState(false);
  const [newBatchId, setNewBatchId] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiCall('getAfterSalesData');
      setAfterSalesData(res || { pending: [], deferred: [], assigned: [], batches: [] });
      if (res?.batches?.length) {
        setSelectedBatchId(res.batches[0].id);
        setNewBatchId(res.batches[0].id);
      }
    } catch (err) {
      console.error('Failed to load after sales data:', err);
      toast.error('Failed to load after-sales data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Save Call Record
  const handleSaveCall = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await apiCall('logAfterSalesCall', {
        student_id: selectedStudent.student_id,
        ...callData,
      });
      toast.success('After-sales call logged successfully.');
      setCallModalOpen(false);
      setCallData({ outcome: 'POSITIVE', preferred_batch: '', preferred_start_date: '', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to log call.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Assign Batch
  const handleAssignBatch = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBatchId) return;
    setSubmitting(true);
    try {
      await apiCall('assignBatch', {
        student_id: selectedStudent.student_id,
        batch_id: selectedBatchId,
      });
      toast.success(`${selectedStudent.full_name} successfully enrolled into batch!`);
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign batch.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Defer Student ("Not for upcoming batch")
  const handleDeferStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !deferMonth) return;
    setSubmitting(true);
    try {
      await apiCall('deferStudent', {
        student_id: selectedStudent.student_id,
        needed_month: deferMonth,
        reason: deferReason,
      });
      toast.success(`${selectedStudent.full_name} deferred for ${deferMonth} cohort.`);
      setDeferModalOpen(false);
      setDeferReason('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to defer student.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Change Batch
  const handleChangeBatch = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !newBatchId || !changeReason.trim()) {
      toast.error('Please select new batch and provide justification reason.');
      return;
    }
    setSubmitting(true);
    try {
      await apiCall('changeStudentBatch', {
        student_id: selectedStudent.student_id,
        new_batch_id: newBatchId,
        reason: changeReason.trim(),
      });
      toast.success(`Batch changed for ${selectedStudent.full_name}. Student notified.`);
      setChangeBatchModalOpen(false);
      setChangeReason('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to change batch.');
    } finally {
      setSubmitting(false);
    }
  };

  // Deferred students matched with upcoming batch month check
  const deferredMonthsMap = {};
  (afterSalesData?.deferred || []).forEach((s) => {
    if (s && s.needed_month) {
      deferredMonthsMap[s.needed_month] = (deferredMonthsMap[s.needed_month] || 0) + 1;
    }
  });

  const matchingBatches = (afterSalesData?.batches || []).filter((b) => {
    const bMonth = b && b.start_date ? String(b.start_date).substring(0, 7) : '';
    return bMonth && deferredMonthsMap[bMonth] > 0;
  });

  // Columns for Pending After Sales Tab
  const pendingColumns = [
    {
      header: 'Admission No & Date',
      accessor: 'admission_no',
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
            {row.admission_no}
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Joined: {row.joined_date}</span>
        </div>
      ),
    },
    {
      header: 'Student Name & Contact',
      accessor: 'full_name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-brand-900">{row.full_name}</p>
          <p className="text-[11px] text-gray-500">{row.mobile} • {row.personal_email}</p>
        </div>
      ),
    },
    {
      header: 'Sales Representative',
      accessor: 'sales_person_name',
      cell: (row) => (
        <div>
          <span className="text-xs font-bold text-brand-900 block">{row.sales_person_name}</span>
          <span className="text-[10px] text-gray-400 font-semibold">{row.sales_staff_id}</span>
        </div>
      ),
    },
    {
      header: 'Course & Mode',
      accessor: 'course_code',
      cell: (row) => (
        <span className="text-xs font-semibold text-brand-900 bg-gold-50 text-gold-800 px-2 py-0.5 rounded border border-gold-200">
          {row.course_code} ({row.mode})
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            icon={PhoneCall}
            onClick={() => {
              setSelectedStudent(row);
              setCallModalOpen(true);
            }}
          >
            Log Call
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={CalendarPlus}
            onClick={() => {
              setSelectedStudent(row);
              setAssignModalOpen(true);
            }}
          >
            Assign Batch
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStudent(row);
              setDeferModalOpen(true);
            }}
          >
            Defer Month
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Deferred Tab
  const deferredColumns = [
    {
      header: 'Admission No',
      accessor: 'admission_no',
      cell: (row) => <span className="font-mono text-xs font-bold text-brand-700">{row.admission_no}</span>,
    },
    {
      header: 'Student Name',
      accessor: 'full_name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-brand-900">{row.full_name}</p>
          <p className="text-[11px] text-gray-500">{row.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Needed Month',
      accessor: 'needed_month',
      cell: (row) => (
        <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-300">
          🗓️ {row.needed_month}
        </span>
      ),
    },
    {
      header: 'Sales Representative',
      accessor: 'sales_person_name',
      cell: (row) => <span className="text-xs font-semibold text-gray-700">{row.sales_person_name}</span>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="primary"
          size="sm"
          icon={CalendarPlus}
          onClick={() => {
            setSelectedStudent(row);
            setAssignModalOpen(true);
          }}
        >
          Assign to Batch
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Ops Exec Workflow</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">After-Sales & Cohort Allocation</h1>
          <p className="text-xs text-brand-100 mt-1">Verify enrollment details with Sales rep tracking, allocate BH cohorts, and manage deferred intake months</p>
        </div>
      </div>

      {/* Matching Deferred Cohort Banner */}
      {matchingBatches.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-gold-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="text-sm font-poppins font-bold text-amber-900 block">
                Deferred Intake Match Available!
              </strong>
              <span>
                Batches starting in upcoming deferred months:{' '}
                {matchingBatches.map((b) => `${b.name} (${b.start_date})`).join(', ')}. Check the Deferred tab to assign waiting students.
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('DEFERRED')}
          >
            View Deferred
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PENDING'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-gold-400" />
          Pending After Sales ({afterSalesData?.pending?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('DEFERRED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DEFERRED'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CalendarClock className="w-4 h-4 text-gold-400" />
          Deferred by Month ({afterSalesData?.deferred?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('ASSIGNED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ASSIGNED'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4 text-gold-400" />
          Batches Assigned ({afterSalesData?.assigned?.length || 0})
        </button>
      </div>

      {/* 1. PENDING AFTER SALES TAB */}
      {activeTab === 'PENDING' && (
        <Card title="Pending After-Sales Candidates" subtitle="Admissions pending call logging & cohort assignment">
          <Table
            columns={pendingColumns}
            data={afterSalesData.pending}
            searchPlaceholder="Search candidate name, admission no, or sales rep..."
            exportFileName="Pending_After_Sales.csv"
            pageSize={10}
            emptyTitle="No Pending Candidates"
            emptyMessage="All admitted candidates have been assigned to cohorts or deferred."
          />
        </Card>
      )}

      {/* 2. DEFERRED TAB */}
      {activeTab === 'DEFERRED' && (
        <Card title="Deferred Candidates (Waiting for Desired Month)" subtitle="Students deferred for future month intakes">
          <Table
            columns={deferredColumns}
            data={afterSalesData.deferred}
            searchPlaceholder="Search deferred candidates..."
            exportFileName="Deferred_Students.csv"
            pageSize={10}
            emptyTitle="No Deferred Candidates"
            emptyMessage="No students currently waiting for future month intakes."
          />
        </Card>
      )}

      {/* 3. BATCHES ASSIGNED TAB (Grouped by Batch) */}
      {activeTab === 'ASSIGNED' && (
        <div className="space-y-6">
          {(afterSalesData?.batches || []).map((batch) => {
            const batchStudents = (afterSalesData?.assigned || []).filter((s) => s.batch_id === batch.id);

            return (
              <Card
                key={batch.id}
                title={
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold bg-brand-900 text-gold-400 px-2.5 py-0.5 rounded">
                      {batch.name || batch.batch_code}
                    </span>
                    <span>Slot: {batch.slot || '10:30 AM'}</span>
                  </div>
                }
                subtitle={`Starts ${batch.start_date || 'TBD'} • Seats Filled: ${batchStudents.length}`}
              >
                {batchStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 uppercase text-gray-500 font-poppins text-[11px]">
                          <th className="pb-3">Admission No</th>
                          <th className="pb-3">Student Name</th>
                          <th className="pb-3">Mobile & Email</th>
                          <th className="pb-3">Course</th>
                          <th className="pb-3">Sales Person</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {batchStudents.map((st) => {
                          let changeLogs = [];
                          try {
                            changeLogs = JSON.parse(st.batch_change_log_json || '[]');
                          } catch (e) {
                            changeLogs = [];
                          }

                          return (
                            <tr key={st.id} className="hover:bg-gray-50">
                              <td className="py-3 font-mono font-bold text-brand-700">{st.admission_no}</td>
                              <td className="py-3">
                                <strong className="text-brand-900 block">{st.full_name}</strong>
                                {changeLogs.length > 0 && (
                                  <span className="text-[10px] text-amber-700 italic">
                                    Transferred from previous cohort
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-gray-500">{st.mobile} • {st.personal_email}</td>
                              <td className="py-3 font-semibold text-brand-900">{st.course_code}</td>
                              <td className="py-3 text-gray-600">{st.sales_person_name}</td>
                              <td className="py-3 text-right">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={ArrowRight}
                                  onClick={() => {
                                    setSelectedStudent(st);
                                    setChangeBatchModalOpen(true);
                                  }}
                                >
                                  Change Batch
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-4 text-center">
                    No students currently assigned to this batch.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Log Call Modal */}
      <Modal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        title="Log After-Sales Interaction"
        subtitle={`Candidate: ${selectedStudent?.full_name} (${selectedStudent?.admission_no})`}
      >
        <form onSubmit={handleSaveCall} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Call Outcome
            </label>
            <select
              value={callData.outcome}
              onChange={(e) => setCallData({ ...callData, outcome: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-brand-900"
            >
              <option value="POSITIVE">Positive / Ready for Batch Assignment</option>
              <option value="RESCHEDULE">Callback Requested (Needs more time)</option>
              <option value="UNREACHABLE">Unreachable / Phone Switched Off</option>
              <option value="DROPPED">Candidate Cancelled / Dropped</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Preferred Slot
              </label>
              <select
                value={callData.preferred_batch}
                onChange={(e) => setCallData({ ...callData, preferred_batch: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
              >
                <option value="">-- Any Slot --</option>
                <option value="8:30 AM">8:30 AM Morning Slot</option>
                <option value="10:30 AM">10:30 AM Prime Slot</option>
                <option value="12:30 PM">12:30 PM Afternoon Slot</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Target Joining Date
              </label>
              <input
                type="date"
                value={callData.preferred_start_date}
                onChange={(e) => setCallData({ ...callData, preferred_start_date: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Conversation Notes & Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Confirmed laptop availability; keen on AI module..."
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium text-brand-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setCallModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Save Call Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Batch Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Candidate to Active Cohort"
        subtitle={`Student: ${selectedStudent?.full_name} (${selectedStudent?.course_code})`}
      >
        <form onSubmit={handleAssignBatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Cohort Batch (Shows Slot, Start Date & Seats)
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
            >
              {(afterSalesData?.batches || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.batch_code} — Slot: {b.slot || '10:30 AM'} — Starts {b.start_date || 'TBD'} ({b.seats_assigned || 0} enrolled)
                </option>
              ))}
            </select>
          </div>

          {selectedStudent?.course_code === 'BHA' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>BHA Specialized Curriculum:</strong> Access to all 7 Healthcare Administration (HA1–HA7) specialized sessions will be activated.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Confirm Cohort Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Defer Student Modal ("Not for upcoming batch") */}
      <Modal
        isOpen={deferModalOpen}
        onClose={() => setDeferModalOpen(false)}
        title="Defer Candidate Intake Month"
        subtitle={`Candidate: ${selectedStudent?.full_name} (${selectedStudent?.admission_no})`}
      >
        <form onSubmit={handleDeferStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Needed Month for Enrollment *
            </label>
            <input
              type="month"
              required
              value={deferMonth}
              onChange={(e) => setDeferMonth(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Reason for Deferral
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Final semester college exams until end of March; requested April batch."
              value={deferReason}
              onChange={(e) => setDeferReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setDeferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Defer to {deferMonth}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Batch Modal */}
      <Modal
        isOpen={changeBatchModalOpen}
        onClose={() => setChangeBatchModalOpen(false)}
        title="Transfer Student to Another Batch"
        subtitle={`Student: ${selectedStudent?.full_name}`}
      >
        <form onSubmit={handleChangeBatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select New Target Batch *
            </label>
            <select
              value={newBatchId}
              onChange={(e) => setNewBatchId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
            >
              {(afterSalesData?.batches || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.batch_code} (Slot: {b.slot || '10:30 AM'}, Starts: {b.start_date || 'TBD'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Transfer Justification Reason *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Student requested time slot change from 8:30 AM to 10:30 AM due to commute."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
            ℹ️ The student will receive an in-app notification about their batch change, and the transfer history will be logged.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setChangeBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Confirm Batch Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
