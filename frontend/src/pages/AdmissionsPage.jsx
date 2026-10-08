import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import { UserPlus, Sparkles, Filter } from 'lucide-react';

export function AdmissionsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    personal_email: '',
    course_code: 'HRCA',
    mode: 'ONLINE',
    total_fee: 25000,
  });

  const toast = useToast();

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      const res = await apiCall('getAdmissions');
      setAdmissions(res?.items || []);
    } catch (err) {
      toast.error('Failed to load admissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const handleCourseChange = (course) => {
    setFormData((prev) => ({
      ...prev,
      course_code: course,
      total_fee: course === 'BHA' ? 35000 : 25000,
    }));
  };

  const handleFormSubmit = async (e) => {
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
      loadAdmissions();
    } catch (err) {
      toast.error(err.message || 'Failed to create admission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Live preview admission number calculation
  const onlineCount = admissions.filter((a) => a.mode === 'ONLINE').length + 1;
  const offlineCount = admissions.filter((a) => a.mode === 'OFFLINE').length + 1;
  const year = new Date().getFullYear();
  const previewNo =
    formData.mode === 'ONLINE'
      ? `ON-${year}-${('0000' + onlineCount).slice(-4)}`
      : `OF-${year}-${('0000' + offlineCount).slice(-4)}`;

  const columns = [
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
          <p className="text-[11px] text-gray-500">{row.mobile}</p>
        </div>
      ),
    },
    {
      header: 'Course',
      accessor: 'course_code',
      cell: (row) => (
        <span className="font-semibold text-xs text-brand-900 bg-gold-50 text-gold-700 px-2 py-0.5 rounded border border-gold-200">
          {row.course_code}
        </span>
      ),
    },
    {
      header: 'Mode',
      accessor: 'mode',
      cell: (row) => (
        <span className={`text-xs font-semibold ${row.mode === 'ONLINE' ? 'text-blue-600' : 'text-purple-600'}`}>
          {row.mode}
        </span>
      ),
    },
    {
      header: 'Total Fee',
      accessor: 'total_fee',
      cell: (row) => (
        <span className="font-semibold text-gray-800">
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
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 to-brand-700 p-6 rounded-2xl text-white shadow-soft-blue">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Sales & Admissions Desk</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Student Enrollment Registry</h1>
          <p className="text-xs text-brand-100 mt-1">Register new admissions, generate synchronized IDs under ScriptLock, and trigger after-sales tasks</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={UserPlus}
          onClick={() => setShowModal(true)}
        >
          Create New Admission
        </Button>
      </div>

      {/* Admissions Table */}
      <Card>
        <Table
          columns={columns}
          data={admissions}
          searchPlaceholder="Search student name, admission no, or mobile..."
          exportFileName="MLC_Admissions_List.csv"
          pageSize={8}
          emptyTitle="No Admissions Registered"
          emptyMessage="Click 'Create New Admission' above to enroll the first candidate."
        />
      </Card>

      {/* Create Admission Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Student Admission"
        subtitle="Auto-generates student login and queues After-Sales call"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Live ID Preview Chip */}
          <div className="p-3 bg-gradient-to-r from-gold-50 to-brand-50 border border-gold-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span className="text-xs font-bold text-brand-900">Live Admission ID Preview:</span>
            </div>
            <span className="font-mono text-sm font-black text-brand-900 bg-white px-3 py-1 rounded-lg border border-gold-400 shadow-sm">
              {previewNo}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammed Nihal"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                10-Digit Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9847123456"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Personal Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. student@gmail.com"
                value={formData.personal_email}
                onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Mode of Study
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-brand-900"
              >
                <option value="ONLINE">ONLINE (Virtual Classroom)</option>
                <option value="OFFLINE">OFFLINE (Campus Classroom)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Course Selection
              </label>
              <select
                value={formData.course_code}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-brand-900"
              >
                <option value="HRCA">HRCA (HR & Corporate Admin - 6 Modules)</option>
                <option value="BHA">BHA (Executive Hospital Admin - 13 Modules)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Agreed Total Course Fee (₹)
              </label>
              <input
                type="number"
                value={formData.total_fee}
                onChange={(e) => setFormData({ ...formData, total_fee: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-brand-900"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
            <p>✓ <strong>Auto-Login Creation:</strong> Student username & password will be set to their mobile & admission number.</p>
            <p>✓ <strong>Fee Structure:</strong> Initial ₹500 registration item created; balance ₹2,450 + 4 installments generated upon batch start.</p>
            <p>✓ <strong>Operations Task:</strong> Immediately creates high-priority "After-sales call" for Ops Exec.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
              Confirm & Save Admission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
