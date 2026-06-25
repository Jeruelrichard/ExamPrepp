// TEMPORARY scratch harness for manually testing useExamPrepp().
// Prototypes the UNIFIED flow: upload past questions, then lecture materials
// (gated until past questions exist), then one "Predict & Build" press.
// The UI reveals in stages — analyzing → predictions → thinking → study guide —
// while the hook runs the two Gemini prompts back-to-back under the hood.
//
// The study guide opens as a contained "artifact" panel (right-side drawer on
// desktop, bottom sheet on mobile) instead of dumping a wall of markdown onto
// the page. Safe to delete once the real /app/prep screen is built.

import { useEffect, useState } from 'react';
import { useExamPrepp } from '../hooks/useExamPrepp';

function fileNames(fileList: File[]) {
  return Array.from(fileList).map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`);
}

export default function HookTestHarness() {
  const {
    pastQuestionFiles,
    isAnalyzing,
    predictions,
    course,
    summary,
    followUp,
    phaseOneError,
    phaseOneWarning,
    lectureNoteFiles,
    isGenerating,
    guide,
    topicsCovered,
    phaseTwoError,
    setPastQuestionFiles,
    setLectureNoteFiles,
    runAll,
    reset,
  } = useExamPrepp();

  const hasPastQuestions = pastQuestionFiles.length > 0;
  const hasNotes = lectureNoteFiles.length > 0;
  const running = isAnalyzing || isGenerating;
  const canSend = hasPastQuestions && hasNotes && !running;

  // Study-guide "artifact" panel open/closed.
  const [guideOpen, setGuideOpen] = useState(false);
  const panelOpen = guideOpen && Boolean(guide);

  // While the panel is open: lock background scroll + allow Escape to close.
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
      <div className="mx-auto max-w-2xl px-6 py-10 font-body text-ink">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Prep flow — dev harness</h1>
          <button
            onClick={reset}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-semibold text-ink/70 hover:border-black/30"
          >
            Reset
          </button>
        </div>
        <p className="mt-1 text-sm text-ink/50">
          Upload past questions → unlock lecture materials → one press does both phases.
        </p>

        {/* ── Upload ─────────────────────────────── */}
        <div className="mt-8 space-y-6 rounded-[14px] border border-black/10 bg-surface p-6">
          {/* Step 1: past questions */}
          <div>
            <label className="block text-sm font-semibold">1. Past questions</label>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              disabled={running}
              onChange={(e) => setPastQuestionFiles(Array.from(e.target.files ?? []))}
              className="mt-2 block w-full text-sm"
            />
            <p className="mt-1 text-xs text-ink/50">
              {hasPastQuestions ? fileNames(pastQuestionFiles).join(', ') : 'No files yet'}
            </p>
          </div>

          {/* Step 2: lecture materials — gated until past questions exist */}
          <div className={hasPastQuestions ? '' : 'pointer-events-none opacity-40'}>
            <label className="block text-sm font-semibold">
              2. Lecture materials{' '}
              {!hasPastQuestions && (
                <span className="font-normal text-ink/50">(upload past questions first)</span>
              )}
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              disabled={!hasPastQuestions || running}
              onChange={(e) => setLectureNoteFiles(Array.from(e.target.files ?? []))}
              className="mt-2 block w-full text-sm"
            />
            <p className="mt-1 text-xs text-ink/50">
              {hasNotes ? fileNames(lectureNoteFiles).join(', ') : 'No files yet'}
            </p>
          </div>

          <button
            onClick={runAll}
            disabled={!canSend}
            className="w-full rounded-xl bg-indigo px-5 py-3 font-display font-semibold text-white transition hover:bg-indigo/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? 'Working…' : 'Predict & Build'}
          </button>
        </div>

        {/* ── Staged reveal ──────────────────────── */}
        <div className="mt-8 space-y-6">
          {/* Stage A — analyzing */}
          {isAnalyzing && (
            <p className="animate-pulse font-display text-lg text-indigo">
              🔍 Analyzing your past questions…
            </p>
          )}

          {phaseOneWarning && (
            <p className="rounded-lg bg-indigo/10 px-4 py-3 text-sm text-indigo">
              ⚠️ {phaseOneWarning}
            </p>
          )}
          {phaseOneError && (
            <p className="rounded-lg bg-[#e63838]/10 px-4 py-3 text-sm text-[#c92a2a]">
              Error: {phaseOneError}
            </p>
          )}

          {/* Stage B — predictions */}
          {predictions.length > 0 && (
            <section className="rounded-[14px] border border-black/10 p-6">
              <h2 className="font-display text-xl font-bold">Predicted topics</h2>
              {course && <p className="mt-1 text-sm text-ink/60">Course: {course}</p>}
              {summary && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">
                  {summary}
                </p>
              )}
              <ul className="mt-4 space-y-3">
                {predictions.map((p: { topic: string; probability: number; reasoning: string }) => (
                  <li key={p.topic}>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{p.topic}</span>
                      <span className="text-indigo">{p.probability}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full bg-indigo" style={{ width: `${p.probability}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-ink/55">{p.reasoning}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Stage C — thinking / building */}
          {isGenerating && (
            <p className="animate-pulse font-display text-lg text-indigo">
              🧠 Got the topics. Now building your study guide from your notes…
            </p>
          )}

          {phaseTwoError && (
            <p className="rounded-lg bg-[#e63838]/10 px-4 py-3 text-sm text-[#c92a2a]">
              Error: {phaseTwoError}
            </p>
          )}

          {/* Stage D — study guide as a collapsed "artifact" card */}
          {guide && (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex w-full items-center gap-4 rounded-[14px] border border-black/10 bg-white p-5 text-left transition hover:border-indigo/40 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo/10 text-xl">
                📄
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold">Your study guide</span>
                <span className="block truncate text-xs text-ink/50">
                  {topicsCovered.length > 0 ? `${topicsCovered.length} topics · ` : ''}
                  opens in a panel — not the whole page
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-indigo px-3 py-1.5 text-sm font-semibold text-white">
                Open
              </span>
            </button>
          )}

          {/* Placeholder for where the quiz / flashcards / download buttons go next */}
          {guide && (
            <p className="text-center text-xs text-ink/30">
              (quiz · flashcards · download — coming here)
            </p>
          )}
        </div>
      </div>

      {/* ── Study-guide reader panel ─────────────────
          Right-side drawer on desktop, bottom sheet on mobile.
          Backdrop only dims on mobile so the page stays visible beside the
          drawer on desktop (Claude-artifact style). */}
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
