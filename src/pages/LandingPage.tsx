import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import deskNight from '../assets/desk-night.jpg';
import heroDemo from '../assets/demomock.jpg';
import uploadGif from '../assets/uploadfilegif.gif';
import predictMock from '../assets/predictmock.jpg';
import masterMock from '../assets/mastermock.jpg';
import verifiedBadge from '../assets/verifiedbadgemock.jpg';
import {
  ArrowRight,
  Check,
  XMark,
  Upload,
  Sparkle,
  BookOpen,
  BarChart,
  Notes,
  Target,
  FileQuestion,
  Globe,
  Replace,
  ShieldCheck,
  Funnel,
  Lightbulb,
} from '../components/icons';

/**
 * LandingPage — public marketing page, built from Jennifer's Figma ("iPhone 16 - 1").
 * Mobile-first to match her mobile-only design, then panned out to desktop
 * (multi-column layouts, larger type) since the web app is the primary surface.
 * "Predict my exam" CTAs route to /signup (auth pages not designed yet).
 */

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-indigo/90 sm:text-base';
const btnOutline =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-5 py-3 font-display text-sm font-semibold text-ink transition hover:border-ink/35';
const section = 'px-6 py-16 sm:py-24';
const container = 'mx-auto w-full max-w-6xl';

export default function LandingPage({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-white text-ink ${className}`}>
      <SiteHeader />
      <main>
        <Hero />
        <ProblemSection />
        <StepsSection />
        <TrustSection />
        <BenefitsSection />
        <ProveSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/5 bg-white/80 backdrop-blur">
      <div className={`${container} flex items-center justify-between px-6 py-4`}>
        <Link to="/" aria-label="ExamPrepp home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <a
            href="#how-it-works"
            className="hidden font-display text-sm font-medium text-ink/70 transition hover:text-ink sm:inline"
          >
            How it works
          </a>
          <Link
            to="/login"
            className="hidden font-display text-sm font-medium text-ink/70 transition hover:text-ink sm:inline"
          >
            Log in
          </Link>
          <Link to="/signup" className={btnPrimary}>
            Predict my exam
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-glow px-6 pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className={`${container} grid items-center gap-12 lg:grid-cols-2`}>
        <div className="text-center lg:text-left">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-indigo sm:text-sm">
            For every student who’s ever walked in blind
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Walk into your exam{' '}
            <span className="text-indigo">already knowing.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/75 lg:mx-0">
            Upload your past questions and lecture notes. ExamPrepp shows you the
            topics most likely to come up, and teaches you exactly those, in plain
            language, from your own materials. No more guessing what to read.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/signup" className={`${btnPrimary} w-full sm:w-auto`}>
              Predict my exam <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className={`${btnOutline} w-full sm:w-auto`}>
              See How It Works
            </a>
          </div>
        </div>

        <div className="lg:pl-6">
          <img
            src={heroDemo}
            alt="A delighted student holding a stack of A+ graded exam papers"
            className="aspect-[4/5] w-full rounded-[14px] object-cover shadow-lg sm:aspect-[5/4] lg:aspect-[4/5]"
          />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className={`${section} bg-surface`}>
      <div className={`${container} grid items-center gap-12 lg:grid-cols-2`}>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            You already
            <br />
            know this feeling.
          </h2>
          <span className="mt-4 block h-1 w-12 rounded-full bg-indigo" />
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/75">
            It’s 1 a.m. The exam is seven hours away. You have twelve weeks of notes,
            PDFs, images, areas of concentration, a stack of past questions, and no
            idea which of it actually matters. So you read everything a little and
            nothing well, and you walk in hoping.
          </p>
          <p className="mt-6 font-display text-lg font-semibold text-indigo">
            Hope is not a study plan.
          </p>
        </div>

        <div className="lg:pl-6">
          <img
            src={deskNight}
            alt="A cluttered desk late at night — notes, past questions and a lamp"
            className="aspect-[4/5] w-full rounded-[14px] object-cover shadow-lg sm:aspect-[5/4] lg:aspect-[4/5]"
          />
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: '01',
    title: 'Upload',
    Icon: Upload,
    img: uploadGif,
    body: 'Drop in your past questions and lecture notes. Be it PDFs or photos. Up to five files.',
  },
  {
    n: '02',
    title: 'Predict',
    Icon: Sparkle,
    img: predictMock,
    body: 'ExamPrepp reads the patterns across years and ranks the topics most likely to appear, with a confidence score for each.',
  },
  {
    n: '03',
    title: 'Master',
    Icon: BookOpen,
    img: masterMock,
    body: 'Get a focused study guide that explains exactly those topics, in clear language with real analogies, drawn only from your materials. Turn it into flashcards or a quiz in one tap.',
  },
];

function StepsSection() {
  return (
    <section id="how-it-works" className={`${section} scroll-mt-20`}>
      <div className={container}>
        <h2 className="text-center font-display text-3xl font-bold leading-tight sm:text-4xl">
          Three steps. Ten minutes. Total clarity.
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ n, title, Icon, body, img }) => (
            <div key={n} className="flex flex-col">
              <img
                src={img}
                alt={`${title} step preview`}
                className="aspect-[4/3] w-full rounded-[14px] border border-ink/5 object-cover shadow-sm"
              />
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo/10 text-indigo">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-indigo">
                  Step {n} — {title}
                </p>
              </div>
              <p className="mt-3 text-base leading-relaxed text-ink/75">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const doItems = [
  { Icon: BarChart, text: 'Ranks topics by how often they’ve appeared' },
  { Icon: Notes, text: 'Teaches from your own uploaded notes' },
  { Icon: Target, text: 'Makes you genuinely ready' },
];
const neverItems = [
  { Icon: FileQuestion, text: 'Gives you “answers” or leaked papers' },
  { Icon: Globe, text: 'Invents facts from the open internet' },
  { Icon: Replace, text: 'Replaces actual learning' },
];

function TrustSection() {
  return (
    <section className={section}>
      <div className={`${container} flex flex-col items-center text-center`}>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-indigo px-4 py-2 font-display text-xs font-semibold text-white sm:text-sm"
        >
          Try it on your next exam <ArrowRight className="h-4 w-4" />
        </Link>

        <h2 className="mt-8 font-display text-3xl font-bold leading-tight sm:text-4xl">
          It’s not a cheat code.
          <br />
          It’s how the best students already study.
        </h2>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink/75">
          Every sharp final-year student in 2026 does this by hand already. They dig
          through old papers, spot what repeats, and study smarter. ExamPrepp just
          does it in minutes instead of days. We never touch leaked or live exam
          content. We only read your materials, and everything we teach traces back
          to your lecturer’s notes.
        </p>

        <div className="mt-12 grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          {/* What ExamPrepp DOES */}
          <div className="rounded-[14px] border border-[#bdf1bd] bg-[#4cec4c]/15 p-6 text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06aa31] text-white">
                <Check className="h-4 w-4" />
              </span>
              <p className="font-display text-base font-semibold">
                <span className="text-[#06aa31]">ExamPrepp</span> does
              </p>
            </div>
            <ul className="mt-5 space-y-4">
              {doItems.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#06aa31]" />
                  <span className="text-sm leading-snug text-ink/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What ExamPrepp NEVER does */}
          <div className="rounded-[14px] border border-[#fea3a3] bg-[#e63838]/15 p-6 text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f54343] text-white">
                <XMark className="h-4 w-4" />
              </span>
              <p className="font-display text-base font-semibold">
                <span className="text-[#f54343]">ExamPrepp</span> never
              </p>
            </div>
            <ul className="mt-5 space-y-4">
              {neverItems.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#f54343]" />
                  <span className="text-sm leading-snug text-ink/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const benefits = [
  { Icon: Funnel, lead: 'Stop drowning in everything.', rest: 'Read what matters, skip what doesn’t.' },
  { Icon: Lightbulb, lead: 'Understand, don’t cram.', rest: 'Plain-language explanations that actually stick.' },
  { Icon: ShieldCheck, lead: 'Trade panic for confidence.', rest: 'Know what’s coming before you sit down.' },
];

function BenefitsSection() {
  return (
    <section className={`${section} benefits-glow`}>
      <div className={container}>
        <h2 className="text-center font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Study less. Know more. Walk in calm.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map(({ Icon, lead, rest }) => (
            <div
              key={lead}
              className="rounded-[14px] border border-white/15 bg-white/10 p-6 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl hover:shadow-indigo/20"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                <Icon className="h-6 w-6" />
              </span>
              <p className="text-base leading-relaxed">
                <span className="font-display font-semibold text-white">{lead}</span>{' '}
                <span className="text-white/90">{rest}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProveSection() {
  return (
    <section className={section}>
      <div className={`${container} grid items-center gap-12 lg:grid-cols-2`}>
        <div className="order-2 lg:order-1">
          <img
            src={verifiedBadge}
            alt="A green verified credential badge with a checkmark"
            className="aspect-[4/3] w-full rounded-[14px] bg-surface object-contain p-8 shadow-sm"
          />
        </div>
        <div className="order-1 lg:order-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Prove what you’ve mastered
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/75">
            Finish a quiz and earn a verifiable badge that’s yours forever —
            tamper-proof proof of the skills you’ve built, and not just the grades
            you got.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className={section}>
      <div
        className={`${container} cta-card flex flex-col items-center overflow-hidden rounded-[24px] px-6 py-16 text-center shadow-xl shadow-indigo/30 sm:px-10 sm:py-20`}
      >
        <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Your next exam has a date.
          <br />
          Your prep shouldn’t wait.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85">
          Upload your first paper now. See your predicted topics in under ten minutes.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-display text-base font-semibold text-indigo transition hover:bg-white/90"
        >
          Predict my exam <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-ink px-6 py-14 text-white/70">
      <div className={`${container} grid gap-10 sm:grid-cols-2 lg:grid-cols-4`}>
        <div className="lg:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Stop guessing what to study. Upload your past papers and notes — ExamPrepp
            tells you what’s coming, then teaches you exactly that.
          </p>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-white">Product</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href="#how-it-works" className="transition hover:text-white">
                How it works
              </a>
            </li>
            <li>
              <Link to="/login" className="transition hover:text-white">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/signup" className="transition hover:text-white">
                Sign up
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-white">Company</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href="#" className="transition hover:text-white">
                About
              </a>
            </li>
            <li>
              <a href="#" className="transition hover:text-white">
                Contact
              </a>
            </li>
            <li>
              <a href="#" className="transition hover:text-white">
                Privacy
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`${container} mt-12 border-t border-white/10 pt-6`}>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} ExamPrepp. Built for Nigerian university students by top Nigerian university students.
        </p>
      </div>
    </footer>
  );
}
