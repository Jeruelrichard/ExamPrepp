import { Link } from 'react-router-dom';
import { Plus } from './icons';
import uploadFolderUrl from '../assets/folder-upload.svg';

/**
 * EmptyState — the shared zero-state for Workspace, Badges and Flashcards
 * (Jennifer's Figma, iPhone screens 4 / 9 / 10): a centered folder illustration,
 * a single line of guidance, and the "New Prep" CTA.
 *
 * Defaults to Jen's "upload" folder mark; the Dashboard passes its own "sad"
 * folder via `icon`.
 */
export default function EmptyState({
  message,
  icon = uploadFolderUrl,
  className = '',
}: {
  message: string;
  icon?: string;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
    >
      <img src={icon} alt="" aria-hidden="true" className="h-36 w-auto" />

      <p className="mt-6 max-w-xs font-display text-base text-ink/70">{message}</p>

      <Link
        to="/app/prep/new"
        className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-indigo/90"
      >
        <Plus className="h-4 w-4" />
        New Prep
      </Link>
    </section>
  );
}
