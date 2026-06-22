import { Link } from 'react-router-dom';

/** Dashboard — list of past study sessions + "New Prep" CTA. Shell only. */
export default function Dashboard({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <h1 className="font-display text-2xl font-bold">Your study sessions</h1>
      <p className="mt-2 text-ink/60">
        Shell — past sessions (course, date, topic count) will be listed here.
      </p>
      <Link
        to="/app/prep"
        className="mt-6 inline-block rounded-[14px] bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white"
      >
        Start new prep
      </Link>
    </section>
  );
}
