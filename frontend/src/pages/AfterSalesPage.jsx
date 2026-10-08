import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { PhoneCall, CalendarPlus, UserCheck, ShieldCheck } from 'lucide-react';

export function AfterSalesPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Call Logger Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Call form state
  const [callData, setCallData] = useState({
    outcome: 'POSITIVE',
    preferred_batch: '',
    preferred_start_date: '',
    notes: '',
  });

  // Assign batch state
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStudents, resBatches] = await Promise.all([
        apiCall('getAdmissions'),
        apiCall('getBatchesList'),
      ]);
      setStudents(resStudents?.items || []);
      setBatches(resBatches || []);
      if (resBatches && resBatches.length) {
        setSelectedBatchId(resBatches[0].id);
      }
    } catch (err) {
      toast.error('Failed to load after-sales data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const columns = [
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
          <p className="text-[11px] text-gray-500">{row.mobile} • {row.personal_email}</p>
        </div>
      ),
    },
    {
      header: 'Course & Mode',
      accessor: 'course_code',
      cell: (row) => (
        <span className="text-xs font-semibold text-brand-900">
          {row.course_code} ({row.mode})
        </span>
      ),
    },
    {
      header: 'Current Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Assigned Batch',
      accessor: 'batch_id',
      cell: (row) => {
        const batch = batches.find((b) => b.id === row.batch_id);
        return batch ? (
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded border border-brand-200">
            {batch.name || batch.batch_code}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        );
      },
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
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
            variant={row.status === 'ASSIGNED' || row.status === 'ACTIVE' ? 'secondary' : 'primary'}
            size="sm"
            icon={CalendarPlus}
            onClick={() => {
              setSelectedStudent(row);
              setAssignModalOpen(true);
            }}
          >
            {row.batch_id ? 'Reassign' : 'Assign Batch'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Ops Exec Workflow</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">After-Sales & Batch Allocation</h1>
          <p className="text-xs text-brand-100 mt-1">Verify enrollment preferences, log student interactions, and assign cohort schedules</p>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={students}
          searchPlaceholder="Search students to call or assign..."
          exportFileName="After_Sales_Student_List.csv"
          pageSize={10}
        />
      </Card>

      {/* Log Call Modal */}
      <Modal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        title="Log After-Sales Interaction"
        subtitle={`Candidate: ${selectedStudent?.full_name} (${selectedStudent?.admission_no})`}
      >
        <form onSubmit={handleSaveCall} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Call Outcome
            </label>
            <select
              value={callData.outcome}
              onChange={(e) => setCallData({ ...callData, outcome: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-semibold text-brand-900"
            >
              <option value="POSITIVE">Positive / Ready for Batch Assignment</option>
              <option value="RESCHEDULE">Callback Requested (Needs more time)</option>
              <option value="UNREACHABLE">Unreachable / Phone Switched Off</option>
              <option value="DROPPED">Candidate Cancelled / Dropped</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Preferred Slot / Batch
              </label>
              <input
                type="text"
                placeholder="e.g. Morning 10am or Weekend"
                value={callData.preferred_batch}
                onChange={(e) => setCallData({ ...callData, preferred_batch: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Target Joining Date
              </label>
              <input
                type="date"
                value={callData.preferred_start_date}
                onChange={(e) => setCallData({ ...callData, preferred_start_date: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Conversation Notes & Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Confirmed laptop availability; keen on AI module..."
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
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
        <form onSubmit={handleAssignBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select Cohort Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.batch_code}) — Starts {b.start_date}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent?.course_code === 'BHA' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>BHA Specialized Curriculum Flag:</strong> This student is enrolled in Bachelor/Executive Hospital Administration. They will automatically have access to all 7 Healthcare Administration (HA1–HA7) specialized sessions.
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
    </div>
  );
}
