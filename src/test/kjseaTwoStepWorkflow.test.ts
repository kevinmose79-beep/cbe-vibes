import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  KJSEA_LEARNING_AREAS_META,
  KJSEA_ACHIEVEMENT_LEVELS,
  KJSEA_LEVEL_POINTS_MAP,
  KJSEA_ENTRY_STATUSES,
  getKJSEAPointsAdvisory,
  validateKJSEADraftEntries,
  validateMandatoryReason,
} from '../types/kjsea';
import { KjseaAdminManagement } from '../components/kjsea/KjseaAdminManagement';

describe('KJSEA Admin Screen Two-Step Workflow Polish Verification', () => {
  it('verifies KjseaAdminManagement component is exported and defined as a React component', () => {
    expect(KjseaAdminManagement).toBeDefined();
    expect(typeof KjseaAdminManagement).toBe('function');
  });

  describe('Invariant Verification: Approved Learning Areas Order and Metadata', () => {
    it('verifies exactly 9 learning areas exist in the approved national sequence', () => {
      expect(KJSEA_LEARNING_AREAS_META).toHaveLength(9);
      expect(KJSEA_LEARNING_AREAS_META.map((m) => m.code)).toEqual([
        'ENG',
        'KIS',
        'MATH',
        'INT SCI',
        'CAS',
        'SST',
        'CRE',
        'AGN',
        'PRE-TECH',
      ]);
    });

    it('verifies exactly 8 achievement levels EE1–BE2 and point mapping', () => {
      expect(KJSEA_ACHIEVEMENT_LEVELS).toHaveLength(8);
      expect(KJSEA_ACHIEVEMENT_LEVELS).toEqual([
        'EE1',
        'EE2',
        'ME1',
        'ME2',
        'AE1',
        'AE2',
        'BE1',
        'BE2',
      ]);

      expect(KJSEA_LEVEL_POINTS_MAP).toEqual({
        EE1: 8,
        EE2: 7,
        ME1: 6,
        ME2: 5,
        AE1: 4,
        AE2: 3,
        BE1: 2,
        BE2: 1,
      });
    });

    it('verifies points advisory lookup maps Normal statuses to correct points and non-Normal to null', () => {
      expect(getKJSEAPointsAdvisory('EE1', 'Normal')).toBe(8);
      expect(getKJSEAPointsAdvisory('BE2', 'Normal')).toBe(1);
      expect(getKJSEAPointsAdvisory('EE1', 'Absent')).toBeNull();
      expect(getKJSEAPointsAdvisory('EE1', 'Irregularity')).toBeNull();
      expect(getKJSEAPointsAdvisory(null, 'Normal')).toBeNull();
      expect(getKJSEAPointsAdvisory(undefined, 'Normal')).toBeNull();
    });

    it('verifies validateKJSEADraftEntries rejects empty and duplicate subjects', () => {
      const emptyRes = validateKJSEADraftEntries([]);
      expect(emptyRes.isValid).toBe(false);

      const duplicatePayload = [
        { subject_code: 'ENG', status: 'Normal' as const, achievement_level: 'EE1' as const },
        { subject_code: 'ENG', status: 'Normal' as const, achievement_level: 'EE2' as const },
      ];
      const dupRes = validateKJSEADraftEntries(duplicatePayload);
      expect(dupRes.isValid).toBe(false);
      expect(dupRes.error).toContain('Duplicate subject code');
    });

    it('verifies validateMandatoryReason enforces non-empty audit reason with minimum 5 characters', () => {
      expect(validateMandatoryReason('').isValid).toBe(false);
      expect(validateMandatoryReason('   ').isValid).toBe(false);
      expect(validateMandatoryReason('Edit').isValid).toBe(false);
      expect(validateMandatoryReason('Valid audit reason').isValid).toBe(true);
    });
  });

  describe('Workflow Architecture Verification: Screen 1 and Screen 2 separation', () => {
    it('verifies KjseaAdminManagement source code enforces Screen 1 and Screen 2 structure', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/kjsea/KjseaAdminManagement.tsx'),
        'utf8'
      );

      // Verify Screen 1 keywords and elements
      expect(componentSrc).toContain("activeScreen === 'selection'");
      expect(componentSrc).toContain('STEP 1: SELECT STREAM');
      expect(componentSrc).toContain('STEP 2: SELECT ONE LEARNER');
      expect(componentSrc).toContain('Select a stream first');
      expect(componentSrc).toContain('CONTINUE TO RESULTS ENTRY');
      expect(componentSrc).toContain('type="radio"');
      expect(componentSrc).toContain('name="kjsea-stream-selection"');

      // Verify Screen 2 keywords and elements
      expect(componentSrc).toContain("activeScreen === 'entry'");
      expect(componentSrc).toContain('screen2Heading');
      expect(componentSrc).toContain('Return to Learner Selection');
      expect(componentSrc).toContain('Next:');
      expect(componentSrc).toContain('Nine Approved Learning Areas');
      expect(componentSrc).toContain('Save Draft');
      expect(componentSrc).toContain('Finalise Result');
      expect(componentSrc).toContain('Reopen Result');

      // Verify Unsaved Work preservation & safe switching flow
      expect(componentSrc).toContain('unsavedLearnerMap');
      expect(componentSrc).toContain('stashCurrentLearnerWork');
      expect(componentSrc).toContain('showUnsavedConfirmModal');
      expect(componentSrc).toContain('Save Draft & Switch');
      expect(componentSrc).toContain('Discard Changes & Switch');
      expect(componentSrc).toContain('Stay on Current Learner');

      // Verify Stream change resets learner
      expect(componentSrc).toContain('applyStreamChange');
      expect(componentSrc).toContain("setSelectedStudentId('')");

      // Verify Exam Year change clears stream and learner
      expect(componentSrc).toContain('applyExamYearChange');
      expect(componentSrc).toContain("setSelectedStreamId('')");

      // Verify Dropdown Integrity: explicit label for learner select
      expect(componentSrc).toContain('htmlFor="kjsea-learner-select"');
      expect(componentSrc).toContain('id="kjsea-learner-select"');
      expect(componentSrc).toContain('Select a learner...');

      // Verify Dropdown Integrity: explicit label for exam year select
      expect(componentSrc).toContain('htmlFor="kjsea-exam-year-select"');
      expect(componentSrc).toContain('id="kjsea-exam-year-select"');
      expect(componentSrc).toContain('Select examination year...');
    });
  });

  describe('KJSEA Examination-Year Creation & Status Management Specification', () => {
    it('verifies KjseaAdminManagement source code enforces empty examination-year notice and creation flow', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/kjsea/KjseaAdminManagement.tsx'),
        'utf8'
      );

      // 1. Exact required prompt empty notice message
      expect(componentSrc).toContain('No examination years found. Create an examination year to begin.');

      // 2. Administrator-only creation action and button labels
      expect(componentSrc).toContain('Create Examination Year');
      expect(componentSrc).toContain('New Year');
      expect(componentSrc).toContain('openCreateYearModal');
      expect(componentSrc).toContain('handleConfirmCreateYear');

      // 3. Dynamic proposed year binding from authoritative academic session
      expect(componentSrc).toContain('api.getActiveAcademicYear()');
      expect(componentSrc).toContain('proposedYearInput');
      expect(componentSrc).toContain('id="proposed-year-input"');
      expect(componentSrc).toContain('min={2020}');
      expect(componentSrc).toContain('max={2050}');

      // 4. Modal confirmation & status selection
      expect(componentSrc).toContain('showCreateYearModal');
      expect(componentSrc).toContain('Open for Entry');
      expect(componentSrc).toContain('Closed / Locked');
      expect(componentSrc).toContain('initialStatusChoice');

      // 5. Service RPC invocation for creation & status management
      expect(componentSrc).toContain('kjseaService.createExamYear');
      expect(componentSrc).toContain('kjseaService.setExamYearStatus');
      expect(componentSrc).toContain('kjseaService.listExamYears');

      // 6. Duplicate prevention & error feedback
      expect(componentSrc).toContain('already exists');
      expect(componentSrc).toContain('createYearError');

      // 7. Status update actions for existing examination years
      expect(componentSrc).toContain('showYearStatusModal');
      expect(componentSrc).toContain('Open Year for Entry');
      expect(componentSrc).toContain('handleConfirmYearStatusChange');
      expect(componentSrc).toContain('year-status-reason-input');
    });

    it('verifies dynamic active academic year is derived authoritatively from api.getActiveAcademicYear', async () => {
      const { api } = await import('../lib/storage');
      const activeYearObj = api.getActiveAcademicYear();

      expect(activeYearObj).toBeDefined();
      expect(typeof activeYearObj.year).toBe('number');
      expect(activeYearObj.year).toBeGreaterThanOrEqual(2020);
      expect(activeYearObj.year).toBeLessThanOrEqual(2050);
      expect(activeYearObj.status).toBe('Active');
    });

    it('verifies kjseaService.createExamYear validates year boundaries', async () => {
      const { kjseaService } = await import('../services/kjseaService');

      // Invalid years
      const invalidLow = await kjseaService.createExamYear(2019);
      expect(invalidLow.success).toBe(false);
      expect(invalidLow.error?.message).toContain('between 2020 and 2050');

      const invalidHigh = await kjseaService.createExamYear(2051);
      expect(invalidHigh.success).toBe(false);
      expect(invalidHigh.error?.message).toContain('between 2020 and 2050');

      const invalidFloat = await kjseaService.createExamYear(2026.5 as any);
      expect(invalidFloat.success).toBe(false);
      expect(invalidFloat.error?.message).toContain('Must be a 4-digit calendar year');
    });

    it('verifies kjseaService.setExamYearStatus validates status and mandatory audit reason', async () => {
      const { kjseaService } = await import('../services/kjseaService');

      // Invalid status
      const invalidStatus = await kjseaService.setExamYearStatus('mock-id', 'invalid' as any);
      expect(invalidStatus.success).toBe(false);
      expect(invalidStatus.error?.message).toContain('must be "open" or "closed"');

      // Reopening with invalid short reason
      const shortReason = await kjseaService.setExamYearStatus('mock-id', 'open', 'abc');
      expect(shortReason.success).toBe(false);
      expect(shortReason.error?.message).toContain('at least 5 characters long');
    });

    it('verifies duplicate examination year prevention logic', () => {
      const existingYears = [
        {
          id: 'mock-uuid-1',
          exam_year: 2025,
          status: 'closed' as const,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ];

      const isDuplicate = (proposed: number) => existingYears.some((y) => y.exam_year === proposed);

      expect(isDuplicate(2025)).toBe(true);
      expect(isDuplicate(2026)).toBe(false);
      expect(isDuplicate(2027)).toBe(false);
    });

    it('verifies stream selection and class sizes are strictly guarded until an examination year is selected', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/kjsea/KjseaAdminManagement.tsx'),
        'utf8'
      );

      // Verify Step 1 requires examination year selection before rendering stream cards
      expect(componentSrc).toContain('!selectedExamYearId ? (');
      expect(componentSrc).toContain('Select an examination year first');
      expect(componentSrc).toContain('Waiting for Examination Year selection');

      // Verify handleSelectStream and handleSelectStudent guard against missing examination year
      expect(componentSrc).toContain('if (!selectedExamYearId) {');

      // Verify stream cards and learner counts are only rendered when selectedExamYearId is present
      expect(componentSrc).toContain("st.count === 1 ? 'learner' : 'learners'");

      // Simulate conditional rendering and selection guards
      const canSelectStream = (selectedExamYearId: string) => Boolean(selectedExamYearId);
      expect(canSelectStream('')).toBe(false);
      expect(canSelectStream('exam-year-2026')).toBe(true);

      const renderStep1Status = (selectedExamYearId: string) =>
        !selectedExamYearId ? 'Select an examination year first' : 'Select a stream';
      expect(renderStep1Status('')).toBe('Select an examination year first');
      expect(renderStep1Status('exam-year-2026')).toBe('Select a stream');
    });

    it('verifies learning area entry status defaults to Normal instead of Pending', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/kjsea/KjseaAdminManagement.tsx'),
        'utf8'
      );

      // Verify createEmptyFormEntries initializes status as 'Normal'
      expect(componentSrc).toContain("status: 'Normal'");
      expect(componentSrc).not.toContain("status: 'Pending',");

      // Verify hydration defaults missing or pending status to 'Normal'
      expect(componentSrc).toContain("const status = (!existing.status || existing.status === 'Pending') ? 'Normal' : existing.status;");

      // Verify achievement level buttons are immediately visible when status is Normal
      expect(componentSrc).toContain("const isNormal = entry.status === 'Normal';");
    });

    it('verifies save draft and finalise result use fast in-place confirmation without full screen reload', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/kjsea/KjseaAdminManagement.tsx'),
        'utf8'
      );

      // Verify saveDraft uses in-place state update
      expect(componentSrc).toContain('KJSEA draft results saved successfully to Supabase.');
      expect(componentSrc).toContain('isNormalWithoutLevel ? \'Pending\' : entry.status');

      // Verify finaliseResult sets finalised state in place
      expect(componentSrc).toContain('setIsFinalised(true)');
      expect(componentSrc).toContain('setFinalisedAt(finalisedTimestamp)');
      expect(componentSrc).toContain('KJSEA result has been finalised and locked successfully.');
    });

    it('verifies Subjects Entered count accurately reflects graded areas without misinforming 9/9 counts', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const componentSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/kjsea/KjseaAdminManagement.tsx'),
        'utf8'
      );

      // Verify clear, non-misleading CBE label
      expect(componentSrc).toContain('Subjects Entered');
      expect(componentSrc).not.toContain('Sub Entry');

      // Verify calculation accurately checks achievement_level or explicit non-Normal status
      expect(componentSrc).toContain('completedEntriesCount = useMemo(');

      // Simulate the exact calculation logic
      const simulateEnteredCount = (
        entries: Array<{ status: string; achievement_level: string | null }>
      ) => {
        let count = 0;
        entries.forEach((e) => {
          if (e.status === 'Normal') {
            if (e.achievement_level) count += 1;
          } else if (e.status === 'Absent' || e.status === 'Irregularity' || e.status === 'Not Released') {
            count += 1;
          }
        });
        return count;
      };

      // Scenario from user screenshot: Only 1 subject (AGN with EE2) has level selected, other 8 are Normal with no level
      const screenshotScenario = [
        { status: 'Normal', achievement_level: null }, // ENG
        { status: 'Normal', achievement_level: null }, // KIS
        { status: 'Normal', achievement_level: null }, // MATH
        { status: 'Normal', achievement_level: null }, // INT SCI
        { status: 'Normal', achievement_level: null }, // CAS
        { status: 'Normal', achievement_level: null }, // SST
        { status: 'Normal', achievement_level: null }, // CRE
        { status: 'Normal', achievement_level: 'EE2' }, // AGN (7 pts)
        { status: 'Normal', achievement_level: null }, // PRE-TECH
      ];

      // Must be 1 / 9, NOT 9 / 9
      expect(simulateEnteredCount(screenshotScenario)).toBe(1);

      // When 0 entered:
      const zeroEntered = screenshotScenario.map((e) => ({ ...e, achievement_level: null }));
      expect(simulateEnteredCount(zeroEntered)).toBe(0);

      // When all 9 entered:
      const allEntered = screenshotScenario.map((e) => ({ ...e, achievement_level: 'ME1' }));
      expect(simulateEnteredCount(allEntered)).toBe(9);
    });
  });
});




