import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Header } from "../components/Header";
import NovelForm from "../components/NovelForm";
import { getAllNovels } from "../services/novelService";
import { submitNovelRequest, submitEditRequest } from "../services/requestService";
import { useCurrentUser } from "../hooks/useCurrentUser";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Requests.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Every genre already used in the catalogue, most common first.
const genreList = (novels) => {
  const counts = new Map();
  for (const n of novels) for (const g of n.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([g]) => g);
};

// /suggest (new novel) and /novel/:novelId/suggest-edit (edit). Admins'
// submissions are applied immediately by the backend.
export default function SuggestNovel({ mode }) {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const loggedIn = !!localStorage.getItem("displayUsername");

  const [novel, setNovel] = useState(null);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");
  const [sent, setSent] = useState(null); // response after submitting

  useEffect(() => {
    if (!loggedIn) navigate("/login");
  }, [loggedIn, navigate]);

  useEffect(() => {
    getAllNovels().then((all) => setGenres(genreList(all)));
    if (mode !== "edit") return;
    axios
      .get(`${API_URL}/api/novels/${novelId}`)
      .then((res) => setNovel(res.data.novel))
      .catch(() => setLoadError("This novel doesn't exist."))
      .finally(() => setLoading(false));
  }, [mode, novelId]);

  const handleSubmit = async (body) => {
    const res = mode === "edit" ? await submitEditRequest(novelId, body) : await submitNovelRequest(body);
    if (res.applied) {
      navigate(`/novel/${res.novelId}`);
      return;
    }
    setSent(res);
    window.scrollTo({ top: 0 });
  };

  const title =
    mode === "edit" ? (isAdmin ? "Edit novel" : "Suggest an edit") : isAdmin ? "Add a novel" : "Suggest a novel";
  const intro =
    mode === "edit"
      ? isAdmin
        ? "Changes are saved straight away."
        : "Change anything that's wrong or missing. An admin reviews every edit before it goes live."
      : isAdmin
        ? "The novel is added straight away."
        : "Can't find a novel? Add its details and an admin will review it before it appears for everyone.";

  return (
    <div className="page-container">
      <Header />
      <Link to={mode === "edit" ? `/novel/${novelId}` : "/"} className="req-back">
        <span aria-hidden="true">←</span> {mode === "edit" ? "Back to novel" : "Back to list"}
      </Link>

      {sent ? (
        <div className="req-card req-success" role="status">
          <span className="req-success-icon" aria-hidden="true">✓</span>
          <h1 className="req-title">{mode === "edit" ? "Edit sent for review" : "Suggestion sent for review"}</h1>
          <p className="req-intro">
            Thanks! An admin will look at it soon. You can follow it on your submissions page, and withdraw it
            while it's still pending.
          </p>
          <div className="req-success-actions">
            <Link to="/submissions" className="req-btn">View my submissions</Link>
            <Link to={mode === "edit" ? `/novel/${novelId}` : "/"} className="req-btn req-btn--ghost">
              {mode === "edit" ? "Back to novel" : "Back to list"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="req-card">
          <h1 className="req-title">{title}</h1>
          <p className="req-intro">
            {mode === "edit" && novel ? <><strong>{novel.title}</strong> — </> : null}
            {intro}
          </p>
          {loading ? (
            <div className="req-loading" aria-busy="true">Loading novel…</div>
          ) : loadError ? (
            <p className="req-empty">{loadError}</p>
          ) : (
            <NovelForm
              mode={mode}
              novel={novel}
              genreSuggestions={genres}
              submitLabel={mode === "edit" ? (isAdmin ? "Save changes" : "Send edit for review") : isAdmin ? "Add novel" : "Send for review"}
              onSubmit={handleSubmit}
              onCancel={() => navigate(mode === "edit" ? `/novel/${novelId}` : "/")}
            />
          )}
        </div>
      )}
    </div>
  );
}
