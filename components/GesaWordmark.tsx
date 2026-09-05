// Roy asked for the "GESA" wordmark next to the logo mark to match a
// reference image showing each letter separated by a small centered dot
// (G·E·S·A), keeping only that text *style* — not the reference image's
// own dark background/gold coloring. So this renders plain "GESA" text as
// 4 letters joined by small circular dots, but every color/size decision is
// left to the caller: the dots use `bg-current` (inherits whatever
// `text-[...]` color class wraps this component, exactly like the bare
// "GESA" text node it replaces did) and are sized in `em` units, so they
// scale automatically with whatever font size each call site already uses
// (Header/Footer's 19px vs the auth pages' 17px) with zero per-site tuning.
//
// Deliberately its own small component (not inlined at each of the 6 call
// sites — Header, Footer, and the login/signup/forgot-password/reset-
// password auth pages) so the letter+dot markup only exists in one place;
// every call site keeps its own existing wrapping `<Link>`/className
// (font, tracking, color, size) completely untouched.
const LETTERS = ["G", "E", "S", "A"];

export default function GesaWordmark({ className = "" }: { className?: string }) {
  // One flat flex row (not nested letter/dot pairs) so a single `gap`
  // applies evenly between every child — letter-to-dot and dot-to-letter
  // spacing end up identical, matching the reference image's even rhythm.
  return (
    <span className={`inline-flex items-center gap-[0.22em] ${className}`}>
      {LETTERS.map((letter, i) => (
        <span key={letter} className="contents">
          <span>{letter}</span>
          {i < LETTERS.length - 1 && <span aria-hidden="true" className="inline-block h-[0.16em] w-[0.16em] rounded-full bg-current" />}
        </span>
      ))}
    </span>
  );
}
