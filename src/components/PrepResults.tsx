import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useExamPreppContext } from '../context/ExamPreppContext';
import { Notes, Book } from './icons';
import markUrl from '../assets/examprepp-mark-animated.svg';

/**
 * PrepResults — the post-Analyze processing/results view (inspired by the dev
 * harness). Shared by the Workspace tab (/app/prep) and the New Prep form
 * (/app/prep/new) so a user's in-progress run shows from either entry point.
 *
 * Flow: the ExamPrepp mark animates while a single inline "thinking" message
 * cycles through the active phase's steps; predictions reveal with probability
 * bars; THEN the Phase-2 "generating study guide" thinking shows; finally the
 * guide opens in an artifact panel (drawer on desktop, bottom sheet on mobile).
 */
const ANALYZING_MESSAGES = [
  'Reading your past questions…',
  'Analyzing question patterns…',
  'Identifying high-probability topics…',
];
const GENERATING_MESSAGES = [
  'Reviewing your lecture notes…',
  'Generating your study guide…',
  'Putting the finishing touches…',
];

type Prediction = { topic: string; probability: number; reasoning: string };

export default function PrepResults({ className = '' }: { className?: string }) {
  const {
    pastQuestionFiles,
    isAnalyzing,
    isGenerating,
    predictions,
    course,
    summary,
    guide,
    topicsCovered,
    phaseOneError,
    phaseOneWarning,
    phaseTwoError,
    reset,
  } = useExamPreppContext();

  const thinkingMessage = useThinkingMessage(isAnalyzing, isGenerating);

  // Study-guide artifact panel: lock background scroll + Escape to close.
  const [guideOpen, setGuideOpen] = useState(false);
  const panelOpen = guideOpen && Boolean(guide);
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGuideOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);

  return (
    <>
      <section className={className}>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold sm:text-2xl">Your Prep</h1>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:border-black/30 hover:text-ink"
          >
            Start over
          </button>
        </div>

        {/* Uploaded past-question chips */}
        <ul className="mt-4 space-y-2">
          {pastQuestionFiles.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-[14px] border border-black/10 bg-white px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender text-indigo">
                <Notes className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-ink/50">{formatSize(file.size)}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Phase 1 thinking */}
        {isAnalyzing && <ThinkingRow message={thinkingMessage} />}
        {phaseOneError && <ErrorNote>{phaseOneError}</ErrorNote>}
        {phaseOneWarning && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {phaseOneWarning}
          </p>
        )}

        {/* Predictions */}
        {predictions.length > 0 && (
          <section className="mt-4 rounded-[14px] border border-black/10 bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Predicted Exam Topics</h2>
            {course && <p className="mt-1 text-sm text-ink/60">Based on {course}</p>}
            {summary && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">
                {summary}
              </p>
            )}
            <ol className="mt-4 space-y-4">
              {(predictions as Prediction[]).map((p, i) => (
                <li key={p.topic}>
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                    <span>
                      {i + 1}. {p.topic}
                    </span>
                    <span className="shrink-0 text-indigo">{p.probability}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-indigo transition-[width] duration-700"
                      style={{ width: `${p.probability}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink/55">{p.reasoning}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Phase 2 thinking — only after predictions exist */}
        {isGenerating && <ThinkingRow message={thinkingMessage} />}
        {phaseTwoError && <ErrorNote>{phaseTwoError}</ErrorNote>}

        {/* Study guide artifact card */}
        {guide && (
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="mt-4 flex w-full items-center gap-4 rounded-[14px] border border-black/10 bg-white p-5 text-left transition hover:border-indigo/40 hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender text-indigo">
              <Book className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold">Your study guide</span>
              <span className="block truncate text-xs text-ink/50">
                {topicsCovered.length > 0 ? `${topicsCovered.length} topics · ` : ''}opens in a panel
              </span>
            </span>
            <span className="shrink-0 rounded-lg bg-indigo px-3 py-1.5 text-sm font-semibold text-white">
              Open
            </span>
          </button>
        )}
      </section>

      {/* Study-guide reader panel — drawer on desktop, bottom sheet on mobile.
          Backdrop spans all sizes (lighter dim on desktop) so tapping outside
          closes it everywhere. */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:bg-black/20"
            onClick={() => setGuideOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Study guide"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:w-[480px] lg:rounded-t-none lg:border-l lg:border-black/10"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2 className="font-display font-bold">Your study guide</h2>
                {topicsCovered.length > 0 && (
                  <p className="text-xs text-ink/50">{topicsCovered.length} topics covered</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="Close study guide"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-ink/60 transition hover:bg-black/5 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <article className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-ink prose-a:text-indigo prose-strong:text-ink marker:text-ink/40">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide}</ReactMarkdown>
              </article>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ── Thinking state ────────────────────────────────
   Cycles a single inline message through the active phase's list, so the AI
   reads as "thinking → still thinking → almost done" rather than a static line. */
function useThinkingMessage(isAnalyzing: boolean, isGenerating: boolean) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const list = isAnalyzing ? ANALYZING_MESSAGES : isGenerating ? GENERATING_MESSAGES : null;
    if (!list) return;
    let i = 0;
    setMessage(list[0]);
    const id = setInterval(() => {
      i = Math.min(i + 1, list.length - 1);
      setMessage(list[i]);
    }, 2200);
    return () => clearInterval(id);
  }, [isAnalyzing, isGenerating]);
  return message;
}

function ThinkingRow({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-black/10 bg-white px-5 py-5">
      <img src={markUrl} alt="" aria-hidden="true" className="h-8 w-8" />
      <p className="font-display text-base text-indigo">{message}</p>
    </div>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">Error: {children}</p>
  );
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
