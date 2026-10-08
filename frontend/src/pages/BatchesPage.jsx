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
  FileText,
  Edit3,
  Trash2,
  ExternalLink,
  Save,
  Zap,
  GraduationCap,
  Layers,
  Sparkles,
} from 'lucide-react';

export function BatchesPage() {
  const [activeTab, setActiveTab] = useState('DAILY_PLANNER'); // DAILY_PLANNER | NOTES_LIBRARY | BATCH_LIST
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Daily Timetable Planner (Tomorrow) State
  const tomorrowDefault = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
  const [targetDate, setTargetDate] = useState(tomorrowDefault);
  const [dailyBatchPlans, setDailyBatchPlans] = useState({});

  // 2. Module Notes & Study Materials State
  const [notesList, setNotesList] = useState([]);
  const [noteAssignments, setNoteAssignments] = useState([]);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    module_code: 'M01',
    title: '',
    file_type: 'PDF',
    file_url: '',
    description: '',
    assigned_trainer_id: 'TR-101',
    batch_id: '',
  });

  // 3. New Batch Modal
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batch_code: 'HRCA-B26-03',
    course_code: 'HRCA',
    name: 'HRCA Evening Intensive Batch',
    start_date: new Date().toISOString().substring(0, 10),
    mode: 'ONLINE',
    default_trainer_id: 'TR-101',
  });

  // Standard Modules List
  const modulesList = [
    { code: 'M01', name: 'Future Career Foundation & Ice Breaking' },
    { code: 'M02', name: 'Business Technology Skills & Gen AI' },
    { code: 'M03', name: 'Corporate Administration & Management' },
    { code: 'M04', name: 'Modern HR Management with AI' },
    { code: 'M05', name: 'Sales & Customer Relationship Management' },
    { code: 'M06', name: 'Professional English & Interview Vocabulary' },
    { code: 'HA1', name: 'Foundations of Healthcare Management (BHA)' },
    { code: 'HA2', name: 'Hospital Departments & Clinical Services (BHA)' },
    { code: 'HA3', name: 'Hospital Patient Relations & Service (BHA)' },
    { code: 'HA4', name: 'Healthcare Operations & Workflow (BHA)' },
    { code: 'HA5', name: 'Bio-Medical Waste & Facility Safety (BHA)' },
    { code: 'HA6', name: 'Quality Management & NABH Standards (BHA)' },
    { code: 'HA7', name: 'Insurance & Hospital Billing Systems (BHA)' },
  ];

  // Standard Faculty / Trainers List
  const trainersList = [
    { id: 'TR-101', name: 'Vajid Trainer (Lead Corporate & AI Trainer)' },
    { id: 'TR-102', name: 'Dr. Anoop Nair (Healthcare Academic Head)' },
    { id: 'TR-103', name: 'Zahadh (Business Systems Trainer)' },
    { id: 'TR-104', name: 'Rasheed (HR & Operations Trainer)' },
  ];

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchList, notesData] = await Promise.all([
        apiCall('getBatchesList'),
        apiCall('getAccessibleNotes'),
      ]);

      const bList = batchList || [];
      setBatches(bList);
      if (bList.length && !selectedBatchId) {
        setSelectedBatchId(bList[0].id);
      }

      setNotesList(notesData?.notes || []);
      setNoteAssignments(notesData?.assignments || []);

      // Initialize daily plans for active batches (2-Hour session default)
      const initialPlans = {};
      bList.forEach((b) => {
        initialPlans[b.id] = {
          batch_id: b.id,
          batch_name: b.name,
          batch_code: b.batch_code,
          is_active: b.status === 'ACTIVE',
          module_code: b.course_code === 'BHA' ? 'HA1' : 'M01',
          trainer_id: b.default_trainer_id || 'TR-101',
          start_time: '10:00',
          end_time: '12:00',
          hours: 2, // Standard 2-hour daily session
          audience: 'ALL',
          topics_covered_note: 'Daily live interactive lecture and hands-on case practicals.',
          status: 'PLANNED',
        };
      });
      setDailyBatchPlans(initialPlans);
    } catch (err) {
      console.error('Batches load error:', err);
      toast.error('Failed to load batches and timetable data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update a single batch daily plan field
  const handlePlanChange = (batchId, field, value) => {
    setDailyBatchPlans((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [field]: value,
      },
    }));
  };

  // ONE-BUTTON UPDATE ALL ACTIVE BATCHES FOR TOMORROW
  const handleUpdateAllBatchTimetables = async () => {
    setSubmitting(true);
    try {
      const entries = Object.values(dailyBatchPlans).filter((p) => p.is_active);

      if (!entries.length) {
        toast.error('No active batches selected for scheduling.');
        setSubmitting(false);
        return;
      }

      await apiCall('bulkSaveDailyTimetable', {
        date: targetDate,
        entries,
      });

      toast.success(`Successfully published and updated 2-hour daily timetables for ${entries.length} active batches on ${targetDate}! Batch students have been notified.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update daily timetables.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add Note Modal
  const handleOpenAddNote = () => {
    setEditingNote(null);
    setNoteForm({
      module_code: 'M01',
      title: '',
      file_type: 'PDF',
      file_url: '',
      description: '',
      assigned_trainer_id: 'TR-101',
      batch_id: selectedBatchId || (batches.length ? batches[0].id : ''),
    });
    setNoteModalOpen(true);
  };

  // Open Edit Note Modal
  const handleOpenEditNote = (note) => {
    setEditingNote(note);
    const existingAssign = noteAssignments.find((a) => a.note_id === note.id);
    setNoteForm({
      id: note.id,
      module_code: note.module_code || 'M01',
      title: note.title || '',
      file_type: note.file_type || 'PDF',
      file_url: note.file_url || '',
      description: note.description || '',
      assigned_trainer_id: note.assigned_trainer_id || 'TR-101',
      batch_id: existingAssign ? existingAssign.batch_id : '',
    });
    setNoteModalOpen(true);
  };

  // Save Note (Create or Edit)
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.file_url) {
      toast.error('Please enter Note Title and File URL (PDF or Doc link).');
      return;
    }
    setSubmitting(true);
    try {
      await apiCall('saveNote', {
        ...noteForm,
        id: editingNote ? editingNote.id : undefined,
      });
      toast.success(editingNote ? 'Study note updated successfully!' : 'New study material added and assigned to batch!');
      setNoteModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save note.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this study note from the library?')) return;
    try {
      await apiCall('deleteNote', { note_id: noteId });
      toast.success('Study note removed from library.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete note.');
    }
  };

  // Assign Note to Batch
  const handleQuickAssignNote = async (noteId, batchId) => {
    try {
      await apiCall('assignNoteToBatch', { note_id: noteId, batch_id: batchId });
      toast.success('Study note assigned to selected batch! Students can now access it.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign note.');
    }
  };

  // Start / Commence Batch
  const handleStartBatch = async (batchId) => {
    if (!window.confirm('Commencing this batch will generate the ₹2,450 balance-registration item and 4 course installments for all enrolled students. Proceed?')) {
      return;
    }
    try {
      const res = await apiCall('startBatch', { batch_id: batchId });
      toast.success(`Batch commenced! Activated ${res.activated || 0} students and generated installment schedules.`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to start batch.');
    }
  };

  const filteredNotes = notesList.filter((n) =>
    selectedModuleFilter === 'ALL' ? true : n.module_code === selectedModuleFilter
  );

  const activeBatchesCount = batches.filter((b) => b.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">
            Academic Operations & Timetable Center
          </span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">
            Batches, Daily Timetable & Study Notes
          </h1>
          <p className="text-xs text-brand-100 mt-1">
            Mark daily 2-hour timetable sessions for all active batches in one click, track covered syllabus topics, and manage Doc/PDF notes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'DAILY_PLANNER' && (
            <Button
              variant="primary"
              size="md"
              icon={Save}
              loading={submitting}
              onClick={handleUpdateAllBatchTimetables}
            >
              Update All Batches ({activeBatchesCount})
            </Button>
          )}
          {activeTab === 'NOTES_LIBRARY' && (
            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
              onClick={handleOpenAddNote}
            >
              Add Module Note (Doc/PDF)
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DAILY_PLANNER')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DAILY_PLANNER'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Zap className="w-4 h-4 text-gold-400" />
          ⚡ Tomorrow's Daily Timetable Planner (One-Click)
        </button>
        <button
          onClick={() => setActiveTab('NOTES_LIBRARY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'NOTES_LIBRARY'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText className="w-4 h-4 text-gold-400" />
          📚 Module Notes & Study Materials (Doc/PDF)
        </button>
        <button
          onClick={() => setActiveTab('BATCH_LIST')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BATCH_LIST'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4 text-gold-400" />
          🎓 All Batches & Cohorts Management
        </button>
      </div>

      {/* =========================================================================
          TAB 1: TOMORROW'S DAILY TIMETABLE PLANNER (ONE PAGE & ONE BUTTON UPDATE ALL)
          ========================================================================= */}
      {activeTab === 'DAILY_PLANNER' && (
        <div className="space-y-4">
          {/* Target Date Header & Control Bar */}
          <div className="p-4 bg-white rounded-2xl border-2 border-brand-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gold-50 text-gold-700 rounded-xl border border-gold-200">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Select Target Schedule Date
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="p-1.5 text-xs font-bold text-brand-900 bg-gray-50 border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetDate(tomorrowDefault)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      targetDate === tomorrowDefault
                        ? 'bg-brand-900 text-white border-brand-900'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate(new Date().toISOString().substring(0, 10))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Prominent One-Click Save Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={Save}
                loading={submitting}
                onClick={handleUpdateAllBatchTimetables}
                className="w-full sm:w-auto shadow-md"
              >
                💾 Save & Update All Tomorrow Schedules
              </Button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                <strong>Standard 2.0 Hours Day Session:</strong> Configure the curriculum module, assigned trainer, and topics to cover for each active batch. Click the <strong>"Save & Update All"</strong> button to broadcast the schedule to students and record covered topic logs.
              </span>
            </div>
          </div>

          {/* All Batches Daily Timetable Grid / Table */}
          <div className="space-y-4">
            {batches.map((batch) => {
              const plan = dailyBatchPlans[batch.id] || {
                batch_id: batch.id,
                is_active: batch.status === 'ACTIVE',
                module_code: 'M01',
                trainer_id: batch.default_trainer_id || 'TR-101',
                start_time: '10:00',
                end_time: '12:00',
                hours: 2,
                audience: 'ALL',
                topics_covered_note: '',
              };

              const isActive = plan.is_active;

              return (
                <div
                  key={batch.id}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    isActive
                      ? 'bg-white border-brand-500/40 shadow-sm'
                      : 'bg-gray-50/70 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`check-${batch.id}`}
                        checked={isActive}
                        onChange={(e) => handlePlanChange(batch.id, 'is_active', e.target.checked)}
                        className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-brand-900 text-gold-400 px-2 py-0.5 rounded">
                            {batch.batch_code}
                          </span>
                          <h4 className="font-poppins font-bold text-brand-900 text-base">
                            {batch.name}
                          </h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-brand-700 border border-brand-200">
                            {batch.course_code} ({batch.mode})
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Status: <strong>{batch.status}</strong> • Default Trainer: <strong>{batch.default_trainer_id || 'TR-101'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 bg-gold-50 text-gold-800 rounded-lg border border-gold-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 2.0 Hours Daily Session
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
                      {/* 1. Module Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          1. Curriculum Module
                        </label>
                        <select
                          value={plan.module_code}
                          onChange={(e) => handlePlanChange(batch.id, 'module_code', e.target.value)}
                          className="w-full p-2.5 text-xs font-bold text-brand-900 bg-white border border-brand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                        >
                          {modulesList.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.code} — {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Trainer Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          2. Assigned Trainer
                        </label>
                        <select
                          value={plan.trainer_id}
                          onChange={(e) => handlePlanChange(batch.id, 'trainer_id', e.target.value)}
                          className="w-full p-2.5 text-xs font-bold text-brand-900 bg-white border border-brand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                        >
                          {trainersList.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Session Timing (2 Hours) */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          3. Session Time (2.0 Hrs)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={plan.start_time}
                            onChange={(e) => handlePlanChange(batch.id, 'start_time', e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-gray-300 rounded-xl font-mono font-bold text-brand-900"
                          />
                          <span className="text-gray-400 font-bold">➔</span>
                          <input
                            type="time"
                            value={plan.end_time}
                            onChange={(e) => handlePlanChange(batch.id, 'end_time', e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-gray-300 rounded-xl font-mono font-bold text-brand-900"
                          />
                        </div>
                      </div>

                      {/* 4. Audience Filter */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          4. Audience Routing
                        </label>
                        <select
                          value={plan.audience}
                          onChange={(e) => handlePlanChange(batch.id, 'audience', e.target.value)}
                          className="w-full p-2.5 text-xs font-bold text-brand-900 bg-white border border-gray-300 rounded-xl focus:outline-none"
                        >
                          <option value="ALL">ALL Students (HRCA & BHA)</option>
                          <option value="BHA_ONLY">BHA ONLY (Healthcare Admin Specific)</option>
                        </select>
                      </div>

                      {/* 5. Topic / Covered Topic Tracking */}
                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          5. Topic to Cover / Syllabus Progress Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hands-on Excel macro automation, prompt engineering workflows, and interview drills"
                          value={plan.topics_covered_note}
                          onChange={(e) => handlePlanChange(batch.id, 'topics_covered_note', e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-brand-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action Card */}
          <div className="p-5 bg-gradient-to-r from-brand-900 to-brand-700 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft-blue">
            <div>
              <h4 className="font-poppins font-bold text-base">Ready to broadcast tomorrow's schedules?</h4>
              <p className="text-xs text-brand-100 mt-0.5">
                Clicking the button updates all batch timetables, sends student notifications, and records covered topic syllabus logs.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={Save}
              loading={submitting}
              onClick={handleUpdateAllBatchTimetables}
              className="shadow-gold-glow"
            >
              Update All Batch Timetables
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MODULE NOTES & STUDY MATERIALS LIBRARY (DOCS & PDFS)
          ========================================================================= */}
      {activeTab === 'NOTES_LIBRARY' && (
        <div className="space-y-4">
          {/* Header & Filter Bar */}
          <Card
            title="Course Module Notes & Study Materials Library"
            subtitle="Upload, edit, and assign Doc & PDF notes to trainers and active batches"
            action={
              <Button variant="primary" size="sm" icon={PlusCircle} onClick={handleOpenAddNote}>
                Add Note (Doc/PDF)
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Filter by Module */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Filter:</span>
                <button
                  onClick={() => setSelectedModuleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedModuleFilter === 'ALL'
                      ? 'bg-brand-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Modules
                </button>
                {modulesList.map((m) => (
                  <button
                    key={m.code}
                    onClick={() => setSelectedModuleFilter(m.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedModuleFilter === m.code
                        ? 'bg-brand-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {m.code}
                  </button>
                ))}
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => {
                  const assignedBatches = noteAssignments
                    .filter((a) => a.note_id === note.id)
                    .map((a) => batches.find((b) => b.id === a.batch_id)?.batch_code || a.batch_id);

                  return (
                    <div
                      key={note.id}
                      className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-brand-400 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-xs bg-brand-900 text-gold-400 px-2 py-0.5 rounded">
                            {note.module_code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              note.file_type === 'PDF'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : note.file_type === 'DOC'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {note.file_type || 'PDF'}
                          </span>
                        </div>

                        <h4 className="font-poppins font-bold text-brand-900 text-sm leading-snug">
                          {note.title}
                        </h4>

                        {note.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {note.description}
                          </p>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] space-y-1">
                          <p className="text-gray-600">
                            Assigned Trainer: <strong>{note.assigned_trainer_id || 'TR-101'}</strong>
                          </p>
                          <p className="text-gray-600">
                            Assigned Batches:{' '}
                            {assignedBatches.length > 0 ? (
                              <strong className="text-emerald-700">{assignedBatches.join(', ')}</strong>
                            ) : (
                              <span className="text-amber-600 italic">Not yet assigned to any batch</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={note.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="Open Note Link / PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenEditNote(note)}
                            className="p-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="Edit Note"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleQuickAssignNote(note.id, e.target.value);
                            }}
                            defaultValue=""
                            className="text-[11px] p-1 bg-brand-50 border border-brand-200 text-brand-900 rounded-lg font-semibold"
                          >
                            <option value="" disabled>+ Assign to Cohort</option>
                            {batches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.batch_code}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredNotes.length === 0 && (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-semibold">No study notes found for the selected module filter.</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={handleOpenAddNote}>
                    Add First Note
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ALL BATCHES & COHORTS DETAILS
          ========================================================================= */}
      {activeTab === 'BATCH_LIST' && (
        <div className="space-y-6">
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
                    <span className="text-[10px] text-gray-400 block uppercase font-semibold">Start Date</span>
                    <strong>{b.start_date || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-semibold">Mode</span>
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
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT MODULE NOTE (DOC OR PDF)
          ========================================================================= */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNote ? 'Edit Study Material / Module Note' : 'Add New Module Note (Doc / PDF)'}
        subtitle="Manage centralized curriculum resources and assign to trainers & cohorts"
      >
        <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Curriculum Module
              </label>
              <select
                value={noteForm.module_code}
                onChange={(e) => setNoteForm({ ...noteForm, module_code: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
              >
                {modulesList.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                File Type / Format
              </label>
              <select
                value={noteForm.file_type}
                onChange={(e) => setNoteForm({ ...noteForm, file_type: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
              >
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="DOC">Google Doc / Word Document (.doc, .docx)</option>
                <option value="LINK">Drive / Web Resource Link</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Note Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gen AI Prompts & Business Workflows Cheatsheet"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Doc / PDF File URL (Google Drive / Direct Link)
            </label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/file/d/... or https://mastered.in/notes/m01.pdf"
              value={noteForm.file_url}
              onChange={(e) => setNoteForm({ ...noteForm, file_url: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-mono text-brand-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Assigned Trainer
              </label>
              <select
                value={noteForm.assigned_trainer_id}
                onChange={(e) => setNoteForm({ ...noteForm, assigned_trainer_id: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
              >
                {trainersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Assign to Batch Cohort
              </label>
              <select
                value={noteForm.batch_id}
                onChange={(e) => setNoteForm({ ...noteForm, batch_id: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
              >
                <option value="">-- All / Library Only --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.batch_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description / Study Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Read before Tuesday practical session. Contains 5 prompt templates and checklist."
              value={noteForm.description}
              onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-brand-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              {editingNote ? 'Save Changes' : 'Add Note & Assign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
