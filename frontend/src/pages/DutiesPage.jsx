import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  ListTodo,
  CheckCircle2,
  UploadCloud,
  Award,
  Link as LinkIcon,
  Calendar,
  Sparkles,
  Star,
  FileCheck,
  PlusCircle,
  ExternalLink,
  Instagram,
  Clock,
  AlertTriangle,
  Sun,
  Check,
  Trash2,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';

export function DutiesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [dutiesData, setDutiesData] = useState({ duties: [], tasks: [], kpis: [] });

  // 1. Daily To-Do State (Before 10 AM / Update before 9 PM)
  const isSunday = new Date().getDay() === 0;
  const [toDoRecord, setToDoRecord] = useState(null);
  const [toDoTasks, setToDoTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [toDoNotes, setToDoNotes] = useState('');
  const [toDoSaving, setToDoSaving] = useState(false);

  // 2. Social Media Posts Engagement
  const isMainAdmin = user?.role === 'MAIN_ADMIN';
  const canAddSocialPost = ['SOCIAL_MEDIA_MANAGER', 'MARKETING_HEAD', 'MAIN_ADMIN'].includes(user?.role);
  const [socialPosts, setSocialPosts] = useState([]);
  const [socialTab, setSocialTab] = useState('PENDING'); // PENDING | COMPLETED
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', post_url: '', caption: '' });

  // 3. KPI / Duty submission modal
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState('LINK');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSalesStaff = user?.role === 'SALES_HEAD' || user?.role === 'SALES_EXEC' || user?.department === 'Sales';

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [dutiesRes, todoRes, socialRes] = await Promise.all([
        apiCall('getStaffDutiesAndKPIs', { target_user_id: user?.id }),
        apiCall('getDailyToDos', { user_id: user?.id }),
        apiCall('getSocialPosts'),
      ]);

      setDutiesData({
        duties: Array.isArray(dutiesRes?.duties) ? dutiesRes.duties : [],
        tasks: Array.isArray(dutiesRes?.tasks) ? dutiesRes.tasks : [],
        kpis: Array.isArray(dutiesRes?.kpis) ? dutiesRes.kpis : [],
      });

      if (todoRes?.record) {
        setToDoRecord(todoRes.record);
        setToDoTasks(Array.isArray(todoRes.record.tasks) ? todoRes.record.tasks : []);
        setToDoNotes(todoRes.record.notes || '');
      } else {
        setToDoRecord(null);
        setToDoTasks([]);
        setToDoNotes('');
      }

      setSocialPosts(Array.isArray(socialRes?.posts) ? socialRes.posts : []);
    } catch (err) {
      console.error('Duties load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Add a task to today's To-Do list
  const handleAddToDoItem = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item = {
      id: 'task-' + Date.now(),
      title: newTaskTitle.trim(),
      status: 'PENDING', // PENDING | IN_PROGRESS | DONE
      remark: '',
    };
    setToDoTasks([...toDoTasks, item]);
    setNewTaskTitle('');
  };

  // Toggle To-Do Task Status
  const handleToggleTaskStatus = (taskId) => {
    setToDoTasks(toDoTasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'DONE' ? 'PENDING' : 'DONE';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Remove Task
  const handleRemoveTask = (taskId) => {
    setToDoTasks(toDoTasks.filter(t => t.id !== taskId));
  };

  // Save Morning / Current To-Do Plan
  const handleSaveToDos = async () => {
    if (toDoTasks.length === 0) {
      toast.error('Please add at least one to-do item before saving!');
      return;
    }
    setToDoSaving(true);
    try {
      const res = await apiCall('saveDailyToDos', {
        tasks: toDoTasks,
        notes: toDoNotes,
      });
      setToDoRecord(res.record);
      const isBefore10 = res.record.created_before_10am;
      toast.success(
        isBefore10
          ? 'Morning To-Do list submitted ON TIME (Before 10:00 AM)!'
          : 'Morning To-Do list recorded (After 10:00 AM).'
      );
      loadAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to save to-do list.');
    } finally {
      setToDoSaving(false);
    }
  };

  // Submit Evening Update (Before 9 PM)
  const handleUpdateEveningToDos = async () => {
    setToDoSaving(true);
    try {
      const res = await apiCall('updateDailyToDos', {
        tasks: toDoTasks,
        notes: toDoNotes,
      });
      setToDoRecord(res.record);
      const isBefore9Pm = res.record.updated_before_9pm;
      toast.success(
        isBefore9Pm
          ? 'Evening To-Do update recorded ON TIME (Before 9:00 PM)!'
          : 'Evening To-Do update recorded.'
      );
      loadAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to update evening to-dos.');
    } finally {
      setToDoSaving(false);
    }
  };

  // Mark Instagram Post as Liked & Commented
  const handleMarkSocialDone = async (postId) => {
    try {
      await apiCall('markSocialPostDone', { post_id: postId });
      toast.success('Engagement recorded! Marked as Liked & Commented.');
      loadAllData();
    } catch (err) {
      toast.error('Failed to mark engagement.');
    }
  };

  // Create new social post (Social Media Manager / Marketing Head / Admin)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.post_url) return;
    try {
      await apiCall('createSocialPost', postForm);
      toast.success('Instagram post published for mandatory staff engagement!');
      setNewPostModalOpen(false);
      setPostForm({ title: '', post_url: '', caption: '' });
      loadAllData();
    } catch (err) {
      toast.error('Failed to add post link.');
    }
  };

  // Submit traditional duty completion
  const handleSubmitDone = async (e) => {
    e.preventDefault();
    if (!selectedDuty) return;

    if (selectedDuty.requires_evidence && !evidenceUrl) {
      toast.error('Evidence link or file is strictly required for this duty!');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('submitDutyDone', {
        duty_id: selectedDuty.id,
        remark: remark || 'Completed as scheduled.',
        evidence: evidenceUrl
          ? [{ file_url: evidenceUrl, type: evidenceType, note: evidenceNote }]
          : [],
      });

      toast.success('Duty marked as DONE with verified evidence!');
      setModalOpen(false);
      setRemark('');
      setEvidenceUrl('');
      loadAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit duty.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingSocialPosts = socialPosts.filter(p => !p.is_done);
  const completedSocialPosts = socialPosts.filter(p => p.is_done);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 rounded-2xl text-white shadow-soft-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Performance & Execution Center</span>
          <h1 className="text-2xl font-poppins font-bold mt-0.5">My Daily Tasks & Execution Console</h1>
          <p className="text-xs text-brand-100 mt-1">
            Daily To-Do list plan (Due before 10 AM, updated before 9 PM), Mandatory Social Media engagement & performance KPIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gold-shine text-brand-900 font-bold text-xs rounded-xl shadow-gold-glow">
            {user?.department || 'Operations'} • {user?.role}
          </span>
        </div>
      </div>

      {/* =========================================================================
          1. DAILY TO-DO LIST (BEFORE 10 AM / UPDATE BEFORE 9 PM / SUNDAY LEAVE)
          ========================================================================= */}
      {isSunday ? (
        <Card>
          <div className="p-6 text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="font-poppins font-bold text-lg text-brand-900">Sunday is Institute Leave Day</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Take time to rest and recharge. Daily To-Do list submissions resume tomorrow (Monday) morning before 10:00 AM.
            </p>
          </div>
        </Card>
      ) : (
        <Card
          title="Daily To-Do List & Task Management"
          subtitle="Mandatory rule: Create plan before 10:00 AM • Update progress before 9:00 PM"
          action={
            toDoRecord ? (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                    toDoRecord.created_before_10am
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {toDoRecord.created_before_10am ? '✓ Created Before 10 AM' : '⚠️ Created After 10 AM'}
                </span>
                {toDoRecord.updated_before_9pm !== null && (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                      toDoRecord.updated_before_9pm
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {toDoRecord.updated_before_9pm ? '✓ Updated Before 9 PM' : '⚠️ Updated Late'}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-xl border border-rose-200">
                Pending Creation (Due by 10 AM)
              </span>
            )
          }
        >
          <div className="space-y-4">
            {/* Add Task Input */}
            <form onSubmit={handleAddToDoItem} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter today's planned task (e.g. Design 3 Instagram carousel posters, Contact 15 prospective candidates)..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
              />
              <Button type="submit" variant="primary" size="md" icon={PlusCircle}>
                Add Task
              </Button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2">
              {toDoTasks.length > 0 ? (
                toDoTasks.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      t.status === 'DONE'
                        ? 'bg-emerald-50/50 border-emerald-200 text-gray-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(t.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          t.status === 'DONE'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 hover:border-brand-500 bg-white'
                        }`}
                      >
                        {t.status === 'DONE' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className={`text-xs font-semibold truncate ${t.status === 'DONE' ? 'line-through text-gray-400' : 'text-brand-900'}`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status === 'DONE' ? 'Done' : 'In Progress'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(t.id)}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-600">No tasks added to today's plan yet.</p>
                  <p className="text-[11px] text-gray-400">Add tasks above and click "Save Morning Plan" before 10:00 AM.</p>
                </div>
              )}
            </div>

            {/* Notes / Evening Remarks */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Day End Notes & Completion Remarks (Due before 9:00 PM)
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes regarding accomplishments, blockers, or deliverables completed today..."
                value={toDoNotes}
                onChange={(e) => setToDoNotes(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Tasks Done: <strong className="text-brand-900">{toDoTasks.filter(t => t.status === 'DONE').length}</strong> of {toDoTasks.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={toDoSaving}
                  onClick={handleSaveToDos}
                >
                  Save Morning Plan (Before 10 AM)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={toDoSaving}
                  onClick={handleUpdateEveningToDos}
                >
                  Submit Evening Update (Before 9 PM)
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* =========================================================================
          2. MANDATORY SOCIAL MEDIA ENGAGEMENT (INSTAGRAM POSTS & REELS)
             (MANDATORY FOR ALL STAFF EXCEPT MAIN ADMIN)
          ========================================================================= */}
      {!isMainAdmin && (
        <Card
          title="Mandatory Social Media Engagement (Instagram Posts & Reels)"
          subtitle="Mandatory for all faculty & staff: Open the link, Like & Comment on the post, then click Mark as Done"
          action={
            canAddSocialPost && (
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setNewPostModalOpen(true)}
              >
                + Post New Instagram Link
              </Button>
            )
          }
        >
          <div className="space-y-4">
            {/* Tabs: Pending vs Completed */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
              <button
                onClick={() => setSocialTab('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  socialTab === 'PENDING'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Pending Engagement ({pendingSocialPosts.length})
              </button>
              <button
                onClick={() => setSocialTab('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  socialTab === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed ({completedSocialPosts.length})
              </button>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {(socialTab === 'PENDING' ? pendingSocialPosts : completedSocialPosts).length > 0 ? (
                (socialTab === 'PENDING' ? pendingSocialPosts : completedSocialPosts).map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                        <h4 className="font-poppins font-bold text-xs text-brand-900">{post.title}</h4>
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-2">{post.caption}</p>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Posted by {post.created_by_name || 'Marketing Team'} • {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90"
                      >
                        Open on Instagram <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {!post.is_done ? (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ThumbsUp}
                          onClick={() => handleMarkSocialDone(post.id)}
                        >
                          Mark as Liked & Commented
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">
                  {socialTab === 'PENDING'
                    ? '🎉 Excellent! All mandatory Instagram posts have been liked and commented on.'
                    : 'No completed engagements to display yet.'}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* =========================================================================
          3. KPI TARGETS & PERFORMANCE CARDS
             (First one "Lead Generation: New Inbound Inquiries" is removed from everyone.
              Second one "Daily Call Volume" is shown ONLY for Sales Head and Sales Exec)
          ========================================================================= */}
      {isSalesStaff && (
        <div>
          <h3 className="font-poppins font-bold text-sm text-brand-900 mb-3">Sales Target KPI Scorecard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card highlight={true}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">Customer Engagement</span>
                  <h4 className="font-poppins font-bold text-brand-900 text-base mt-0.5">Daily Call Volume</h4>
                </div>
                <Award className="w-5 h-5 text-gold-500 shrink-0" />
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-500">Progress: 420 / 400 Calls</span>
                  <span className="text-emerald-600">100%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MODAL: POST NEW INSTAGRAM LINK (Social Media Manager / Marketing Head)
          ========================================================================= */}
      <Modal
        isOpen={newPostModalOpen}
        onClose={() => setNewPostModalOpen(false)}
        title="Publish Mandatory Instagram Post / Reel Link"
        subtitle="Will appear on all staff dashboards to like and comment"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Post Title / Topic *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mastered Placement Story: Healthcare Management Student Placed"
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Instagram Post / Reel URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.instagram.com/reel/..."
              value={postForm.post_url}
              onChange={(e) => setPostForm({ ...postForm, post_url: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Caption / Engagement Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Mandatory: Please leave a supportive comment mentioning 'Great career opportunity at Mastered' and save the reel."
              value={postForm.caption}
              onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setNewPostModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish for All Staff
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          5. MODAL: SUBMIT DUTY EVIDENCE
          ========================================================================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit Duty Completion & Evidence"
        subtitle={selectedDuty?.title}
      >
        <form onSubmit={handleSubmitDone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Completion Remark / Report *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Completed as scheduled..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Evidence Format
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-semibold"
              >
                <option value="LINK">Live Link / Google Drive / URL</option>
                <option value="IMAGE">Screenshot / Image</option>
                <option value="PDF">Document / PDF Report</option>
                <option value="VIDEO">Video Recording Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Evidence URL / Link {selectedDuty?.requires_evidence ? '*' : '(Optional)'}
              </label>
              <input
                type="url"
                required={selectedDuty?.requires_evidence}
                placeholder="https://drive.google.com/..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Submit for Supervisor Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
