import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  CalendarDays,
  PlusCircle,
  PlayCircle,
  Clock,
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [newSessionModal, setNewSessionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Batch Form
  const [batchForm, setBatchForm] = useState({
    batch_code: 'HRCA-B26-03',
    course_code: 'HRCA',
    name: 'HRCA Evening Intensive Batch',
    start_date: new Date().toISOString().substring(0, 10),
    mode: 'ONLINE',
    default_trainer_id: 'TR-101',
  });

  // New Session Form
  const [sessionForm, setSessionForm] = useState({
    module_code: 'M01',
    date: new Date().toISOString().substring(0, 10),
    start_time: '10:00',
    end_time: '12:00',
    hours: 2,
    audience: 'ALL',
    topics_covered_note: '',
  });

  const toast = useToast();

  const loadBatchesAndSessions = async () => {
    try {
      setLoading(true);
      const batchList = await apiCall('getBatchesList');
      setBatches(batchList || []);
      if (batchList && batchList.length) {
        const bId = selectedBatchId || batchList[0].id;
        setSelectedBatchId(bId);
      }
    } catch (err) {
      toast.error('Failed to load batch list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchesAndSessions();
  }, []);

  const handleStartBatch = async (batchId) => {
    if (!window.confirm('Commencing this batch will generate the ₹2,450 balance-registration item and 4 course installments for all enrolled students. Proceed?')) {
      return;
    }
    try {
      const res = await apiCall('startBatch', { batch_id: batchId });
      toast.success(`Batch commenced! Activated ${res.activated || 0} students and generated installment schedules.`);
      loadBatchesAndSessions();
    } catch (err) {
      toast.error(err.message || 'Failed to start batch.');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall('createClassSession', {
        batch_id: selectedBatchId,
        ...sessionForm,
      });
      toast.success('Timetable session scheduled and batch students notified.');
      setNewSessionModal(false);
      setSessionForm({
        module_code: 'M01',
        date: new Date().toISOString().substring(0, 10),
        start_time: '10:00',
        end_time: '12:00',
        hours: 2,
        audience: 'ALL',
        topics_covered_note: '',
      });
      loadBatchesAndSessions();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule session.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Academic Timetable Control</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">Batches & Session Schedules</h1>
          <p className="text-xs text-brand-100 mt-1">Cohort commencement, automated fee trigger, ALL vs BHA_ONLY audience routing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setNewSessionModal(true)}
          >
            Schedule Class Session
          </Button>
        </div>
      </div>

      {/* Cohort Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelectedBatchId(b.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              b.id === selectedBatchId
                ? 'bg-gradient-to-br from-brand-50 to-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
                : 'bg-white border-gray-200 hover:border-brand-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-brand-500">{b.batch_code}</span>
                <h4 className="font-poppins font-bold text-brand-900 text-sm mt-0.5">{b.name}</h4>
              </div>
              <StatusBadge status={b.status} />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Start Date</span>
                <strong>{b.start_date || 'TBD'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Mode</span>
                <strong>{b.mode}</strong>
              </div>
            </div>

            {b.status !== 'ACTIVE' && (
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-4"
                icon={PlayCircle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartBatch(b.id);
                }}
              >
                Commence & Start Batch
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Selected Batch Sessions Timetable Calendar */}
      <Card
        title={`Timetable Schedule: ${activeBatch?.name || 'Active Batch'}`}
        subtitle="Manage upcoming class sessions, audience filters, and topics"
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setNewSessionModal(true)}
          >
            Add Session
          </Button>
        }
      >
        <div className="space-y-3">
          {[
            {
              id: 'ses-1',
              module_code: 'M01',
              title: 'Ice Breaking & Public Speaking',
              date: '2026-02-05',
              time: '10:00 - 12:00 (2 hrs)',
              audience: 'ALL',
              trainer: 'Vajid Trainer',
              status: 'DONE',
              topics_note: 'Covered speech structures, confidence exercises, and elevator pitches.',
            },
            {
              id: 'ses-2',
              module_code: 'M01',
              title: 'Gen AI & Career Clarity',
              date: '2026-02-06',
              time: '10:00 - 12:00 (2 hrs)',
              audience: 'ALL',
              trainer: 'Vajid Trainer',
              status: 'DONE',
              topics_note: 'Prompt engineering fundamentals and career mapping via LLMs.',
            },
            {
              id: 'ses-3',
              module_code: 'M02',
              title: 'Gen AI for Business & Administration',
              date: '2026-02-07',
              time: '10:00 - 14:00 (4 hrs)',
              audience: 'ALL',
              trainer: 'Vajid Trainer',
              status: 'DONE',
              topics_note: 'Executive summarization, automated drafting, meeting minutes processing.',
            },
            {
              id: 'ses-4',
              module_code: 'HA1',
              title: 'Introduction to Healthcare Ecosystem & Structure',
              date: '2026-02-08',
              time: '15:00 - 17:00 (2 hrs)',
              audience: 'BHA_ONLY',
              trainer: 'Dr. Anoop Nair',
              status: 'DONE',
              topics_note: 'Clinical departments, hospital hierarchy, NABH standards introduction.',
            },
            {
              id: 'ses-5',
              module_code: 'M02',
              title: 'Google Workspace for Business',
              date: '2026-02-12',
              time: '10:00 - 12:00 (2 hrs)',
              audience: 'ALL',
              trainer: 'Zahadh / Rasheed',
              status: 'PLANNED',
              topics_note: 'Collaborative docs, Google Sheets automation, calendar scheduling.',
            },
          ].map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-brand-900 text-gold-400 px-2 py-0.5 rounded font-mono">
                      {sess.module_code}
                    </span>
                    <h5 className="font-poppins font-semibold text-sm text-brand-900">{sess.title}</h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        sess.audience === 'BHA_ONLY'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-brand-700 border-brand-200'
                      }`}
                    >
                      {sess.audience === 'BHA_ONLY' ? '★ BHA ONLY' : 'ALL STUDENTS'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {sess.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {sess.time}</span>
                    <span>Trainer: <strong>{sess.trainer}</strong></span>
                  </p>
                  {sess.topics_note && (
                    <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-2 rounded border border-gray-100 italic">
                      " {sess.topics_note} "
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <StatusBadge status={sess.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Schedule Session Modal */}
      <Modal
        isOpen={newSessionModal}
        onClose={() => setNewSessionModal(false)}
        title="Schedule Timetable Session"
        subtitle={`Cohort: ${activeBatch?.name}`}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Curriculum Module
              </label>
              <select
                value={sessionForm.module_code}
                onChange={(e) => setSessionForm({ ...sessionForm, module_code: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-semibold text-brand-900"
              >
                <option value="M01">M01 - Future Career Foundation</option>
                <option value="M02">M02 - Business Technology Skills</option>
                <option value="M03">M03 - Corporate Administration & Management</option>
                <option value="M04">M04 - Modern HR Management with AI</option>
                <option value="M05">M05 - Sales & CRM</option>
                <option value="M06">M06 - Professional English & Interview Vocabulary</option>
                <option value="HA1">HA1 - Healthcare Management (BHA)</option>
                <option value="HA2">HA2 - Hospital Departments (BHA)</option>
                <option value="HA3">HA3 - Patient Relations (BHA)</option>
                <option value="HA4">HA4 - Healthcare Operations (BHA)</option>
                <option value="HA5">HA5 - BMW & Facility Safety (BHA)</option>
                <option value="HA6">HA6 - Quality & NABH in Healthcare (BHA)</option>
                <option value="HA7">HA7 - Insurance & Hospital Billing (BHA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Target Audience Routing
              </label>
              <select
                value={sessionForm.audience}
                onChange={(e) => setSessionForm({ ...sessionForm, audience: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-bold text-brand-900"
              >
                <option value="ALL">ALL Cohort Students (HRCA & BHA)</option>
                <option value="BHA_ONLY">BHA ONLY (Healthcare Admin Specific)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Session Date
              </label>
              <input
                type="date"
                required
                value={sessionForm.date}
                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={sessionForm.start_time}
                onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                End Time
              </label>
              <input
                type="time"
                value={sessionForm.end_time}
                onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Topic Notes / Agenda
            </label>
            <input
              type="text"
              placeholder="e.g. Hands-on practical simulation on Excel & AI prompts"
              value={sessionForm.topics_covered_note}
              onChange={(e) => setSessionForm({ ...sessionForm, topics_covered_note: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setNewSessionModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Schedule & Notify Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
