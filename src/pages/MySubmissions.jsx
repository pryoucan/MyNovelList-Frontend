import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import NovelThumb from "../components/NovelThumb";
import ViewableImage from "../components/ViewableImage";
import RequestStatusBadge from "../components/RequestStatusBadge";
import RequestChanges from "../components/RequestChanges";
import { getMySubmissions, withdrawRequest } from "../services/requestService";
import { formatDate } from "../utils/novelFields";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Requests.css";

// Everything the user has suggested, newest first, with the review outcome.
export default function MySubmissions() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("displayUsername")) {
      navigate("/login");
      return;
    }
    getMySubmissions()
      .then(setRequests)
      .catch(() => setError("Couldn't load your submissions."));
  }, [navigate]);

  const withdraw = async (request) => {
    setBusy(request.id);
    try {
      await withdrawRequest(request.type, request.id);
      setRequests((list) => list.filter((r) => r.id !== request.id));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't withdraw it.");
    } finally {
      setBusy(null);
    }
  };

  const pending = requests?.filter((r) => r.status === "PENDING").length ?? 0;

  return (
    <div className="page-container">
      <Header />
      <Link to="/profile" className="req-back"><span aria-hidden="true">←</span> Back to profile</Link>

      <div className="req-page-head">
        <div>
          <h1 className="req-title">My submissions</h1>
          <p className="req-intro">
            Novels and edits you've suggested.{" "}
            {requests && `${pending} waiting for review.`}
          </p>
        </div>
        <Link to="/suggest" className="req-btn">+ Suggest a novel</Link>
      </div>

      {error && <p className="req-error" role="alert">{error}</p>}

      {!requests && !error ? (
        <div className="req-loading" aria-busy="true">Loading…</div>
      ) : requests?.length === 0 ? (
        <div className="req-card req-empty">
          <p>You haven't suggested anything yet.</p>
          <p className="req-intro">Missing a novel, or spotted a wrong detail? Suggest it and an admin will review it.</p>
        </div>
      ) : (
        <ul className="req-list">
          {requests?.map((r) => {
            const title = r.type === "new" ? r.novel.title : r.novel?.title ?? "Deleted novel";
            const link = r.type === "new" ? r.createdNovelId && `/novel/${r.createdNovelId}` : r.novel && `/novel/${r.novel.id}`;
            return (
              <li key={r.id} className="req-card req-item">
                <div className="req-item-head">
                  <ViewableImage
                    title={title}
                    src={r.type === "new" ? r.novel.coverImage : r.novel?.coverImage}
                    images={r.type === "edit" && r.cover ? [
                      { src: r.novel?.coverImage, label: "Current" },
                      { src: r.cover.to, label: "Proposed" },
                    ] : undefined}
                  >
                    <NovelThumb title={title} src={r.type === "new" ? r.novel.coverImage : r.cover?.to ?? r.novel?.coverImage} />
                  </ViewableImage>
                  <div className="req-item-title">
                    <span className="req-kind">{r.type === "new" ? "New novel" : "Edit"}</span>
                    {link ? <Link to={link} className="req-item-name">{title}</Link> : <span className="req-item-name">{title}</span>}
                    <span className="req-meta">Sent {formatDate(r.createdAt)}</span>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </div>

                {r.type === "edit" && r.changes.length + (r.cover ? 1 : 0) > 0 && (
                  <RequestChanges changes={r.changes} cover={r.cover} currentCover={r.novel?.coverImage} title={title} />
                )}

                {r.status !== "PENDING" && (
                  <p className="req-review">
                    {r.status === "APPROVED" ? "Approved" : "Rejected"}
                    {r.reviewedBy && ` by ${r.reviewedBy.username}`} on {formatDate(r.reviewedAt)}
                    {r.reviewNote && <span className="req-note">“{r.reviewNote}”</span>}
                  </p>
                )}

                {r.status === "PENDING" && (
                  <div className="req-item-actions">
                    <button type="button" className="req-btn req-btn--ghost" disabled={busy === r.id} onClick={() => withdraw(r)}>
                      {busy === r.id ? "Withdrawing…" : "Withdraw"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
