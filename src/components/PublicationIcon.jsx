// Icons for the novel's publication status. Deliberately a different family
// from the reader-status rings (StatusIcon): these describe the book, not you.
const PATHS = {
  Ongoing: (
    // pencil: still being written
    <>
      <path d="M3 13l.6-2.6L10.4 3.6a1.4 1.4 0 0 1 2 2L5.6 12.4z" />
      <path d="M9.3 4.7l2 2" />
    </>
  ),
  Completed: (
    // flag: reached the finish
    <>
      <path d="M4 14V2.5" />
      <path d="M4 3h7.5l-1.6 2.6L11.5 8H4" />
    </>
  ),
  Upcoming: (
    // calendar
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.6" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </>
  ),
  "On Hiatus": (
    // hourglass: paused for now
    <>
      <path d="M4 2h8M4 14h8" />
      <path d="M5 2c0 3 6 3 6 6s-6 3-6 6M11 2c0 3-6 3-6 6s6 3 6 6" />
    </>
  ),
  Cancelled: (
    // crossed-out circle
    <>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M4 12l8-8" />
    </>
  ),
};

export default function PublicationIcon({ status, size = 15 }) {
  const shape = PATHS[status] ?? <circle cx="8" cy="8" r="5.75" />;
  return (
    <svg
      className="pub-icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}
