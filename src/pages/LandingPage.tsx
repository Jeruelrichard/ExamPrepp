import { Link } from 'react-router-dom';

/**
 * LandingPage — public marketing page.
 *
 * PLACEHOLDER. This is a temporary hero so the "/" route renders something
 * branded while routing/TS/Tailwind scaffolding lands. The real layout will
 * be built section-by-section from Jennifer's Figma design:
 *   Hero · "the villain" · 3-step how-it-works · trust/"not expo" · benefits · final CTA
 * (PRD §11.1).
 */
export default function LandingPage({ className = '' }: { className?: string }) {
  return (
    <main className={`min-h-screen bg-white text-ink ${className}`}>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center">
        <span className="font-wordmark text-3xl text-indigo">ExamPrepp</span>

        <h1 className="mt-8 font-display text-4xl font-bold leading-tight sm:text-5xl">
          Stop guessing what to study.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink/70">
          Upload your past papers and notes. ExamPrepp tells you what’s coming — then
          teaches you exactly that.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-[14px] bg-indigo px-6 py-3 font-display text-sm font-semibold text-white"
          >
            Get started free
          </Link>
          <Link
            to="/login"
            className="rounded-[14px] border border-black/10 px-6 py-3 font-display text-sm font-semibold text-ink"
          >
            Log in
          </Link>
        </div>

        <p className="mt-10 text-xs uppercase tracking-wide text-ink/40">
          Placeholder hero — full landing page to be built from Figma
        </p>
      </section>
    </main>
  );
}
