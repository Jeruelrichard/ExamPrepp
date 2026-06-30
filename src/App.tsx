import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Prep from './pages/Prep';
import NewPrep from './pages/NewPrep';
import StudyGuide from './pages/StudyGuide';
import Badges from './pages/Badges';
import Flashcards from './pages/Flashcards';
import FlashcardViewer from './pages/FlashcardViewer';
import Settings from './pages/Settings';
import Quiz from './pages/Quiz';
import NotFound from './pages/NotFound';
import HookTestHarness from './dev/HookTestHarness';

/**
 * App — route table.
 *
 * Public:    /            landing
 *            /login       login
 *            /signup      signup
 *            /dev         dev hook harness (temporary scaffolding)
 *
 * Protected: /app         layout route (AppLayout + <Outlet/>), gated by ProtectedRoute
 *              index       dashboard
 *              prep        Workspace tab — saved-Prep history (or empty state)
 *              prep/new    upload-materials form → analyze flow
 *              prep/:id    saved study-guide reader
 *              badges      soulbound credential gallery
 *              flashcards  Flashcards tab — saved flashcard-set history
 *              flashcards/:id  flashcard flip viewer
 *              settings    settings (theme/billing — placeholder; holds log out)
 *              quiz        quiz — coming soon placeholder
 */
export default function App() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ── Protected app shell ───────────────── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="prep" element={<Prep />} />
        <Route path="prep/new" element={<NewPrep />} />
        <Route path="prep/:id" element={<StudyGuide />} />
        <Route path="badges" element={<Badges />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="flashcards/:id" element={<FlashcardViewer />} />
        <Route path="settings" element={<Settings />} />
        <Route path="quiz" element={<Quiz />} />
      </Route>

      {/* ── Dev scaffolding ───────────────────────
          Temporary. Remove this route together with src/dev once the
          real Phase 1 / Phase 2 screens are wired up. */}
      <Route path="/dev" element={<HookTestHarness />} />

      {/* ── Fallback ──────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
