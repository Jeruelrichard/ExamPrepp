import EmptyState from '../components/EmptyState';

/**
 * Prep — the "Workspace" tab (Jennifer's Figma, iPhone screen 4).
 *
 * Shown as the empty/zero state for now. This route will grow into the real
 * Phase 1 (past-question upload + predictions) and Phase 2 (notes upload +
 * study guide) flow, built from the /dev prototype and wired to useExamPrepp.
 */
export default function Prep({ className = '' }: { className?: string }) {
  return <EmptyState className={className} message="Upload your past questions" />;
}
