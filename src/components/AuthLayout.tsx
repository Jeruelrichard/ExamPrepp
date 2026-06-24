import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

/**
 * AuthLayout — chrome shared by Login and Signup.
 *
 * Jennifer designed mobile only (a full-bleed white form, no logo). We pan out
 * to desktop with a two-column split: an indigo brand panel on the left
 * (reusing the landing's `.cta-card` gradient) and the form on the right.
 * On mobile the panel is hidden and the logo sits above the form.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Link to="/" aria-label="ExamPrepp home">
          <Logo tone="light" />
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Walk into your exam already knowing.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Upload your past papers and notes — ExamPrepp predicts what’s coming, then
            teaches you exactly that.
          </p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} ExamPrepp</p>
      </aside>

      {/* Form column */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-10 inline-block lg:hidden" aria-label="ExamPrepp home">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
