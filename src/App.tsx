import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Prep from './pages/Prep';
import Badges from './pages/Badges';
import Flashcards from './pages/Flashcards';
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
 *              prep        Phase 1 / Phase 2 workspace ("Workspace" tab)
 *              badges      soulbound credential gallery
 *              flashcards  flashcard view
 *              quiz        quiz view
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
        <Route path="badges" element={<Badges />} />
        <Route path="flashcards" element={<Flashcards />} />
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
