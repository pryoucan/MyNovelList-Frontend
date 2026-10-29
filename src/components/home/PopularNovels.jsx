import { Link } from "react-router-dom";
import NovelThumb from "../NovelThumb";

// A shelf with fewer distinct novels than this looks empty, so it's hidden.
const MIN_ITEMS = 3;
const MAX_ITEMS = 6;

// Ranked by how many readers have it on their list, then by community score.
export default function PopularNovels({ novels, stats }) {
  const byId = new Map(novels.map((n) => [n.id, n]));
  const items = stats
    .filter((s) => s.readers > 0 && byId.has(s.novelId))
    .sort((a, b) => b.readers - a.readers || (b.score ?? 0) - (a.score ?? 0))
    .slice(0, MAX_ITEMS)
    .map((s) => ({ ...s, novel: byId.get(s.novelId) }));

  if (items.length < MIN_ITEMS) return null;

  return (
    <section className="home-section" aria-labelledby="popular-title">
      <div className="home-section-head">
        <h2 className="home-section-title" id="popular-title">Popular with readers</h2>
        <span className="home-section-note">by readers, then community score</span>
      </div>
      <ol className="popular-grid">
        {items.map(({ novel, readers, score, ratingCount }, i) => (
          <li key={novel.id}>
            <Link to={`/novel/${novel.id}`} className="popular-card">
              <span className="popular-rank" aria-hidden="true">{i + 1}</span>
              <NovelThumb title={novel.title} src={novel.coverImage} />
              <span className="popular-body">
                <span className="popular-title">{novel.title}</span>
                <span className="popular-author">{novel.author}</span>
                <span className="popular-meta">
                  {readers} {readers === 1 ? "reader" : "readers"}
                  <span aria-hidden="true"> · </span>
                  {score != null ? (
                    <span className="popular-score" title={`Community score from ${ratingCount} ratings`}>
                      {score}<span className="popular-star" aria-hidden="true">★</span>
                    </span>
                  ) : (
                    <span className="popular-new">New</span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
