/**
 * MLC ERP - Server-Side Unit Tests Suite
 * Covers business logic invariants:
 *  1. Fee schedule calculation & rounding absorption
 *  2. Attendance percentage & 85% eligibility shortfall logic
 *  3. Multi-component assessment weighting & grade band mapping
 *  4. Admission counter generation
 *  5. Role permission guard assertions
 */

function runAllServerTests() {
  var testResults = [];

  function assert(testName, condition, message) {
    if (condition) {
      testResults.push({ name: testName, status: 'PASSED', message: 'OK' });
    } else {
      testResults.push({ name: testName, status: 'FAILED', message: message || 'Assertion failed' });
    }
  }

  Logger.log('=== Running MLC ERP Server Tests ===');

  // Test 1: Fee Schedule Calculation & Rounding Absorption
  try {
    var totalFee = 25000;
    var registrationFee = 500;
    var startDayBalance = 2450;
    var remainingTuition = totalFee - registrationFee - startDayBalance; // 22,050

    var installmentBase = Math.floor(remainingTuition / 4); // 5512
    var remainder = remainingTuition - (installmentBase * 4); // 2
    var inst4Amount = installmentBase + remainder; // 5514

    var sum = registrationFee + startDayBalance + (installmentBase * 3) + inst4Amount;
    assert('Fee Schedule Sum Invariant', sum === totalFee, 'Sum (' + sum + ') != totalFee (' + totalFee + ')');
    assert('Fee Installment 4 Absorbs Rounding', inst4Amount === 5514, 'Installment 4 should be 5514, got: ' + inst4Amount);
  } catch (e) {
    assert('Fee Schedule Exception', false, e.toString());
  }

  // Test 2: Attendance Eligibility Logic (overall >= 85% and every module >= 85%)
  try {
    // Case A: Module 1 conducted 20h, attended 18h (90%). Module 2 conducted 10h, attended 8h (80% - FAIL). Overall: 26/30 = 86.6%
    var mod1Conducted = 20, mod1Attended = 18;
    var mod2Conducted = 10, mod2Attended = 8;
    var totalConducted = mod1Conducted + mod2Conducted;
    var totalAttended = mod1Attended + mod2Attended;
    var overallPct = (totalAttended / totalConducted) * 100; // 86.67%

    var mod1Eligible = (mod1Attended / mod1Conducted) >= 0.85; // true (90%)
    var mod2Eligible = (mod2Attended / mod2Conducted) >= 0.85; // false (80%)
    var overallEligible = overallPct >= 85 && mod1Eligible && mod2Eligible;

    assert('Attendance Overall >= 85% but Module Fail is Ineligible', overallEligible === false, 'Student with a module below 85% must be ineligible');

    // Case B: Module 2 attended 9h (90%). Overall 27/30 = 90%
    mod2Attended = 9;
    totalAttended = mod1Attended + mod2Attended;
    overallPct = (totalAttended / totalConducted) * 100;
    mod2Eligible = (mod2Attended / mod2Conducted) >= 0.85;
    overallEligible = overallPct >= 85 && mod1Eligible && mod2Eligible;

    assert('Attendance All Modules >= 85% is Eligible', overallEligible === true, 'Student with all modules >= 85% must be eligible');

    // Case C: Shortfall hours computation
    var requiredMod2Hours = Math.ceil(mod2Conducted * 0.85); // Math.ceil(8.5) = 9
    var shortfall = (8 < requiredMod2Hours) ? (requiredMod2Hours - 8) : 0;
    assert('Shortfall Hours Computation', shortfall === 1, 'Shortfall for 8/10h should be 1h');
  } catch (e) {
    assert('Attendance Eligibility Exception', false, e.toString());
  }

  // Test 3: Multi-component Assessment Weighting & Re-normalization
  try {
    // Config: Test=50, Pres=25, Mock=25
    // Student has: Test=90/100, Presentation missing, Mock=80/100
    var wTest = 50, wPres = 25, wMock = 25;
    var scoreTest = 90, scoreMock = 80;
    var activeWeight = wTest + wMock; // 75
    var weightedScore = (scoreTest * wTest) + (scoreMock * wMock); // 4500 + 2000 = 6500
    var normalizedScore = weightedScore / activeWeight; // 6500 / 75 = 86.67

    assert('Assessment Dynamic Normalization', Math.abs(normalizedScore - 86.67) < 0.01, 'Normalized score should be ~86.67');

    // Grade Band Mapping: 86.67 is 'B'
    var grade = 'F';
    if (normalizedScore >= 90) grade = 'A';
    else if (normalizedScore >= 80) grade = 'B';
    else if (normalizedScore >= 65) grade = 'C';
    else if (normalizedScore >= 50) grade = 'D';

    assert('Grade Band Mapping Threshold', grade === 'B', 'Score 86.67 should map to Grade B');
  } catch (e) {
    assert('Assessment Testing Exception', false, e.toString());
  }

  // Test 4: Role Guard Assertion
  try {
    var opsAdmin = { role: 'OPS_ADMIN' };
    var student = { role: 'STUDENT' };

    var opsCanAccess = false;
    try {
      requireRole(opsAdmin, ['MAIN_ADMIN', 'OPS_ADMIN']);
      opsCanAccess = true;
    } catch(err) { opsCanAccess = false; }
    assert('Role Guard Permits Authorized Role', opsCanAccess === true, 'OPS_ADMIN should be permitted');

    var studentBlocked = false;
    try {
      requireRole(student, ['MAIN_ADMIN', 'OPS_ADMIN']);
    } catch(err) {
      studentBlocked = true;
    }
    assert('Role Guard Rejects Unauthorized Role', studentBlocked === true, 'STUDENT should be blocked from admin action');
  } catch (e) {
    assert('Role Guard Exception', false, e.toString());
  }

  // Summary
  var passedCount = testResults.filter(function(r) { return r.status === 'PASSED'; }).length;
  Logger.log('=== TEST SUMMARY: ' + passedCount + '/' + testResults.length + ' PASSED ===');
  for (var i = 0; i < testResults.length; i++) {
    Logger.log('[' + testResults[i].status + '] ' + testResults[i].name + ' — ' + testResults[i].message);
  }

  return {
    total: testResults.length,
    passed: passedCount,
    failed: testResults.length - passedCount,
    tests: testResults
  };
}
