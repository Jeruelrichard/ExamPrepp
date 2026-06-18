// TEMPORARY scratch harness for manually testing useExamPrepp().
// Zero styling, zero design-system dependency — safe to delete entirely
// once Jennifer's real Phase 1 / Phase 2 components are wired up.

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
    runPhaseOne,
    setLectureNoteFiles,
    runPhaseTwo,
    reset,
  } = useExamPrepp();

  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem', maxWidth: '700px' }}>
      <h1>useExamPrepp — dev harness</h1>
      <button onClick={reset}>Reset</button>

      <hr />

      <h2>Phase 1 — Past Questions</h2>
      <input
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={(e) => setPastQuestionFiles(Array.from(e.target.files ?? []))}
      />
      <p>Files: {pastQuestionFiles.length ? fileNames(pastQuestionFiles).join(', ') : 'none'}</p>
      <button onClick={runPhaseOne} disabled={isAnalyzing || pastQuestionFiles.length === 0}>
        {isAnalyzing ? 'Analyzing...' : 'Run Phase 1'}
      </button>

      {phaseOneWarning && <p style={{ color: 'darkorange' }}>Warning: {phaseOneWarning}</p>}
      {phaseOneError && <p style={{ color: 'red' }}>Error: {phaseOneError}</p>}
      {course && <p>Course: {course}</p>}
      {summary && (
        <>
          <h3>Summary (Part 1)</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
        </>
      )}
      <pre>{JSON.stringify(predictions, null, 2)}</pre>
      {followUp && (
        <p style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{followUp}</p>
      )}

      <hr />

      <h2>Phase 2 — Lecture Notes</h2>
      <input
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={(e) => setLectureNoteFiles(Array.from(e.target.files ?? []))}
      />
      <p>Files: {lectureNoteFiles.length ? fileNames(lectureNoteFiles).join(', ') : 'none'}</p>
      <button onClick={runPhaseTwo} disabled={isGenerating || predictions.length === 0}>
        {isGenerating ? 'Generating...' : 'Run Phase 2'}
      </button>

      {phaseTwoError && <p style={{ color: 'red' }}>Error: {phaseTwoError}</p>}
      <pre>{JSON.stringify(topicsCovered, null, 2)}</pre>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{guide}</pre>
    </div>
  );
}
