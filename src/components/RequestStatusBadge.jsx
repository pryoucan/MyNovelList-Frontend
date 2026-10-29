// Pending / Approved / Rejected, with a shape per state (not colour alone).
const LABELS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };

export default function RequestStatusBadge({ status }) {
  return (
    <span className={`req-status req-status--${status.toLowerCase()}`}>
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {status === "APPROVED" && <path d="M3.5 8.5l3 3 6-7" />}
        {status === "REJECTED" && <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />}
        {status === "PENDING" && (
          <>
            <circle cx="8" cy="8" r="5.5" />
            <path d="M8 5v3.2l2 1.3" />
          </>
        )}
      </svg>
      {LABELS[status] ?? status}
    </span>
  );
}
