import { Link } from 'react-router-dom';

/**
 * HistoryCard — a lavender list item for the Workspace / Flashcards history
 * (Jennifer's Figma, iPhone 16-19 / 16-21): a bold title (truncated) over a
 * muted date, linking to the item's detail screen.
 */
export default function HistoryCard({
  to,
  title,
  date,
}: {
  to: string;
  title: string;
  date: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-[14px] bg-lavender px-5 py-4 transition hover:brightness-95"
    >
      <p className="truncate font-display text-base font-bold text-ink sm:text-lg">{title}</p>
      <p className="mt-1 text-sm text-ink/55">{date}</p>
    </Link>
  );
}

/** Format an ISO timestamp as e.g. "June 26, 2026". */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
