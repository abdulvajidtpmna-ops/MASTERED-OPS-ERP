/**
 * MLC ERP - Database Backup & Retention Policy
 * Runs daily at 02:00 AM:
 * Copies main Google Spreadsheet to Drive folder '/Backups' and rotates to maintain last 14 copies.
 */

function runDailyBackup() {
  Logger.log('Starting daily spreadsheet backup...');

  var db = getDb();
  var fileId = db.getId();
  var driveFile = DriveApp.getFileById(fileId);

  var rootFolder = null;
  var rootId = CONFIG.getDriveRootId();
  if (rootId) {
    try {
      rootFolder = DriveApp.getFolderById(rootId);
    } catch (e) {
      Logger.log('Root drive folder lookup failed: ' + e.toString());
    }
  }

  var backupFolder = null;
  if (rootFolder) {
    var folders = rootFolder.getFoldersByName('Backups');
    backupFolder = folders.hasNext() ? folders.next() : rootFolder.createFolder('Backups');
  } else {
    var backups = DriveApp.getFoldersByName('MLC_ERP_Backups');
    backupFolder = backups.hasNext() ? backups.next() : DriveApp.createFolder('MLC_ERP_Backups');
  }

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd_HH-mm');
  var backupName = 'MLC_ERP_DB_Backup_' + timestamp;

  // Make copy
  var copy = driveFile.makeCopy(backupName, backupFolder);
  Logger.log('Created backup: ' + copy.getName() + ' (' + copy.getId() + ')');

  // Rotate backups: keep 14 latest
  var files = backupFolder.getFiles();
  var backupFiles = [];
  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().indexOf('MLC_ERP_DB_Backup_') === 0) {
      backupFiles.push({ file: f, date: f.getDateCreated().getTime() });
    }
  }

  // Sort oldest first
  backupFiles.sort(function(a, b) { return a.date - b.date; });

  var maxBackups = 14;
  if (backupFiles.length > maxBackups) {
    var toDeleteCount = backupFiles.length - maxBackups;
    for (var i = 0; i < toDeleteCount; i++) {
      Logger.log('Purging old backup: ' + backupFiles[i].file.getName());
      backupFiles[i].file.setTrashed(true);
    }
  }

  logAudit('DAILY_BACKUP', 'System', copy.getId(), { backupName: backupName, total_retained: Math.min(backupFiles.length, maxBackups) }, { id: 'CRON_TRIGGER', role: 'SYSTEM' });

  Logger.log('Daily backup cycle completed successfully.');
}
