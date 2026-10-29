import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import NovelThumb from "../components/NovelThumb";
import ViewableImage from "../components/ViewableImage";
import SubmitterPanel from "../components/SubmitterPanel";
import RequestStatusBadge from "../components/RequestStatusBadge";
import RequestChanges from "../components/RequestChanges";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAdminRequests, approveRequest, rejectRequest } from "../services/requestService";
import { formatDate, formatField } from "../utils/novelFields";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Requests.css";

const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];
const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New novels" },
  { value: "edit", label: "Edits" },
];

// Details of a suggested new novel, in the same order as the novel page.
function NewNovelDetails({ novel }) {
  const rows = [
    ["Original title", novel.originalTitle],
    ["Language", formatField("originalLanguage", novel.originalLanguage)],
    [
      "Publication",
      `${formatField("publicationStatus", novel.publication.status)}${
        novel.publication.startYear ? ` · ${novel.publication.startYear} – ${novel.publication.endYear ?? "present"}` : ""
      }`,
    ],
    ["Chapters", formatField("chapterCount", novel.chapterCount)],
    ["Translation", formatField("isFullyTranslated", novel.isFullyTranslated)],
    ["Publishers", [novel.publishers.original, novel.publishers.english].filter(Boolean).join(" · ") || "—"],
  ];
  return (
    <>
      <dl className="req-details">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "—"}</dd>
          </div>
        ))}
      </dl>
      <ul className="req-tags" aria-label="Genres">
        {novel.genres.map((g) => <li key={g}>{g}</li>)}
      </ul>
      {novel.tags?.length > 0 && (
        <ul className="req-tags req-tags--minor" aria-label="Tags">
          {novel.tags.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      {novel.synopsis && <p className="req-synopsis">{novel.synopsis}</p>}
    </>
  );
}

function RequestCard({ request, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [showSubmitter, setShowSubmitter] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isNew = request.type === "new";
  const title = isNew ? request.novel.title : request.novel?.title ?? "Deleted novel";
  const staleCount = isNew ? 0 : request.changes.filter((c) => c.stale).length;

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <li className="req-card req-item">
      <div className="req-item-head">
        <ViewableImage
          title={title}
          src={isNew ? request.novel.coverImage : request.novel?.coverImage}
          images={!isNew && request.cover ? [
            { src: request.novel?.coverImage, label: "Current" },
            { src: request.cover.to, label: "Proposed" },
          ] : undefined}
        >
          <NovelThumb title={title} src={isNew ? request.novel.coverImage : request.cover?.to ?? request.novel?.coverImage} />
        </ViewableImage>
        <div className="req-item-title">
          <span className="req-kind">{isNew ? "New novel" : "Edit"}</span>
          {!isNew && request.novel ? (
            <Link to={`/novel/${request.novel.id}`} className="req-item-name">{title}</Link>
          ) : (
            <span className="req-item-name">{title}</span>
          )}
          <span className="req-meta">
            {isNew && <>{request.novel.author} · </>}
            by{" "}
            {request.submittedBy ? (
              <button type="button" className="req-submitter" onClick={() => setShowSubmitter(true)}
                aria-label={`View ${request.submittedBy.username}'s submitter profile`}>
                {request.submittedBy.username}
              </button>
            ) : (
              <strong>deleted user</strong>
            )}{" "}
            · {formatDate(request.createdAt)}
          </span>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      {isNew ? (
        <NewNovelDetails novel={request.novel} />
      ) : (
        <>
          {staleCount > 0 && (
            <p className="req-warning" role="note">
              {staleCount === 1 ? "1 field has" : `${staleCount} fields have`} changed since this was sent. Approving
              will overwrite the current value.
            </p>
          )}
          <RequestChanges changes={request.changes} cover={request.cover} currentCover={request.novel?.coverImage} title={title} />
        </>
      )}

      {request.status !== "PENDING" && (
        <p className="req-review">
          {request.status === "APPROVED" ? "Approved" : "Rejected"}
          {request.reviewedBy && ` by ${request.reviewedBy.username}`} on {formatDate(request.reviewedAt)}
          {request.reviewNote && <span className="req-note">“{request.reviewNote}”</span>}
        </p>
      )}

      {error && <p className="req-error" role="alert">{error}</p>}

      {request.status === "PENDING" &&
        (rejecting ? (
          <form
            className="req-reject"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => onReject(request, reason.trim()));
            }}
          >
            <label className="req-reject-label" htmlFor={`reason-${request.id}`}>
              Reason <span className="req-optional">(optional — the submitter sees this)</span>
            </label>
            <textarea
              id={`reason-${request.id}`}
              className="req-reject-input"
              rows={2}
              maxLength={500}
              autoFocus
              placeholder="e.g. This novel is already listed under another title."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="req-item-actions">
              <button type="button" className="req-btn req-btn--ghost" onClick={() => setRejecting(false)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="req-btn req-btn--danger" disabled={busy}>
                {busy ? "Rejecting…" : "Reject request"}
              </button>
            </div>
          </form>
        ) : (
          <div className="req-item-actions">
            <button type="button" className="req-btn req-btn--ghost" onClick={() => setRejecting(true)} disabled={busy}>
              Reject
            </button>
            <button type="button" className="req-btn" onClick={() => run(() => onApprove(request))} disabled={busy}>
              {busy ? "Approving…" : isNew ? "Approve & add novel" : "Approve changes"}
            </button>
          </div>
        ))}
      {showSubmitter && request.submittedBy && (
        <SubmitterPanel userId={request.submittedBy.id} onClose={() => setShowSubmitter(false)} />
      )}
    </li>
  );
}

