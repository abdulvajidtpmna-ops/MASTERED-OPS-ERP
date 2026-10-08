/**
 * MLC ERP - Assessments & Grade Band Engine
 * Handles multi-component scoring (Test, Presentation, Mock Interview),
 * auto-renormalization of missing components, hours-weighted overall scoring,
 * and letter-grade assignment according to institution grade bands.
 */

/**
 * 1. Save Student Assessment
 */
function saveAssessment(payload, currentUser) {
  requireRole(currentUser, ['MAIN_ADMIN', 'OPS_ADMIN', 'TRAINER']);

  var studentId = payload.student_id;
  var batchId = payload.batch_id;
  var moduleCode = payload.module_code;
  var type = payload.type; // TEST | PRESENTATION | MOCK_INTERVIEW
  var score = payload.absent ? 0 : Number(payload.score || 0);
  var maxScore = Number(payload.max_score) || 100;
  var absent = !!payload.absent;
  var remarks = payload.remarks || '';

  if (!studentId || !moduleCode || !type) {
    throw new Error('Student ID, Module Code, and Assessment Type are required');
  }

  // Find existing assessment record
  var existingAssessments = getTableData('Assessments');
  var matchedId = null;

  for (var i = 0; i < existingAssessments.length; i++) {
    var a = existingAssessments[i];
    if (a.student_id === studentId && a.module_code === moduleCode && a.type === type) {
      matchedId = a.id;
      break;
    }
  }

  if (matchedId) {
    updateRecord('Assessments', matchedId, {
      score: score,
      max_score: maxScore,
      absent: absent,
      trainer_id: currentUser.trainer_id || currentUser.id,
      remarks: remarks
    }, currentUser.id);
  } else {
    insertRecord('Assessments', {
      student_id: studentId,
      batch_id: batchId,
      module_code: moduleCode,
      type: type,
      score: score,
      max_score: maxScore,
      absent: absent,
      trainer_id: currentUser.trainer_id || currentUser.id,
      remarks: remarks
    }, currentUser.id);
  }

  // Re-calculate Student Grade
  var calculatedGrade = recalculateStudentGrade(studentId, batchId, currentUser);

  logAudit('SAVE_ASSESSMENT', 'Assessments', studentId, { module: moduleCode, type: type, score: score, grade: calculatedGrade.grade }, currentUser);

  return {
    ok: true,
    data: {
      student_id: studentId,
      module_code: moduleCode,
      type: type,
      score: score,
      overall: calculatedGrade
    }
  };
}

/**
 * 2. Calculate Weighted Module Score & Hours-Weighted Overall Grade
 */
function recalculateStudentGrade(studentId, batchId, currentUser) {
  var allAssessments = getTableData('Assessments').filter(function(a) {
    return a.student_id === studentId;
  });

  var student = getRecordById('Students', studentId);
  var isBHA = (student && student.course_code === 'BHA');

  var modules = getTableData('Modules').filter(function(m) {
    if (m.course_code === 'BHA' && !isBHA) return false;
    return true;
  });

  var moduleMap = {};
  var totalCurriculumHours = 0;

  for (var m = 0; m < modules.length; m++) {
    var mod = modules[m];
    var mHours = Number(mod.total_hours) || 10;
    totalCurriculumHours += mHours;
    moduleMap[mod.module_code] = {
      code: mod.module_code,
      title: mod.title,
      hours: mHours,
      wTest: Number(mod.weight_test) || 50,
      wPres: Number(mod.weight_presentation) || 25,
      wMock: Number(mod.weight_mock) || 25,
      assessments: {}
    };
  }

  var isAllAbsent = true;
  if (allAssessments.length > 0) {
    isAllAbsent = false;
  }

  for (var aIdx = 0; aIdx < allAssessments.length; aIdx++) {
    var rec = allAssessments[aIdx];
    if (moduleMap[rec.module_code]) {
      moduleMap[rec.module_code].assessments[rec.type] = {
        score: Number(rec.score) || 0,
        max: Number(rec.max_score) || 100,
        absent: rec.absent === true || rec.absent === 'TRUE' || rec.absent === 1
      };
    }
  }

  var weightedScoreSum = 0;
  var accumulatedHours = 0;
  var moduleResults = [];

  for (var codeKey in moduleMap) {
    var modObj = moduleMap[codeKey];
    var tests = modObj.assessments;

    // Normalize weights if some types are missing
    var activeWeight = 0;
    var rawScore = 0;

    if (tests['TEST']) {
      var tNorm = (tests['TEST'].score / tests['TEST'].max) * 100;
      rawScore += tNorm * modObj.wTest;
      activeWeight += modObj.wTest;
    }
    if (tests['PRESENTATION']) {
      var pNorm = (tests['PRESENTATION'].score / tests['PRESENTATION'].max) * 100;
      rawScore += pNorm * modObj.wPres;
      activeWeight += modObj.wPres;
    }
    if (tests['MOCK_INTERVIEW']) {
      var mNorm = (tests['MOCK_INTERVIEW'].score / tests['MOCK_INTERVIEW'].max) * 100;
      rawScore += mNorm * modObj.wMock;
      activeWeight += modObj.wMock;
    }

    var modFinalScore = activeWeight > 0 ? (rawScore / activeWeight) : 0;
    moduleResults.push({
      module_code: modObj.code,
      title: modObj.title,
      score: Number(modFinalScore.toFixed(1)),
      hours: modObj.hours
    });

    if (activeWeight > 0) {
      weightedScoreSum += modFinalScore * modObj.hours;
      accumulatedHours += modObj.hours;
    }
  }

  var overallScore = accumulatedHours > 0 ? Number((weightedScoreSum / accumulatedHours).toFixed(1)) : 0;
  var assignedGrade = 'F';

  // Determine Letter Grade from Grade Bands
  if (isAllAbsent || accumulatedHours === 0) {
    assignedGrade = 'E'; // Absent
  } else if (overallScore >= 90) {
    assignedGrade = 'A';
  } else if (overallScore >= 80) {
    assignedGrade = 'B';
  } else if (overallScore >= 65) {
    assignedGrade = 'C';
  } else if (overallScore >= 50) {
    assignedGrade = 'D';
  } else {
    assignedGrade = 'F';
  }

  // Upsert Grades row
  var grades = getTableData('Grades');
  var gradeRowId = null;
  for (var g = 0; g < grades.length; g++) {
    if (grades[g].student_id === studentId) {
      gradeRowId = grades[g].id;
      break;
    }
  }

  var gradePayload = {
    student_id: studentId,
    batch_id: batchId || (student ? student.batch_id : ''),
    overall_score: overallScore,
    grade: assignedGrade,
    status: assignedGrade === 'F' ? 'NEEDS_IMPROVEMENT' : 'PASSED',
    calculated_at: new Date().toISOString()
  };

  if (gradeRowId) {
    updateRecord('Grades', gradeRowId, gradePayload, currentUser.id);
  } else {
    insertRecord('Grades', gradePayload, currentUser.id);
  }

  return {
    overall_score: overallScore,
    grade: assignedGrade,
    module_scores: moduleResults
  };
}
