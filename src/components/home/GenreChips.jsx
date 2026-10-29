import { usefulGenres } from "../../utils/genres";

const MIN_CHIPS = 3;

export default function GenreChips({ novels, active, onSelect }) {
  const genres = usefulGenres(novels);
  if (genres.length < MIN_CHIPS) return null;

  return (
    <section className="home-section" aria-labelledby="genres-title">
      <div className="home-section-head">
        <h2 className="home-section-title" id="genres-title">Browse by genre</h2>
      </div>
      <div className="genre-chips">
        {genres.map(([genre, count]) => (
          <button
            key={genre}
            type="button"
            className={`genre-chip${active === genre ? " active" : ""}`}
            aria-pressed={active === genre}
            onClick={() => onSelect(active === genre ? "" : genre)}
          >
            {genre}
            <span className="genre-chip-count">{count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
