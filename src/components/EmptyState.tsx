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
 * Decorative "sad folder" mascot — placeholder for Jennifer's purple files
 * illustration. Uses a softer medium-purple (not the deep brand indigo) to match
 * the design's lighter, friendlier mark, with sparkles + a glum face.
 */
function FilesIllustration({ className = '' }: { className?: string }) {
  const fill = '#9b8bea';
  const flap = '#8a79e4';
  const line = '#5d4fc7';
  const accent = '#7c6fd9';
  return (
    <svg className={className} viewBox="0 0 120 116" fill="none" aria-hidden="true">
      {/* sparkles + dots */}
      <path d="M30 22l1.6 4.4L36 28l-4.4 1.6L30 34l-1.6-4.4L24 28l4.4-1.6Z" fill={accent} />
      <path d="M92 26l1.2 3.4L96 31l-2.8 1.6L92 36l-1.2-3.4L88 31l2.8-1.6Z" fill={accent} />
      <circle cx="100" cy="46" r="2.4" fill={accent} />
      <circle cx="22" cy="86" r="3" fill="none" stroke={accent} strokeWidth="2.4" />
      <circle cx="98" cy="84" r="2.6" fill="none" stroke={accent} strokeWidth="2.4" />

      {/* back tab */}
      <path d="M30 40h22l8 8h-30Z" fill={flap} stroke={line} strokeWidth="3" strokeLinejoin="round" />
      {/* folder body */}
      <path
        d="M28 44h64a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V48a4 4 0 0 1 4-4Z"
        fill={fill}
        stroke={line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* front flap */}
      <path
        d="M22 58l6-2h64l6 2-6 30a4 4 0 0 1-4 3H32a4 4 0 0 1-4-3Z"
        fill={flap}
        stroke={line}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* glum face */}
      <circle cx="50" cy="72" r="2.6" fill={line} />
      <circle cx="70" cy="72" r="2.6" fill={line} />
      <path d="M52 82a8 8 0 0 1 16 0" stroke={line} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
