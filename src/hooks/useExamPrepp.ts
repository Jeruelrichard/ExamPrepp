/**
 * ExamPrepp — two-phase state machine hook.
 *
 * Wires Phase 1 (past-question analysis) to Phase 2 (study-guide generation).
 * Holds all phase state and exposes setters + runners. No UI, no JSX.
 *
 * Past question files and lecture note files are always kept as separate arrays.
 * Phase 2 always sends BOTH arrays (+ predictions) to Gemini — the past-question
 * context is never dropped.
 */

import { useState, useCallback } from 'react';
import { analyzePastQuestions, generateStudyGuide } from '../services/gemini';

export function useExamPrepp() {
  // ── Phase 1 state ──────────────────────────────
  const [pastQuestionFiles, setPastQuestionFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [course, setCourse] = useState('');
  const [summary, setSummary] = useState('');   // human-readable analysis (Part 1)
  const [followUp, setFollowUp] = useState(''); // "now upload your lecture notes" prompt
  const [phaseOneError, setPhaseOneError] = useState(null);
  const [phaseOneWarning, setPhaseOneWarning] = useState(null);

  // ── Phase 2 state ──────────────────────────────
  const [lectureNoteFiles, setLectureNoteFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [guide, setGuide] = useState('');
  const [topicsCovered, setTopicsCovered] = useState([]);
  const [phaseTwoError, setPhaseTwoError] = useState(null);

  // ── Phase 1 — analyze past questions ───────────
  const runPhaseOne = useCallback(async () => {
    setIsAnalyzing(true);
    setPhaseOneError(null);
    setPhaseOneWarning(null);

    const { data, error, warning } = await analyzePastQuestions(pastQuestionFiles);

    // Warning can be present even when data succeeds (e.g. < 3 files).
    setPhaseOneWarning(warning);

    if (error) {
      setPhaseOneError(error);
    } else if (data) {
      setCourse(data.course);
      setPredictions(data.predictions);
      setSummary(data.summary);
      setFollowUp(data.followUp);
    }

    setIsAnalyzing(false);
  }, [pastQuestionFiles]);

  // ── Phase 2 — generate study guide ─────────────
  const runPhaseTwo = useCallback(async () => {
    setIsGenerating(true);
    setPhaseTwoError(null);

    const { data, error } = await generateStudyGuide(
      pastQuestionFiles,
      lectureNoteFiles,
      predictions,
    );

    if (error) {
      setPhaseTwoError(error);
    } else if (data) {
      setGuide(data.guide);
      setTopicsCovered(data.topicsCovered);
    }

    setIsGenerating(false);
  }, [pastQuestionFiles, lectureNoteFiles, predictions]);

  // ── Unified flow — run Phase 1 then Phase 2 from one trigger ──
  // To the user this is a single "send": the UI reveals predictions first
  // (while isAnalyzing flips off), then the study guide (while isGenerating runs).
  // Under the hood it's still two separate Gemini calls with their own prompts.
  // Phase 2 receives Phase 1's predictions DIRECTLY (not via the `predictions`
  // state, which React hasn't committed yet within this same async run).
  const runAll = useCallback(async () => {
    // Clear any prior run.
    setPhaseOneError(null);
    setPhaseOneWarning(null);
    setPhaseTwoError(null);
    setPredictions([]);
    setCourse('');
    setSummary('');
    setFollowUp('');
    setGuide('');
    setTopicsCovered([]);

    // ── Phase 1 — analyze past questions ──
    setIsAnalyzing(true);
    const p1 = await analyzePastQuestions(pastQuestionFiles);
    setPhaseOneWarning(p1.warning);
    setIsAnalyzing(false);

    if (p1.error || !p1.data) {
      setPhaseOneError(p1.error ?? 'No predictions were returned.');
      return; // don't proceed to Phase 2
    }

    setCourse(p1.data.course);
    setPredictions(p1.data.predictions);
    setSummary(p1.data.summary);
    setFollowUp(p1.data.followUp);

    // ── Phase 2 — generate study guide (uses Phase 1 output directly) ──
    setIsGenerating(true);
    const p2 = await generateStudyGuide(
      pastQuestionFiles,
      lectureNoteFiles,
      p1.data.predictions,
    );
    setIsGenerating(false);

    if (p2.error) {
      setPhaseTwoError(p2.error);
    } else if (p2.data) {
      setGuide(p2.data.guide);
      setTopicsCovered(p2.data.topicsCovered);
    }
  }, [pastQuestionFiles, lectureNoteFiles]);

  // ── Reset all state back to initial ────────────
  const reset = useCallback(() => {
    setPastQuestionFiles([]);
    setIsAnalyzing(false);
    setPredictions([]);
    setCourse('');
    setSummary('');
    setFollowUp('');
    setPhaseOneError(null);
    setPhaseOneWarning(null);
    setLectureNoteFiles([]);
    setIsGenerating(false);
    setGuide('');
    setTopicsCovered([]);
    setPhaseTwoError(null);
  }, []);

  return {
    // Phase 1
    pastQuestionFiles,
    isAnalyzing,
    predictions,
    course,
    summary,
    followUp,
    phaseOneError,
    phaseOneWarning,
    // Phase 2
    lectureNoteFiles,
    isGenerating,
    guide,
    topicsCovered,
    phaseTwoError,
    // Actions
    setPastQuestionFiles,
    runPhaseOne,
    setLectureNoteFiles,
    runPhaseTwo,
    runAll,
    reset,
  };
}

export default useExamPrepp;
