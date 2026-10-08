/**
 * MLC ERP - Notes & Study Materials Module
 * Handles centralized notes library management, module-wise docs & PDFs,
 * trainer assignment, batch distribution, and role-restricted student access controls.
 */

/**
 * 1. Add / Update Study Note in Library (MAIN_ADMIN / OPS_ADMIN / TRAINER)
 */
function saveNote(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'TRAINER']);

  var moduleCode = payload.module_code;
  var topicId = payload.topic_id || '';
  var title = payload.title;
  var fileType = payload.file_type || 'PDF'; // PDF | DOC | LINK
  var fileUrl = payload.file_url;
  var description = payload.description || '';
  var assignedTrainerId = payload.assigned_trainer_id || (currentUser.trainer_id || '');
  var noteId = payload.id;

  if (!moduleCode || !title || !fileUrl) {
    throw new Error('Module Code, Title, and File URL are required');
  }

  var noteData = {
    module_code: moduleCode,
    topic_id: topicId,
    title: title,
    file_type: fileType,
    file_url: fileUrl,
    description: description,
    assigned_trainer_id: assignedTrainerId,
    uploaded_by: currentUser.id,
    updated_at: new Date().toISOString(),
    is_active: true
  };

  var savedNote = null;
  if (noteId) {
    savedNote = updateRecord('Notes', noteId, noteData, currentUser.id);
  } else {
    noteData.created_at = new Date().toISOString();
    savedNote = insertRecord('Notes', noteData, currentUser.id);
  }

  // If a batch_id was provided, also auto-assign to that batch
  if (payload.batch_id) {
    assignNoteToBatch({ note_id: savedNote.id, batch_id: payload.batch_id }, currentUser);
  }

  logAudit('SAVE_NOTE', 'Notes', savedNote.id, { title: title, module: moduleCode, file_type: fileType }, currentUser);

  return { ok: true, data: savedNote };
}

/**
 * 2. Delete Note from Library
 */
function deleteNote(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN']);
  var noteId = payload.note_id || payload.id;
  if (!noteId) throw new Error('Note ID is required');

  deleteRecord('Notes', noteId, currentUser.id);
  logAudit('DELETE_NOTE', 'Notes', noteId, {}, currentUser);

  return { ok: true, data: { note_id: noteId, deleted: true } };
}

/**
 * 3. Assign Note to Batch (TRAINER / ADMIN)
 */
function assignNoteToBatch(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'TRAINER']);

  var noteId = payload.note_id;
  var batchId = payload.batch_id;

  if (!noteId || !batchId) {
    throw new Error('Note ID and Batch ID are required');
  }

  // Check if already assigned
  var assignments = getTableData('NoteAssignments');
  for (var i = 0; i < assignments.length; i++) {
    if (assignments[i].note_id === noteId && assignments[i].batch_id === batchId) {
      return { ok: true, data: assignments[i], note: 'Note already assigned to this batch.' };
    }
  }

  var assigned = insertRecord('NoteAssignments', {
    note_id: noteId,
    batch_id: batchId,
    assigned_by: currentUser.id,
    assigned_at: new Date().toISOString()
  }, currentUser.id);

  var note = getRecordById('Notes', noteId);
  var noteTitle = note ? note.title : 'Study Material';

  // Notify batch students
  insertRecord('Notifications', {
    recipient_user_id: 'BATCH_' + batchId,
    role_target: 'STUDENT',
    title: 'New Study Material Assigned: ' + noteTitle,
    message: 'Your trainer has assigned new study notes (' + (note ? note.file_type : 'PDF') + '). You can view or download them from your Student Portal.',
    type: 'NOTE_ASSIGNED',
    is_read: false
  }, currentUser.id);

  logAudit('ASSIGN_NOTE', 'NoteAssignments', assigned.id, { note_id: noteId, batch_id: batchId }, currentUser);

  return { ok: true, data: assigned };
}

/**
 * 4. Get Notes Available for User (Role-filtered)
 */
function getAccessibleNotes(batchId, currentUser) {
  var allNotes = getTableData('Notes');
  var allAssignments = getTableData('NoteAssignments');

  if (currentUser.role === 'STUDENT') {
    var student = getRecordById('Students', currentUser.student_id || currentUser.id);
    var targetBatch = (student && student.batch_id) ? student.batch_id : batchId;

    var assignedNoteIds = {};
    for (var a = 0; a < allAssignments.length; a++) {
      if (allAssignments[a].batch_id === targetBatch) {
        assignedNoteIds[allAssignments[a].note_id] = true;
      }
    }

    var studentNotes = allNotes.filter(function(n) {
      return assignedNoteIds[n.id] === true && n.is_active !== false;
    });

    return { ok: true, data: studentNotes };
  }

  // Trainers & Admins see all notes + batch assignment status
  return {
    ok: true,
    data: {
      notes: allNotes,
      assignments: allAssignments
    }
  };
}
