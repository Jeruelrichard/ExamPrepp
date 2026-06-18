/** Quiz — one-question-at-a-time MCQ + score + badge CTA. Shell only. */
export default function Quiz({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <h1 className="font-display text-2xl font-bold">Quiz</h1>
      <p className="mt-2 text-ink/60">
        Shell — MCQ quiz, per-question feedback, and final score will live here.
      </p>
    </section>
  );
}
