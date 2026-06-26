import { usePrepStarted } from '../context/ExamPreppContext';
import EmptyState from '../components/EmptyState';
import PrepResults from '../components/PrepResults';

/**
 * Prep — the "Workspace" tab (Jennifer's Figma, iPhone screen 4).
 *
 * If a prep run is in progress or done, show the shared PrepResults view so the
 * user's work is still here when they return to the tab. Otherwise show the
 * empty state inviting a New Prep. State lives in the app-level ExamPrepp
 * context, so it survives switching between tabs within the session.
 */
export default function Prep({ className = '' }: { className?: string }) {
  const started = usePrepStarted();

  if (started) return <PrepResults className={className} />;

  return <EmptyState className={className} message="Upload your past questions" />;
}
