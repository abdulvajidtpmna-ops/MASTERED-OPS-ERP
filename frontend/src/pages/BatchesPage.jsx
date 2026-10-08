import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  History,
  CalendarX,
  Lock,
} from 'lucide-react';

export function BatchesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('BATCH_LIST'); // BATCH_LIST | NOTES_LIBRARY
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Module Notes & Study Materials State
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

  // 2. Create Batch Modal
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: 'BH21',
    slot: '10:30 AM',
    start_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    course_code: 'HRCA',
    mode: 'ONLINE',
    default_trainer_id: 'TR-101',
  });
  const [nameError, setNameError] = useState('');

  // 3. Postpone Start Date Modal
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [selectedBatchForPostpone, setSelectedBatchForPostpone] = useState(null);
  const [postponeData, setPostponeData] = useState({
    new_start_date: '',
    reason: '',
  });

  // 4. Edit Batch Modal
  const [editBatchModalOpen, setEditBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editBatchForm, setEditBatchForm] = useState({
    name: '',
    slot: '10:30 AM',
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
    } catch (err) {
      console.error('Batches load error:', err);
      toast.error('Failed to load batches data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Validate BH format in real-time
  const handleBatchNameChange = (val) => {
    const upper = val.toUpperCase();
    setBatchForm((prev) => ({ ...prev, name: upper }));
    if (!upper) {
      setNameError('Batch name is required');
    } else if (!/^BH\d+$/.test(upper)) {
      setNameError("Must strictly follow format 'BH' + number (e.g. BH17, BH19, BH20)");
    } else if (batches.some((b) => b.name === upper || b.batch_code === upper)) {
      setNameError(`A batch named '${upper}' already exists`);
    } else {
      setNameError('');
    }
  };

  // 1. Create Batch Submit
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!/^BH\d+$/.test(batchForm.name)) {
      toast.error("Batch name must strictly follow format 'BH' + number (e.g. BH17, BH19).");
      return;
    }
    if (!['8:30 AM', '10:30 AM', '12:30 PM'].includes(batchForm.slot)) {
      toast.error("Please select a valid time slot ('8:30 AM', '10:30 AM', or '12:30 PM').");
      return;
    }
    if (!batchForm.start_date) {
      toast.error('Please select a start date.');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('createBatch', {
        name: batchForm.name,
        slot: batchForm.slot,
        start_date: batchForm.start_date,
        course_code: batchForm.course_code,
        mode: batchForm.mode,
        default_trainer_id: batchForm.default_trainer_id,
      });

      toast.success(`Batch ${batchForm.name} created successfully (${batchForm.slot})!`);
      setCreateBatchModalOpen(false);
      setBatchForm({
        name: 'BH22',
        slot: '10:30 AM',
        start_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
        course_code: 'HRCA',
        mode: 'ONLINE',
        default_trainer_id: 'TR-101',
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create batch.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Open Postpone Modal
  const handleOpenPostpone = (batch) => {
    setSelectedBatchForPostpone(batch);
    setPostponeData({
      new_start_date: batch.start_date || '',
      reason: '',
    });
    setPostponeModalOpen(true);
  };

  // Postpone Submit
  const handlePostponeSubmit = async (e) => {
    e.preventDefault();
    if (!postponeData.new_start_date || !postponeData.reason.trim()) {
      toast.error('Please provide a new start date and reason.');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('postponeBatchStartDate', {
        batch_id: selectedBatchForPostpone.id,
        new_start_date: postponeData.new_start_date,
        reason: postponeData.reason.trim(),
      });

      toast.success(`Start date for ${selectedBatchForPostpone.name} moved to ${postponeData.new_start_date}. Assigned students notified.`);
      setPostponeModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to postpone start date.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Open Edit Batch Modal
  const handleOpenEditBatch = (batch) => {
    setEditingBatch(batch);
    setEditBatchForm({
      name: batch.name || batch.batch_code,
      slot: batch.slot || '10:30 AM',
      default_trainer_id: batch.default_trainer_id || 'TR-101',
    });
    setEditBatchModalOpen(true);
  };

  const handleEditBatchSubmit = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;

    if (!/^BH\d+$/.test(editBatchForm.name)) {
      toast.error("Batch name must strictly follow format 'BH' + number.");
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('updateBatch', {
        batch_id: editingBatch.id,
        name: editBatchForm.name,
        slot: editBatchForm.slot,
        default_trainer_id: editBatchForm.default_trainer_id,
      });

      toast.success(`Batch ${editBatchForm.name} updated successfully.`);
      setEditBatchModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update batch.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Notes management
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

  const handleQuickAssignNote = async (noteId, batchId) => {
    try {
      await apiCall('assignNoteToBatch', { note_id: noteId, batch_id: batchId });
      toast.success('Study note assigned to selected batch! Students can now access it.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign note.');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">
            Academic Cohorts & Notes Center
          </span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">
            Batches Management & Study Notes
          </h1>
          <p className="text-xs text-brand-100 mt-1">
            Create BH-standard batches with specific slots, manage start date postponements, and distribute Doc/PDF study notes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setCreateBatchModalOpen(true)}
          >
            Create Batch
          </Button>
          {activeTab === 'NOTES_LIBRARY' && (
            <Button
              variant="secondary"
              size="md"
              icon={PlusCircle}
              onClick={handleOpenAddNote}
            >
              Add Note (Doc/PDF)
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('BATCH_LIST')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BATCH_LIST'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4 text-gold-400" />
          🎓 All Batches & Cohorts ({batches.length})
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
      </div>

      {/* =========================================================================
          TAB 1: ALL BATCHES & COHORTS DETAILS
          ========================================================================= */}
      {activeTab === 'BATCH_LIST' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((b) => {
              let historyList = [];
              try {
                historyList = JSON.parse(b.start_date_history_json || '[]');
              } catch (e) {
                historyList = [];
              }

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    b.id === selectedBatchId
                      ? 'bg-gradient-to-br from-brand-50 to-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
                      : 'bg-white border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-brand-900 bg-gold-50 text-gold-800 px-2 py-0.5 rounded border border-gold-300">
                          {b.name || b.batch_code}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-brand-700 border border-brand-200">
                            Slot: {b.slot || '10:30 AM'}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {b.mode}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Start Date</span>
                        <strong className="text-brand-900">{b.start_date || 'TBD'}</strong>
                        {b.original_start_date && b.original_start_date !== b.start_date && (
                          <span className="block text-[10px] text-amber-600">
                            (Orig: {b.original_start_date})
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Default Trainer</span>
                        <strong className="truncate block">{b.default_trainer_id || 'TR-101'}</strong>
                      </div>
                    </div>

                    {/* Postponement History Badge */}
                    {historyList.length > 0 && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <History className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Postponed ({historyList.length}x):</strong> Last moved to {historyList[historyList.length - 1].new_date}
                          <p className="text-[10px] text-amber-800 italic mt-0.5">"{historyList[historyList.length - 1].reason}"</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={CalendarX}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPostpone(b);
                        }}
                      >
                        Postpone Start
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit3}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditBatch(b);
                        }}
                      >
                        Edit
                      </Button>
                    </div>

                    {b.status !== 'ACTIVE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlayCircle}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartBatch(b.id);
                        }}
                      >
                        Start Batch
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MODULE NOTES & STUDY MATERIALS LIBRARY (DOCS & PDFS)
          ========================================================================= */}
      {activeTab === 'NOTES_LIBRARY' && (
        <div className="space-y-4">
          <Card
            title="Course Module Notes & Study Materials Library"
            subtitle="Upload, edit, and assign Doc & PDF notes to trainers and active cohorts"
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
                    .map((a) => batches.find((b) => b.id === a.batch_id)?.name || a.batch_id);

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
                              <span className="text-amber-600 italic">Not yet assigned</span>
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
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenEditNote(note)}
                            className="p-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
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
                                {b.name || b.batch_code}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE BATCH (SECTION 1)
          - Strict name format: BH + number (e.g. BH17, BH19)
          - Slots: 8:30 AM, 10:30 AM, 12:30 PM
          - Start date picker
          - No admission number field
          ========================================================================= */}
      <Modal
        isOpen={createBatchModalOpen}
        onClose={() => setCreateBatchModalOpen(false)}
        title="Create New Academic Cohort Batch"
        subtitle="Standard BH-numbered batch with designated time slot"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Batch Name (Must be BH + number, e.g. BH17, BH19, BH20) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BH17 or BH19"
              value={batchForm.name}
              onChange={(e) => handleBatchNameChange(e.target.value)}
              className={`w-full p-2.5 bg-white border rounded-xl font-mono text-sm font-bold uppercase tracking-wider ${
                nameError ? 'border-rose-500 focus:ring-rose-200' : 'border-gray-300 focus:ring-brand-500'
              }`}
            />
            {nameError && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {nameError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Time Slot (3 Options) *
              </label>
              <select
                value={batchForm.slot}
                onChange={(e) => setBatchForm({ ...batchForm, slot: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
              >
                <option value="8:30 AM">8:30 AM (Morning Slot)</option>
                <option value="10:30 AM">10:30 AM (Prime Slot)</option>
                <option value="12:30 PM">12:30 PM (Afternoon Slot)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Batch Start Date *
              </label>
              <input
                type="date"
                required
                value={batchForm.start_date}
                onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Default Trainer / Faculty
              </label>
              <select
                value={batchForm.default_trainer_id}
                onChange={(e) => setBatchForm({ ...batchForm, default_trainer_id: e.target.value })}
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
                Delivery Mode
              </label>
              <select
                value={batchForm.mode}
                onChange={(e) => setBatchForm({ ...batchForm, mode: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
              >
                <option value="ONLINE">ONLINE (Virtual Classroom)</option>
                <option value="OFFLINE">OFFLINE (Campus Classroom)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
            <p>✓ <strong>Validation Rule:</strong> Batch name is strictly verified for uniqueness and uppercase BH-format.</p>
            <p>✓ <strong>Postponement Policy:</strong> Name, slot, and start date remain editable until the first class is held.</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setCreateBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting} disabled={!!nameError}>
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 2: POSTPONE BATCH START DATE (SECTION 1)
          - Pick new date + reason
          - Saves history list
          - Notifies assigned students
          - Warns Office Admin review
          ========================================================================= */}
      <Modal
        isOpen={postponeModalOpen}
        onClose={() => setPostponeModalOpen(false)}
        title={`Postpone Start Date: ${selectedBatchForPostpone?.name || selectedBatchForPostpone?.batch_code}`}
        subtitle="Reschedule batch commencement, notify students, and record history"
      >
        <form onSubmit={handlePostponeSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Current Start Date</span>
            <strong className="text-sm font-poppins">{selectedBatchForPostpone?.start_date || 'TBD'}</strong>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              New Batch Start Date *
            </label>
            <input
              type="date"
              required
              value={postponeData.new_start_date}
              onChange={(e) => setPostponeData({ ...postponeData, new_start_date: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Reason for Postponement *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Majority students requested joining after university exams; campus renovation extension."
              value={postponeData.reason}
              onChange={(e) => setPostponeData({ ...postponeData, reason: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
            />
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] space-y-1">
            <p className="font-bold">⚠️ Fee Schedule Notice:</p>
            <p>Postponing start date does <strong>not</strong> auto-alter existing installment due dates. A warning banner will alert the Office Admin to review affected candidate fee schedules.</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setPostponeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Confirm Postponement
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 3: EDIT BATCH
          ========================================================================= */}
      <Modal
        isOpen={editBatchModalOpen}
        onClose={() => setEditBatchModalOpen(false)}
        title={`Edit Batch: ${editingBatch?.name || editingBatch?.batch_code}`}
        subtitle="Update batch details (locked after first held session)"
      >
        <form onSubmit={handleEditBatchSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Batch Name (BH-format)
            </label>
            <input
              type="text"
              required
              value={editBatchForm.name}
              onChange={(e) => setEditBatchForm({ ...editBatchForm, name: e.target.value.toUpperCase() })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-mono text-sm font-bold uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Time Slot
            </label>
            <select
              value={editBatchForm.slot}
              onChange={(e) => setEditBatchForm({ ...editBatchForm, slot: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold text-brand-900"
            >
              <option value="8:30 AM">8:30 AM (Morning Slot)</option>
              <option value="10:30 AM">10:30 AM (Prime Slot)</option>
              <option value="12:30 PM">12:30 PM (Afternoon Slot)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Default Faculty / Trainer
            </label>
            <select
              value={editBatchForm.default_trainer_id}
              onChange={(e) => setEditBatchForm({ ...editBatchForm, default_trainer_id: e.target.value })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-brand-900"
            >
              {trainersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setEditBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Save Batch Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 4: ADD / EDIT MODULE NOTE (DOC OR PDF)
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
                    {b.name || b.batch_code}
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
              placeholder="e.g. Read before practical session. Contains 5 prompt templates and checklist."
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
