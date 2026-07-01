import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, Download, ShieldCheck } from './icons';

export type BadgeState = 'idle' | 'minting' | 'minted' | 'pending' | 'error';

/**
 * StudyGuideView — focused study-guide reader (Jennifer's Figma, iPhone 16-13).
 *
 * A full-screen overlay: a back header, a "Your Study Guide" + Download PDF row,
 * a scrollable bordered card rendering the guide as Markdown, and a FIXED footer
 * with "Turn into Flashcards" / "Turn into Quiz" — so the CTAs and Download stay
 * in view while only the guide body scrolls.
 *
 * Reused for both a freshly generated guide and a saved one opened from history.
 */
export default function StudyGuideView({
  title,
  guide,
  backLabel = 'Workspace',
  onBack,
  onTurnFlashcards,
  onTurnQuiz,
  flashcardsLoading = false,
  flashcardsError = null,
  badgeState = 'idle',
  badgeExplorerUrl = null,
  onClaimBadge,
}: {
  title: string;
  guide: string;
  backLabel?: string;
  onBack: () => void;
  onTurnFlashcards: () => void;
  onTurnQuiz: () => void;
  flashcardsLoading?: boolean;
  flashcardsError?: string | null;
  badgeState?: BadgeState;
  badgeExplorerUrl?: string | null;
  onClaimBadge?: () => void;
}) {
  const articleRef = useRef<HTMLElement>(null);

  // Lock background scroll + Escape to go back while the reader is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onBack]);

  async function handleDownload() {
    if (!articleRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const safeName = (title || 'study-guide').replace(/[^\w\s-]/g, '').trim() || 'study-guide';
    await html2pdf()
      .set({
        margin: 12,
        filename: `${safeName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        // Always render the PDF light (readable) even if the app is in dark mode —
        // onclone strips `dark` from the cloned DOM so prose stays dark-on-white.
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (doc: Document) => doc.documentElement.classList.remove('dark'),
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(articleRef.current)
      .save();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Back header */}
      <header className="shrink-0 border-b border-ink/10 bg-card px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 font-display text-xl font-bold text-ink transition hover:text-indigo"
        >
          <ChevronLeft className="h-6 w-6" />
          {backLabel}
        </button>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-4 py-5 sm:px-6">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl font-bold sm:text-2xl">Your Study Guide</h1>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onClaimBadge && (
              <BadgeButton state={badgeState} explorerUrl={badgeExplorerUrl} onClaim={onClaimBadge} />
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex shrink-0 items-center gap-2 rounded-[12px] border border-indigo/40 px-4 py-2 text-sm font-semibold text-indigo transition hover:bg-indigo/5"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-ink/10 bg-card p-5 sm:p-6">
          <article
            ref={articleRef}
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-ink prose-a:text-indigo prose-strong:text-ink marker:text-ink/40"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide}</ReactMarkdown>
          </article>
        </div>
      </div>

      {/* Fixed footer — CTAs always in view */}
      <footer className="shrink-0 border-t border-ink/10 bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onTurnFlashcards}
            disabled={flashcardsLoading}
            className="rounded-[14px] border border-ink/15 px-4 py-3 text-center transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="block font-display text-sm font-bold text-ink">
              {flashcardsLoading ? 'Generating…' : 'Turn into Flashcards'}
            </span>
            <span className="block text-xs text-ink/55">Create smart flashcards</span>
          </button>
          <button
            type="button"
            onClick={onTurnQuiz}
            className="rounded-[14px] bg-indigo px-4 py-3 text-center transition hover:bg-indigo/90"
          >
            <span className="block font-display text-sm font-bold text-white">Turn into Quiz</span>
            <span className="block text-xs text-white/70">Generate practice questions</span>
          </button>
        </div>
        {flashcardsError && (
          <p className="mx-auto mt-2 max-w-2xl text-sm text-red-600">{flashcardsError}</p>
        )}
      </footer>
    </div>
  );
}

/**
 * BadgeButton — the "Claim badge" affordance (additive; never blocks).
 * minted → links to the Solana Explorer; pending/minting → disabled soft states.
 */
function BadgeButton({
  state,
  explorerUrl,
  onClaim,
}: {
  state: BadgeState;
  explorerUrl: string | null;
  onClaim: () => void;
}) {
  if (state === 'minted' && explorerUrl) {
    return (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-[12px] border border-success/40 px-4 py-2 text-sm font-semibold text-success transition hover:bg-success/5"
      >
        <ShieldCheck className="h-4 w-4" />
        Badge minted ↗
      </a>
    );
  }

  const label =
    state === 'minting'
      ? 'Minting…'
      : state === 'pending'
        ? 'Credential pending'
        : state === 'error'
          ? 'Retry badge'
          : 'Claim badge';
  const disabled = state === 'minting' || state === 'pending';

  return (
    <button
      type="button"
      onClick={onClaim}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-[12px] bg-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <ShieldCheck className="h-4 w-4" />
      {label}
    </button>
  );
}
