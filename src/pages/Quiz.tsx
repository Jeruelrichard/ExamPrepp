import { useNavigate } from 'react-router-dom';
import { Target } from '../components/icons';

/**
 * Quiz — coming soon. "Turn into Quiz" routes here for now; the full MCQ quiz
 * viewer (with per-question feedback and scoring) lands in a later batch.
 */
export default function Quiz({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <section className={`flex flex-col items-center justify-center px-6 py-20 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-indigo">
        <Target className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold">Quiz — coming soon</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/60">
        Practice quizzes generated from your study guide are on the way. For now, turn your guide into
        flashcards to test yourself.
      </p>
      <button
        type="button"
        onClick={() => navigate('/app/prep')}
        className="mt-6 rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-indigo/90"
      >
        Back to Workspace
      </button>
    </section>
  );
}
