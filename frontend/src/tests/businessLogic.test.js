import { describe, it, expect } from 'vitest';

describe('MLC ERP Business Logic Test Suite', () => {
  // 1. Fee Schedule Calculation & Rounding Absorption
  it('should accurately calculate 4 course installments and absorb remainder in 4th installment', () => {
    const totalFee = 25000;
    const registrationFee = 500;
    const balanceRegistration = 2450;
    const remaining = totalFee - registrationFee - balanceRegistration; // 22,050

    const installmentBase = Math.floor(remaining / 4); // 5512
    const remainder = remaining - (installmentBase * 4); // 2
    const inst4 = installmentBase + remainder; // 5514

    expect(installmentBase).toBe(5512);
    expect(inst4).toBe(5514);

    const sum = registrationFee + balanceRegistration + (installmentBase * 3) + inst4;
    expect(sum).toBe(totalFee);
  });

  // 2. Attendance & 85% Eligibility Rule
  it('should enforce that eligible requires overall >= 85% AND every module >= 85%', () => {
    function checkEligibility(modules) {
      let totalCond = 0;
      let totalAtt = 0;
      let allPass = true;

      modules.forEach((m) => {
        totalCond += m.conducted;
        totalAtt += m.attended;
        const pct = m.conducted > 0 ? (m.attended / m.conducted) * 100 : 100;
        if (pct < 85) allPass = false;
      });

      const overallPct = totalCond > 0 ? (totalAtt / totalCond) * 100 : 100;
      const isEligible = overallPct >= 85 && allPass;
      const overallReq = Math.ceil(totalCond * 0.85);
      const overallShortfall = totalAtt < overallReq ? overallReq - totalAtt : 0;

      return { isEligible, overallPct, overallShortfall };
    }

    // Case 1: Overall 86.6% but one module is 80% (Ineligible)
    const resultFail = checkEligibility([
      { conducted: 20, attended: 18 }, // 90%
      { conducted: 10, attended: 8 },  // 80%
    ]);
    expect(resultFail.overallPct).toBeCloseTo(86.67, 1);
    expect(resultFail.isEligible).toBe(false);

    // Case 2: All modules >= 85% (Eligible)
    const resultPass = checkEligibility([
      { conducted: 20, attended: 18 }, // 90%
      { conducted: 10, attended: 9 },  // 90%
    ]);
    expect(resultPass.overallPct).toBe(90);
    expect(resultPass.isEligible).toBe(true);
    expect(resultPass.overallShortfall).toBe(0);
  });

  // 3. Multi-Component Assessment Dynamic Weight Normalization
  it('should dynamically re-normalize weights when assessment components are missing', () => {
    function computeModuleScore(test, pres, mock, weights = { test: 50, pres: 25, mock: 25 }) {
      let activeWeight = 0;
      let rawSum = 0;

      if (test !== null && test !== undefined) {
        rawSum += test * weights.test;
        activeWeight += weights.test;
      }
      if (pres !== null && pres !== undefined) {
        rawSum += pres * weights.pres;
        activeWeight += weights.pres;
      }
      if (mock !== null && mock !== undefined) {
        rawSum += mock * weights.mock;
        activeWeight += weights.mock;
      }

      return activeWeight > 0 ? rawSum / activeWeight : 0;
    }

    // Only Test (90) and Mock (80) provided
    const score = computeModuleScore(90, null, 80);
    // (90 * 50 + 80 * 25) / 75 = (4500 + 2000) / 75 = 6500 / 75 = 86.67
    expect(score).toBeCloseTo(86.67, 2);
  });

  // 4. Letter Grade Band Mapping
  it('should accurately map numerical score to letter grade bands', () => {
    function getGrade(score, isAbsent) {
      if (isAbsent) return 'E';
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 65) return 'C';
      if (score >= 50) return 'D';
      return 'F';
    }

    expect(getGrade(95, false)).toBe('A');
    expect(getGrade(89.9, false)).toBe('B');
    expect(getGrade(75, false)).toBe('C');
    expect(getGrade(55, false)).toBe('D');
    expect(getGrade(42, false)).toBe('F');
    expect(getGrade(95, true)).toBe('E');
  });

  // 5. Admission Counter Format Invariant
  it('should format online and offline admission numbers accurately', () => {
    function formatAdmissionNo(mode, year, counter) {
      const prefix = mode === 'ONLINE' ? 'ON-' : 'OF-';
      const padded = ('0000' + counter).slice(-4);
      return `${prefix}${year}-${padded}`;
    }

    expect(formatAdmissionNo('ONLINE', 2026, 1)).toBe('ON-2026-0001');
    expect(formatAdmissionNo('OFFLINE', 2026, 42)).toBe('OF-2026-0042');
  });
});
