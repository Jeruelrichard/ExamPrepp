import { ImagePlaceholder } from './icons';

/**
 * Placeholder for image spots Jennifer left blank in the Figma design
 * (hero illustration, the 3 step visuals, the "Prove what you've mastered" badge image).
 * Styled to look intentional and to make swapping in a real image trivial:
 * drop the asset into an <img> and remove this component at that spot.
 */
export default function ImageSlot({
  label,
  className = '',
  ratio = 'aspect-[4/3]',
}: {
  label: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={`flex ${ratio} w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-indigo/25 bg-indigo/5 text-indigo/50 ${className}`}
    >
      <ImagePlaceholder className="h-7 w-7" />
      <span className="px-4 text-center text-xs font-medium">{label}</span>
    </div>
  );
}
