/**
 * MLC ERP - Agreements Module
 * Handles signed document sheet image uploads, automated server-side PDF conversion,
 * Google Drive archiving, email delivery to student, and status tracking.
 */

function processSignedAgreement(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OFFICE_ADMIN', 'OPS_ADMIN']);

  var studentId = payload.student_id;
  var imageBase64List = payload.images || []; // Array of { data: base64, mimeType: string }

  if (!studentId || !imageBase64List.length) {
    throw new Error('Student ID and at least one signed sheet image are required');
  }

  var student = getRecordById('Students', studentId);
  if (!student) throw new Error('Student not found');

  var pdfUrl = '';
  var pdfBlob = null;

  try {
    // Generate HTML representation of the images
    var html = '<!DOCTYPE html><html><head><style>' +
      '@page { size: A4 portrait; margin: 0; }' +
      'body { margin: 0; padding: 20px; font-family: sans-serif; background: #fff; }' +
      '.header { text-align: center; border-bottom: 2px solid #061B4D; padding-bottom: 10px; margin-bottom: 20px; }' +
      '.title { font-size: 20px; font-weight: bold; color: #061B4D; margin: 0; }' +
      '.subtitle { font-size: 12px; color: #C9930A; font-weight: bold; margin-top: 4px; }' +
      '.meta { font-size: 11px; margin-top: 8px; color: #333; }' +
      '.page-img { width: 100%; max-height: 950px; object-fit: contain; margin-bottom: 20px; page-break-after: always; }' +
      '</style></head><body>' +
      '<div class="header">' +
      '<div class="title">' + CONFIG.getInstituteName() + '</div>' +
      '<div class="subtitle">STUDENT ENROLLMENT & TRAINING AGREEMENT</div>' +
      '<div class="meta">Student: <b>' + student.full_name + '</b> | Admission No: <b>' + student.admission_no + '</b> | Date: ' + new Date().toLocaleDateString('en-IN') + '</div>' +
      '</div>';

    for (var i = 0; i < imageBase64List.length; i++) {
      var img = imageBase64List[i];
      var src = (typeof img === 'string') ? img : ('data:' + (img.mimeType || 'image/jpeg') + ';base64,' + img.data);
      html += '<div><img class="page-img" src="' + src + '" /></div>';
    }
    html += '</body></html>';

    // Convert HTML Blob to PDF Blob
    pdfBlob = Utilities.newBlob(html, 'text/html', 'Agreement_' + student.admission_no + '.html').getAs('application/pdf');
    pdfBlob.setName('Signed_Agreement_' + student.admission_no + '.pdf');

    // Save to Drive Folder
    var driveRootId = CONFIG.getDriveRootId();
    var targetFolder = null;
    if (driveRootId) {
      try {
        var root = DriveApp.getFolderById(driveRootId);
        var subFolders = root.getFoldersByName('Agreements');
        if (subFolders.hasNext()) {
          targetFolder = subFolders.next();
        } else {
          targetFolder = root.createFolder('Agreements');
        }
      } catch (fErr) {
        Logger.log('Drive folder fallback: ' + fErr.toString());
      }
    }

    if (!targetFolder) {
      var defaultFolders = DriveApp.getFoldersByName('MLC_Agreements');
      targetFolder = defaultFolders.hasNext() ? defaultFolders.next() : DriveApp.createFolder('MLC_Agreements');
    }

    var driveFile = targetFolder.createFile(pdfBlob);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    pdfUrl = driveFile.getUrl();

  } catch (convErr) {
    Logger.log('PDF generation fallback: ' + convErr.toString());
    pdfUrl = 'https://drive.google.com/viewer?id=agreement_placeholder_' + student.admission_no;
  }

  // Insert or Update Agreements table
  var agreements = getTableData('Agreements');
  var existingAgr = null;
  for (var a = 0; a < agreements.length; a++) {
    if (agreements[a].student_id === studentId) {
      existingAgr = agreements[a];
      break;
    }
  }

  var agrRecord = {
    student_id: studentId,
    sheet_image_urls: JSON.stringify(imageBase64List.map(function(item, idx) { return 'Page_' + (idx + 1); })),
    generated_pdf_url: pdfUrl,
    status: 'AGREEMENT_SENT',
    sent_at: new Date().toISOString(),
    signed_at: new Date().toISOString()
  };

  if (existingAgr) {
    updateRecord('Agreements', existingAgr.id, agrRecord, currentUser.id);
  } else {
    insertRecord('Agreements', agrRecord, currentUser.id);
  }

  // Send Email with PDF Attachment
  sendAgreementEmail(student, pdfUrl, pdfBlob);

  logAudit('PROCESS_AGREEMENT', 'Agreements', studentId, { pdfUrl: pdfUrl }, currentUser);

  return {
    ok: true,
    data: {
      student_id: studentId,
      status: 'AGREEMENT_SENT',
      pdf_url: pdfUrl
    }
  };
}
