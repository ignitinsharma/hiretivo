'use client';
import { useCallback, useReducer } from 'react';
import { WizardStep } from '@/constants/enums';
import type { ApplyWizardState } from '@/modules/seeker/apply/types/apply.types';
import type { ResumeDocument } from '@/modules/seeker/profile/types/resume-document.types';

interface WizardState extends ApplyWizardState {
  step: WizardStep;
}

type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_RESUME'; resume: ResumeDocument }
  | { type: 'SET_COVER_LETTER'; coverLetter: string }
  | { type: 'SET_RESERVATION_HANDLE'; reservationHandle: string | null }
  | { type: 'MARK_SAVED' };

const INITIAL_STATE: WizardState = {
  step: WizardStep.OPTIMIZE,
  resume: null,
  coverLetter: '',
  reservationHandle: null,
  isDirty: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_RESUME':
      return { ...state, resume: action.resume, isDirty: true };
    case 'SET_COVER_LETTER':
      return { ...state, coverLetter: action.coverLetter, isDirty: true };
    case 'SET_RESERVATION_HANDLE':
      return { ...state, reservationHandle: action.reservationHandle };
    case 'MARK_SAVED':
      return { ...state, isDirty: false };
    default:
      return state;
  }
}

/* useApplyWizard
 * Holds the apply wizard's local step + editable-artifact state (tailored
 * resume, cover letter, credit-reservation handle). Persistence to the
 * Application record happens in each step component via PATCH, not here.
 * @returns { state, goToStep, setResume, setCoverLetter, setReservationHandle, markSaved } */
export function useApplyWizard() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

  const goToStep = useCallback((step: WizardStep) => dispatch({ type: 'SET_STEP', step }), []);
  const setResume = useCallback(
    (resume: ResumeDocument) => dispatch({ type: 'SET_RESUME', resume }),
    [],
  );
  const setCoverLetter = useCallback(
    (coverLetter: string) => dispatch({ type: 'SET_COVER_LETTER', coverLetter }),
    [],
  );
  const setReservationHandle = useCallback(
    (reservationHandle: string | null) => dispatch({ type: 'SET_RESERVATION_HANDLE', reservationHandle }),
    [],
  );
  const markSaved = useCallback(() => dispatch({ type: 'MARK_SAVED' }), []);

  return { state, goToStep, setResume, setCoverLetter, setReservationHandle, markSaved };
}
