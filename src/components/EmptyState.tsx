import { Link } from 'react-router-dom';
import { Plus } from './icons';

/**
 * EmptyState — the shared zero-state for Workspace, Badges and Flashcards.
 *
 * Mirrors Jennifer's Figma (iPhone screens 4 / 9 / 10): a centered "files"
 * illustration, a single line of guidance, and the "New Prep" CTA. The three
 * screens differ only in `message`, so this is one component reused three times.
 *
 * The illustration stands in for her uploaded `Purple_Files_Icon` asset — swap
 * the SVG for the real PNG when it's exported.
 */
export default function EmptyState({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
    >
      <FilesIllustration className="h-36 w-auto" />

      <p className="mt-6 max-w-xs font-display text-base text-ink/70">{message}</p>

      <Link
        to="/app/prep"
        className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-indigo/90"
      >
        <Plus className="h-4 w-4" />
        New Prep
      </Link>
    </section>
  );
}

/**
 * Decorative stacked-files mark in the brand's indigo/lavender family.
 * Placeholder for the design's purple files illustration.
 */
function FilesIllustration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 110" fill="none" aria-hidden="true">
      {/* back sheet */}
      <rect x="28" y="14" width="64" height="80" rx="8" fill="var(--color-lavender)" opacity="0.55" />
      {/* mid sheet */}
      <rect x="20" y="22" width="64" height="80" rx="8" fill="var(--color-lavender)" />
      {/* front folder */}
      <path
        d="M12 36a8 8 0 0 1 8-8h20l8 9h32a8 8 0 0 1 8 8v37a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8V36Z"
        fill="var(--color-indigo)"
      />
      {/* upward arrow — evokes "upload" */}
      <path
        d="M52 78V58m0 0-8 8m8-8 8 8"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
