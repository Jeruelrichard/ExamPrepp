import EmptyState from '../components/EmptyState';

/**
 * Flashcards — the "Flashcards" tab (Jennifer's Figma, iPhone screen 10).
 *
 * Empty state for now. Will become the tap-to-flip card view generated from a
 * completed study guide (generateFlashcards in services/gemini).
 */
export default function Flashcards({ className = '' }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      message="Upload your past questions to create flashcards"
    />
  );
}
