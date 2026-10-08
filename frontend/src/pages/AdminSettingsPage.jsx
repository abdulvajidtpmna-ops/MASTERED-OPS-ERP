import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  Settings,
  Users,
  KeyRound,
  BookOpen,
  Sliders,
  Mail,
  FileCheck2,
  Lock,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('USERS'); // USERS | NOTES | GRADE_BANDS | FEE_DEFAULTS | LISTS | TEMPLATES | AUDIT
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    module_code: 'M01',
    title: '',
    file_type: 'PDF',
    file_url: '',
  });

  const toast = useToast();

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [uList, logs, nList] = await Promise.all([
        apiCall('getUsersList'),
        apiCall('getAuditLogs'),
        apiCall('getAccessibleNotes'),
      ]);
      setUsers(uList || []);
      setAuditLogs(logs || []);
      setNotes(nList?.notes || []);
    } catch (err) {
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      await apiCall('saveNote', noteForm);
      toast.success('Study material added to centralized library!');
      setNoteModalOpen(false);
      setNoteForm({ module_code: 'M01', title: '', file_type: 'PDF', file_url: '' });
      loadSettingsData();
    } catch (err) {
      toast.error('Failed to save note.');
    }
  };

  const userCols = [
    { header: 'Full Name', accessor: 'full_name' },
    { header: 'Username / Email', accessor: 'email' },
    { header: 'Role', accessor: 'role', cell: (r) => <span className="font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">{r.role}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Trainer ID', accessor: 'trainer_id', cell: (r) => r.trainer_id ? <span className="font-mono text-xs font-bold text-gold-600">{r.trainer_id}</span> : '—' },
  ];

  const logCols = [
    { header: 'Action', accessor: 'action', cell: (r) => <span className="font-mono text-xs font-bold text-brand-900">{r.action}</span> },
    { header: 'Entity', accessor: 'entity' },
    { header: 'Entity ID', accessor: 'entity_id', cell: (r) => <span className="font-mono text-[11px] text-gray-500">{r.entity_id}</span> },
    { header: 'Details', accessor: 'details' },
    { header: 'Actor Role', accessor: 'actor_role' },
    { header: 'Timestamp', accessor: 'created_at', cell: (r) => new Date(r.created_at || Date.now()).toLocaleString('en-IN') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Main Admin Master Configuration</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Institute ERP Settings & Governance</h1>
          <p className="text-xs text-brand-100 mt-1">System user roles, notes library, grade bands, fee defaults, email templates, and immutable audit logs</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'USERS' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4 text-gold-400" />
          Users & Trainer IDs
        </button>
        <button
          onClick={() => setActiveTab('NOTES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'NOTES' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-gold-400" />
          Notes Library
        </button>
        <button
          onClick={() => setActiveTab('GRADE_BANDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'GRADE_BANDS' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-gold-400" />
          Grade Bands & Fees
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'TEMPLATES' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Mail className="w-4 h-4 text-gold-400" />
          Email Templates
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'AUDIT' ? 'bg-brand-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-gold-400" />
          System Audit Log
        </button>
      </div>

      {/* 1. USERS & TRAINER IDS */}
      {activeTab === 'USERS' && (
        <Card title="System Users & Faculty Credentials" subtitle="Manage accounts, trainer IDs, and role assignments">
          <Table
            columns={userCols}
            data={users}
            searchPlaceholder="Search users by name, email, or role..."
            exportFileName="MLC_Users_List.csv"
            pageSize={10}
          />
        </Card>
      )}

      {/* 2. NOTES LIBRARY */}
      {activeTab === 'NOTES' && (
        <Card
          title="Central Study Materials Repository"
          subtitle="Upload and maintain study guidebooks for curriculum modules"
          action={
            <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setNoteModalOpen(true)}>
              Upload Study Material
            </Button>
          }
        >
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-brand-700 shrink-0" />
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-500">{n.module_code}</span>
                    <h5 className="font-semibold text-xs text-brand-900">{n.title}</h5>
                    <p className="text-[11px] text-gray-500 font-mono truncate max-w-md">{n.file_url}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. GRADE BANDS & FEE DEFAULTS */}
      {activeTab === 'GRADE_BANDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Grade Thresholds" subtitle="Letter grade score cutoffs">
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gold-50 rounded-xl border border-gold-200 flex justify-between font-bold text-brand-900">
                <span>Grade A (Distinction)</span>
                <span>≥ 90%</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between font-bold text-brand-900">
                <span>Grade B (Excellent)</span>
                <span>80% – 89.9%</span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex justify-between font-bold text-brand-900">
                <span>Grade C (Good)</span>
                <span>65% – 79.9%</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between font-bold text-brand-900">
                <span>Grade D (Pass)</span>
                <span>50% – 64.9%</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between font-bold text-brand-900">
                <span>Grade F (Needs Improvement)</span>
                <span>&lt; 50%</span>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl border border-gray-200 flex justify-between font-bold text-gray-700">
                <span>Grade E (Absent)</span>
                <span>Absent from Evaluation</span>
              </div>
            </div>
          </Card>

          <Card title="Fee Schedule Defaults" subtitle="Core payment and installment policy configuration">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between">
                <span className="text-gray-600 font-semibold">Registration Fee</span>
                <strong className="text-brand-900">₹500</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between">
                <span className="text-gray-600 font-semibold">Balance Registration Fee (Due on Start)</span>
                <strong className="text-brand-900">₹2,450</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between">
                <span className="text-gray-600 font-semibold">Number of Course Installments</span>
                <strong className="text-brand-900">4 Installments</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between">
                <span className="text-gray-600 font-semibold">1st Installment Due Offset</span>
                <strong className="text-brand-900">+7 Days from Start</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between">
                <span className="text-gray-600 font-semibold">Subsequent Installments Gap</span>
                <strong className="text-brand-900">30 Days</strong>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between">
                <span className="text-gray-600 font-semibold">Placement Eligibility Threshold</span>
                <strong className="text-emerald-700">85% Attendance</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. EMAIL TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <Card title="Branded Email Templates" subtitle="Exact server-side email format preview">
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/40">
              <h5 className="font-poppins font-bold text-sm text-brand-900 mb-2">
                1. Recruiter Interview Call Letter Template
              </h5>
              <pre className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs text-brand-900 overflow-x-auto leading-relaxed">
{`Company: {{COMPANY}}
Position: {{POSITION}}
Location: {{LOCATION}}
Interview Date: {{INTERVIEW_DATE}}
Interview Time: {{INTERVIEW_TIME}}`}
              </pre>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <h5 className="font-poppins font-bold text-sm text-emerald-900 mb-2">
                2. Job Offer Congratulations Template
              </h5>
              <pre className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs text-emerald-900 overflow-x-auto leading-relaxed">
{`Company: {{COMPANY}}
Position: {{POSITION}}
Location: {{LOCATION}}
Offer Date: {{OFFER_DATE}}
Joining Date: {{JOINING_DATE}}`}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* 5. AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <Card title="System Audit Trail" subtitle="Immutable operational and security log">
          <Table
            columns={logCols}
            data={auditLogs}
            searchPlaceholder="Search audit actions, entities, or actors..."
            exportFileName="MLC_System_Audit_Log.csv"
            pageSize={10}
          />
        </Card>
      )}

      {/* Upload Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Add Study Material to Repository"
        subtitle="Will be available for trainers to assign to active batches"
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Curriculum Module *
            </label>
            <select
              value={noteForm.module_code}
              onChange={(e) => setNoteForm({ ...noteForm, module_code: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
            >
              <option value="M01">M01 - Future Career Foundation</option>
              <option value="M02">M02 - Business Technology Skills</option>
              <option value="M03">M03 - Corporate Administration</option>
              <option value="M04">M04 - Modern HR Management with AI</option>
              <option value="M05">M05 - Sales & CRM</option>
              <option value="M06">M06 - Professional English</option>
              <option value="HA1">HA1 - Foundations of Healthcare Management</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mastered AI Prompts & SOP Guidebook"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              File / Drive URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/..."
              value={noteForm.file_url}
              onChange={(e) => setNoteForm({ ...noteForm, file_url: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Upload & Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
