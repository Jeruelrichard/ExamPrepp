import type { ComponentType } from 'react';
import { useExamPrepp } from '../hooks/useExamPrepp';
import { UploadCloud, Notes, Book } from '../components/icons';

/**
 * NewPrep — the "Upload Your Materials" workspace screen (Jennifer's Figma,
 * iPhone 16-16). Reached via the "New Prep" CTA on any tab (/app/prep/new).
 *
 * Gating (per the two-phase flow):
 *  - Lecture Notes upload is muted until at least one Past Question is added.
 *  - Analyze is muted until lecture notes are added.
 *
 * A non-blocking warning shows when fewer than 3 past questions are uploaded
 * (mirrors the service-layer advisory — analysis can still proceed).
 *
 * File state lives in useExamPrepp so the Analyze action (built next) can call
 * runAll() directly. Analyze is a no-op stub for now.
 */
const MIN_PAST_QUESTIONS = 3;

export default function NewPrep({ className = '' }: { className?: string }) {
  const { pastQuestionFiles, setPastQuestionFiles, lectureNoteFiles, setLectureNoteFiles } =
    useExamPrepp();

  const hasPastQuestions = pastQuestionFiles.length > 0;
  const hasNotes = lectureNoteFiles.length > 0;
  const fewPastQuestions = hasPastQuestions && pastQuestionFiles.length < MIN_PAST_QUESTIONS;
  const canAnalyze = hasPastQuestions && hasNotes;

  function handleAnalyze() {
    // TODO (next): kick off the prediction flow (runAll from useExamPrepp)
    // and render the staged reveal — predictions → study guide.
  }

  return (
    <section className={className}>
      {/* Upload card */}
      <div className="rounded-[14px] border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lavender text-indigo">
            <UploadCloud className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">Upload Your Materials</h1>
            <p className="text-sm text-ink/60">Add your past questions and lecture notes</p>
          </div>
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
          <p className="mt-4 rounded-lg bg-indigo/10 px-4 py-3 text-sm text-indigo">
            You've added {pastQuestionFiles.length} past question
            {pastQuestionFiles.length === 1 ? '' : 's'}. For the most accurate predictions,
            upload at least 3–5 years of past papers — you can still run the analysis.
          </p>
        )}
      </div>

      {/* Analyze */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="w-full max-w-[240px] rounded-[14px] bg-indigo px-6 py-3 font-display font-semibold text-white transition hover:bg-indigo/90 disabled:cursor-not-allowed disabled:bg-indigo/40 disabled:hover:bg-indigo/40"
        >
          Analyze
        </button>
      </div>
    </section>
  );
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
