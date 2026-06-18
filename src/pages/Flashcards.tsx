/** Flashcards — tap-to-flip card view. Shell only. */
export default function Flashcards({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <h1 className="font-display text-2xl font-bold">Flashcards</h1>
      <p className="mt-2 text-ink/60">Shell — tap-to-flip cards will live here.</p>
    </section>
  );
}
