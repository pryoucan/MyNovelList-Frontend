import { Link } from "react-router-dom";
import InkWashArt from "./InkWashArt";
import SearchBox from "./SearchBox";

// Banner with the ink-wash art; the search box overlaps its bottom edge.
export default function HomeHero({ isLoggedIn, search, onSearch, onSubmit, novels, userEntries, stats }) {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-banner">
        <InkWashArt />
        <div className="home-hero-copy">
          <h1 className="home-hero-title" id="home-hero-title">
            Track every chapter.
            <br />
            Remember every story.
          </h1>
          <p className="home-hero-sub">
            {isLoggedIn
              ? "Pick up where you left off, or find your next cultivation epic."
              : "Keep your reading list, progress and scores for web novels in one place."}
          </p>
          {!isLoggedIn && (
            <div className="home-hero-actions">
              <Link to="/signup" className="home-hero-cta">Create free account</Link>
              <Link to="/login" className="home-hero-link">Sign in</Link>
            </div>
          )}
        </div>
      </div>

      <SearchBox
        novels={novels}
        userEntries={userEntries}
        stats={stats}
        value={search}
        onChange={onSearch}
        onSubmit={onSubmit}
        placeholder="Search title or author"
      />
    </section>
  );
}