// Page numbers to show: first, last, and the current page ±1, with gaps as "…".
const pageItems = (page, totalPages) => {
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ["…", p] : [p]));
};

function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="req-pagination" aria-label="Pages">
      <span className="req-pagination-range">
        {from}–{to} of {total}
      </span>
      <div className="req-pagination-pages">
        <button type="button" className="req-page-btn" onClick={() => onChange(page - 1)} disabled={page === 1}
          aria-label="Previous page">
          ‹ Prev
        </button>
        {pageItems(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="req-page-gap" aria-hidden="true">…</span>
          ) : (
            <button key={p} type="button" className={`req-page-btn${p === page ? " is-current" : ""}`}
              onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} aria-label={`Page ${p}`}>
              {p}
            </button>
          )
        )}
        <button type="button" className="req-page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}
          aria-label="Next page">
          Next ›
        </button>
      </div>
    </nav>
  );
}

export default function AdminDashboard() {
  const user = useCurrentUser();
  const [status, setStatus] = useState("PENDING");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Reload when the tab or filter changes; ignore responses for a tab we've left.
  useEffect(() => {
    let current = true;
    getAdminRequests({ status, type: type || undefined, page })
      .then((result) => {
        if (!current) return;
        // The last item on the last page was just reviewed: step back a page.
        if (result.requests.length === 0 && page > result.totalPages) {
          setPage(result.totalPages);
          return;
        }
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (current) setError(err.response?.status === 403 ? "Admins only." : "Couldn't load requests.");
      });
    return () => {
      current = false;
    };
  }, [status, type, page, reload]);

  const goToPage = (next) => {
    setPage(next);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hide the card straight away, then reload the page so the next request moves up.
  const removeCard = (request, message) => {
    setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== request.id) }));
    setNotice(message);
    setReload((n) => n + 1);
  };

  const onApprove = async (request) => {
    const res = await approveRequest(request.type, request.id);
    removeCard(request, `Approved: ${request.novel?.title ?? "request"}.`);
    return res;
  };

  const onReject = async (request, reason) => {
    await rejectRequest(request.type, request.id, reason || undefined);
    removeCard(request, `Rejected: ${request.novel?.title ?? "request"}.`);
  };

  if (user && user.role !== "ADMIN") {
    return (
      <div className="page-container">
        <Header />
        <div className="req-card req-empty"><p>This page is for admins.</p><Link to="/">Back to list</Link></div>
      </div>
    );
  }

  const pendingTotal = data ? data.pending.new + data.pending.edit : 0;

  return (
    <div className="page-container">
      <Header />
      <div className="req-page-head">
        <div>
          <h1 className="req-title">Review requests</h1>
          <p className="req-intro">Suggestions from readers. Approved changes go live immediately.</p>
        </div>
        <div className="req-head-actions">
          <Link to="/admin/import" className="req-btn req-btn--ghost">Import from NovelUpdates</Link>
          <Link to="/suggest" className="req-btn req-btn--ghost">+ Add a novel</Link>
        </div>
      </div>

      <nav className="view-tabs" aria-label="Request status">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`view-tab${status === t.value ? " active" : ""}`}
            aria-current={status === t.value ? "page" : undefined}
            onClick={() => {
              setStatus(t.value);
              setPage(1);
              setNotice("");
            }}
          >
            {t.label}
            {t.value === "PENDING" && data && <span className="view-tab-count">{pendingTotal}</span>}
          </button>
        ))}
      </nav>

      <div className="filter-bar req-type-filter" role="group" aria-label="Request type">
        {TYPE_FILTERS.map((f) => (
          <button key={f.value} className={`filter-btn ${type === f.value ? "active" : ""}`} aria-pressed={type === f.value}
            onClick={() => {
              setType(f.value);
              setPage(1);
            }}>
            {f.label}
            {status === "PENDING" && data && f.value && <span className="req-filter-count">{data.pending[f.value]}</span>}
          </button>
        ))}
      </div>

      {notice && <p className="req-notice" role="status">{notice}</p>}
      {error && <p className="req-error" role="alert">{error}</p>}

      {!data && !error ? (
        <div className="req-loading" aria-busy="true">Loading requests…</div>
      ) : data?.requests.length === 0 ? (
        <div className="req-card req-empty">
          <p>{status === "PENDING" ? "All caught up — nothing waiting for review." : "Nothing here yet."}</p>
        </div>
      ) : (
        <ul className="req-list">
          {data?.requests.map((r) => (
            <RequestCard key={`${r.type}-${r.id}`} request={r} onApprove={onApprove} onReject={onReject} />
          ))}
        </ul>
      )}

      {data && data.requests.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize}
          onChange={goToPage} />
      )}
    </div>
  );
}
