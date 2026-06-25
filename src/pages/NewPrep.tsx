import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useExamPrepp } from '../hooks/useExamPrepp';
import { UploadCloud, Notes, Book } from '../components/icons';
import markUrl from '../assets/examprepp-mark-static.svg';

/**
 * NewPrep — the "Upload Your Materials" workspace screen (Jennifer's Figma,
 * iPhone 16-16) and the post-Analyze flow (inspired by the dev harness).
 *
 * Two views, switched on `started`:
 *  1. Upload form — gated: Lecture Notes muted until a past question is added;
 *     Analyze muted until lecture notes are added. A red advisory shows for
 *     fewer than 3 past questions (non-blocking).
 *  2. Processing / results — pressing Analyze runs both Gemini phases via
 *     runAll(). The ExamPrepp mark animates while a single inline "thinking"
 *     message cycles; predictions reveal with probability bars; THEN the
 *     Phase-2 "generating study guide" thinking shows; finally the guide opens
 *     in an artifact panel (drawer on desktop, bottom sheet on mobile).
 *
 * NOTE: the animated logo SVG isn't in the repo yet — this uses the static mark
 * with a temporary pulse. Swap `markUrl` for the animated asset when provided.
 */
const MIN_PAST_QUESTIONS = 3;

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

export default function NewPrep({ className = '' }: { className?: string }) {
  const {
    pastQuestionFiles,
    setPastQuestionFiles,
    lectureNoteFiles,
    setLectureNoteFiles,
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
    runAll,
    reset,
  } = useExamPrepp();

  const hasPastQuestions = pastQuestionFiles.length > 0;
  const hasNotes = lectureNoteFiles.length > 0;
  const fewPastQuestions = hasPastQuestions && pastQuestionFiles.length < MIN_PAST_QUESTIONS;
  const canAnalyze = hasPastQuestions && hasNotes;

  const running = isAnalyzing || isGenerating;
  const started = running || predictions.length > 0 || Boolean(guide) || Boolean(phaseOneError);

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

  // ── Upload form ──────────────────────────────────
  if (!started) {
    return (
      <section className={className}>
        <div className="rounded-[14px] border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lavender text-indigo">
                <UploadCloud className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold sm:text-2xl">Upload Your Materials</h1>
                <p className="text-sm text-ink/60">Add your past questions and lecture notes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:border-black/30 hover:text-ink"
            >
              Reset
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <UploadColumn
              title="Past Questions"
              subtitle="Upload past exam questions"
              icon={Notes}
              files={pastQuestionFiles}
              onPick={setPastQuestionFiles}
            />
            <UploadColumn
              title="Lecture Notes"
              subtitle="Upload your lecture slides or notes"
              icon={Book}
              files={lectureNoteFiles}
              onPick={setLectureNoteFiles}
              disabled={!hasPastQuestions}
            />
          </div>

          {fewPastQuestions && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
              You've added {pastQuestionFiles.length} past question
              {pastQuestionFiles.length === 1 ? '' : 's'}. For the most accurate predictions,
              upload at least 3–5 years of past papers.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => runAll()}
            disabled={!canAnalyze}
            className="w-full max-w-[240px] rounded-[14px] bg-indigo px-6 py-3 font-display font-semibold text-ink transition hover:bg-indigo/90 disabled:cursor-not-allowed disabled:bg-indigo/40 disabled:text-ink/40 disabled:hover:bg-indigo/40"
          >
            Analyze
          </button>
        </div>
      </section>
    );
  }

  // ── Processing / results ─────────────────────────
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

      {/* Study-guide reader panel — drawer on desktop, bottom sheet on mobile */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setGuideOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Study guide"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl lg:inset-x-auto lg:inset-y-0 lg:bottom-auto lg:right-0 lg:max-h-none lg:w-[480px] lg:rounded-t-none lg:border-l lg:border-black/10"
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
            <div className="overflow-y-auto px-5 py-5">
              <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink/80">
                {guide}
              </pre>
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
      {/* TODO: swap markUrl for the animated ExamPrepp SVG when provided. */}
      <img src={markUrl} alt="" aria-hidden="true" className="h-7 w-7 animate-pulse" />
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

/* ── Upload column ─────────────────────────────── */

function UploadColumn({
  title,
  subtitle,
  icon: Icon,
  files,
  onPick,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  files: File[];
  onPick: (files: File[]) => void;
  disabled?: boolean;
}) {
  const status =
    files.length === 0
      ? 'No file selected'
      : files.length === 1
        ? files[0].name
        : `${files.length} files selected`;

  return (
    <div
      className={`flex flex-col rounded-[14px] bg-lavender p-4 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/50 text-indigo">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-base font-bold sm:text-lg">{title}</h2>
      </div>
      <p className="mt-3 text-xs text-ink/70 sm:text-sm">{subtitle}</p>
      <p className="mt-3 max-w-full truncate text-xs text-ink/60" title={status}>
        {status}
      </p>
      <label
        className={`mt-3 w-full rounded-[12px] px-4 py-2.5 text-center text-sm font-semibold text-white transition ${
          disabled ? 'pointer-events-none bg-indigo/60' : 'cursor-pointer bg-indigo hover:bg-indigo/90'
        }`}
      >
        Choose file
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          disabled={disabled}
          className="hidden"
          onChange={(e) => onPick(Array.from(e.target.files ?? []))}
        />
      </label>
    </div>
  );
}
