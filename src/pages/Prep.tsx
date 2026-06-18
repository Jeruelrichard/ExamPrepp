/** Prep — Phase 1 (past questions) + Phase 2 (study guide) workspace. Shell only. */
export default function Prep({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <h1 className="font-display text-2xl font-bold">New prep</h1>
      <p className="mt-2 text-ink/60">
        Shell — Phase 1 upload &amp; predictions, then Phase 2 notes upload &amp; study
        guide will live here (wired to <code>useExamPrepp</code>).
      </p>
    </section>
  );
}
