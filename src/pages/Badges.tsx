import EmptyState from '../components/EmptyState';

/**
 * Badges — the "Badges" tab (Jennifer's Figma, iPhone screen 9).
 *
 * Empty state for now. Will become the gallery of soulbound Solana credentials
 * earned on quiz completion (read via getStudentBadges in services/blockchain).
 */
export default function Badges({ className = '' }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      message="Upload your past questions to earn badges"
    />
  );
}
