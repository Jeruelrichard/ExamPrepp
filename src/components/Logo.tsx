import markUrl from '../assets/examprepp-mark-static.svg';

/**
 * ExamPrepp logo: the "Rising Insight" mark + the wordmark.
 * Wordmark uses Dancing Script (brand font) — "Exam" in ink, "Prepp" in indigo —
 * mirroring Jennifer's two-tone script logo.
 */
export default function Logo({
  className = '',
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const examColor = tone === 'light' ? 'text-white' : 'text-ink';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={markUrl} alt="" className="h-6 w-auto" aria-hidden="true" />
      <span className="font-wordmark text-2xl leading-none">
        <span className={examColor}>Exam</span>
        <span className="text-indigo">Prepp</span>
      </span>
    </span>
  );
}
