/**
 * MLC ERP - Notes & Study Materials Module
 * Handles centralized notes library management, trainer batch assignment,
 * and role-restricted student access controls.
 */

/**
 * 1. Add / Update Study Note in Library (MAIN_ADMIN / OPS_ADMIN)
 */
function saveNote(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN']);

  var moduleCode = payload.module_code;
  var topicId = payload.topic_id || '';
  var title = payload.title;
  var fileType = payload.file_type || 'PDF'; // PDF | DOC | LINK | VIDEO
  var fileUrl = payload.file_url;
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
    uploaded_by: currentUser.id,
    is_active: true
  };

  var savedNote = null;
  if (noteId) {
    savedNote = updateRecord('Notes', noteId, noteData, currentUser.id);
  } else {
    savedNote = insertRecord('Notes', noteData, currentUser.id);
  }

  logAudit('SAVE_NOTE', 'Notes', savedNote.id, { title: title, module: moduleCode }, currentUser);

  return { ok: true, data: savedNote };
}

/**
 * 2. Assign Note to Batch (TRAINER / ADMIN)
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
    message: 'Your trainer has assigned new study notes. You can view or download them from your Student Portal.',
    type: 'NOTE_ASSIGNED',
    is_read: false
  }, currentUser.id);

  logAudit('ASSIGN_NOTE', 'NoteAssignments', assigned.id, { note_id: noteId, batch_id: batchId }, currentUser);

  return { ok: true, data: assigned };
}

/**
 * 3. Get Notes Available for User (Role-filtered)
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
      return assignedNoteIds[n.id] === true;
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
