// One icon family for the reader's status. Shape carries the meaning (works
// without colour); colour comes from the --status-* tokens in status.css.
//   Plan To Read  dashed empty ring
//   Reading       ring + pie filled to the actual progress
//   On Hold       ring + pause bars
//   Completed     filled disc + check
//   Dropped       ring + slash
const R = 6.25; // ring radius in a 16×16 box
const PIE_R = 2.6; // pie drawn as a fat stroke: radius r, stroke 2r
const PIE_CIRC = 2 * Math.PI * PIE_R;

const statusSlug = (status) => status.toLowerCase().split(" ").join("-");

export default function StatusIcon({ status, progress, size = 16 }) {
  const slug = statusSlug(status);
  // No chapter count → half full. Capped at 85% so "Reading" always keeps a
  // visible notch and never looks like the solid "Completed" disc.
  const fraction = progress == null ? 0.5 : Math.min(0.85, Math.max(0, progress));

  return (
    <svg
      className={`status-icon status-icon--${slug}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {slug === "completed" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M5 8.2l2 2 4-4.2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <circle
          cx="8"
          cy="8"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={slug === "plan-to-read" ? "2.2 1.9" : undefined}
        />
      )}

      {slug === "reading" && fraction > 0 && (
        <circle
          cx="8"
          cy="8"
          r={PIE_R}
          fill="none"
          stroke="currentColor"
          strokeWidth={PIE_R * 2}
          strokeDasharray={`${fraction * PIE_CIRC} ${PIE_CIRC}`}
          transform="rotate(-90 8 8)"
        />
      )}

      {slug === "on-hold" && (
        <path d="M6.6 5.6v4.8M9.4 5.6v4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}

      {slug === "dropped" && (
        <path d="M5.3 10.7l5.4-5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
