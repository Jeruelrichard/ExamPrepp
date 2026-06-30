import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFlashcardSet } from '../services/library';
import type { Flashcard, FlashcardSet } from '../services/library';
import { ChevronLeft, Check, XMark, ArrowRight } from '../components/icons';

/**
 * FlashcardViewer — flip-card study mode (Jennifer's Figma, iPhone 16-23/16-24).
 *
 * Tap the card to flip (question ⇄ answer). The ✓ / ✗ chips are self-grade
 * buttons that tally how many you got right vs wrong; Next advances. A short
 * completion summary shows after the last card.
 */
type Grade = 'correct' | 'wrong';

export default function FlashcardViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grades, setGrades] = useState<Record<number, Grade>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await getFlashcardSet(id);
      if (!active) return;
      if (error) setLoadError(error);
      else setSet(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const cards = (set?.cards ?? []) as Flashcard[];
  const card = cards[index];
  const correctCount = Object.values(grades).filter((g) => g === 'correct').length;
  const wrongCount = Object.values(grades).filter((g) => g === 'wrong').length;

  function grade(g: Grade) {
    setGrades((prev) => ({ ...prev, [index]: g }));
  }

  function next() {
    if (index >= cards.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setFlipped(false);
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setGrades({});
    setDone(false);
  }

  const title = set?.title || 'Flashcards';

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface text-sm text-ink/50">
        Loading flashcards…
      </div>
    );
  }

  if (loadError || !set || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="text-sm text-ink/60">{loadError ?? 'No flashcards found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/app/flashcards')}
          className="rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white"
        >
          Back to Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Back header */}
      <header className="shrink-0 border-b border-ink/10 bg-card px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/app/flashcards')}
          className="flex items-center gap-1.5 font-display text-xl font-bold text-ink transition hover:text-indigo"
        >
          <ChevronLeft className="h-6 w-6" />
          {title}
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6">
        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <p className="font-display text-2xl font-bold">Nice work!</p>
            <p className="text-ink/70">
              You marked <span className="font-semibold text-success">{correctCount}</span> correct and{' '}
              <span className="font-semibold text-red-600">{wrongCount}</span> to review out of{' '}
              {cards.length}.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={restart}
                className="rounded-[14px] border border-ink/15 px-5 py-2.5 font-display text-sm font-semibold text-ink/80 transition hover:border-ink/30"
              >
                Study again
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/flashcards')}
                className="rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Flip card */}
            <div className="flex-1 [perspective:1200px]">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? 'Show question' : 'Show answer'}
                className="relative h-full min-h-[55vh] w-full transition-transform duration-500 [transform-style:preserve-3d]"
                style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
              >
                {/* Front — question */}
                <div className="absolute inset-0 flex flex-col rounded-[16px] bg-lavender p-6 [backface-visibility:hidden]">
                  <p className="text-center font-display text-base font-semibold text-ink/70">
                    {index + 1}
                  </p>
                  <div className="flex flex-1 items-center justify-center">
                    <p className="font-display text-2xl font-bold leading-snug text-ink">
                      {card.front}
                    </p>
                  </div>
                  <p className="text-center text-sm text-ink/60">See answer</p>
                </div>

                {/* Back — answer */}
                <div className="absolute inset-0 flex items-center justify-center rounded-[16px] border border-ink/15 bg-card p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="font-display text-2xl font-bold leading-snug text-ink">{card.back}</p>
                </div>
              </button>
            </div>

            {/* Tally + Next */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => grade('correct')}
                  aria-label="Mark correct"
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 font-display text-sm font-semibold transition ${
                    grades[index] === 'correct'
                      ? 'border-success bg-success/10 text-success'
                      : 'border-ink/15 text-ink/70 hover:border-success/60'
                  }`}
                >
                  <Check className="h-4 w-4 text-success" />
                  {correctCount}
                </button>
                <button
                  type="button"
                  onClick={() => grade('wrong')}
                  aria-label="Mark incorrect"
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 font-display text-sm font-semibold transition ${
                    grades[index] === 'wrong'
                      ? 'border-red-500 bg-red-500/10 text-red-600'
                      : 'border-ink/15 text-ink/70 hover:border-red-400'
                  }`}
                >
                  <XMark className="h-4 w-4 text-red-600" />
                  {wrongCount}
                </button>
              </div>

              <button
                type="button"
                onClick={next}
                className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                {index >= cards.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
