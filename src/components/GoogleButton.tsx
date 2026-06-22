import { GoogleIcon, ArrowRight } from './icons';
import { signInWithGoogle } from '../services/auth';

/**
 * "Continue with Google" pill (white, per Jennifer's design) + the Google "G"
 * and arrow she omitted. On success the browser redirects to Google, so we only
 * surface failures via onError.
 */
export default function GoogleButton({
  onError,
}: {
  onError?: (message: string) => void;
}) {
  async function handleClick() {
    const res = await signInWithGoogle();
    if (res.error) onError?.(res.error);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 font-display font-semibold text-ink shadow-md ring-1 ring-black/5 transition hover:shadow-lg"
    >
      <GoogleIcon className="h-5 w-5" />
      Continue with Google
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}
