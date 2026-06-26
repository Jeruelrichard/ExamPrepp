import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useExamPrepp } from '../hooks/useExamPrepp';

/**
 * ExamPreppProvider — holds ONE useExamPrepp() instance for the whole
 * authenticated app, mounted in AppLayout (which stays mounted across tab
 * switches). This is why a user can leave the Workspace tab and come back to
 * their in-progress predictions / study guide instead of a fresh "New Prep".
 *
 * Scope: this persists for the session (while the app is mounted). It does NOT
 * survive a full page reload or a new login — that needs Supabase (DB + Storage
 * for the uploaded files). See the dashboard "Saved Preps" history (P1).
 */
type ExamPreppValue = ReturnType<typeof useExamPrepp>;

const ExamPreppContext = createContext<ExamPreppValue | null>(null);

export function ExamPreppProvider({ children }: { children: ReactNode }) {
  const value = useExamPrepp();
  return <ExamPreppContext.Provider value={value}>{children}</ExamPreppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useExamPreppContext() {
  const ctx = useContext(ExamPreppContext);
  if (!ctx) {
    throw new Error('useExamPreppContext must be used within an ExamPreppProvider');
  }
  return ctx;
}

/**
 * Has a prep run been started (running, has predictions/guide, or errored)?
 * Drives whether the Workspace shows the results view vs. the empty/upload state.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePrepStarted() {
  const { isAnalyzing, isGenerating, predictions, guide, phaseOneError } = useExamPreppContext();
  return (
    isAnalyzing || isGenerating || predictions.length > 0 || Boolean(guide) || Boolean(phaseOneError)
  );
}
