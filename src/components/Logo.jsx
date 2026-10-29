import { Link } from "react-router-dom";
import "../design/Logo.css";

// "MNL" mark + wordmark. Links home unless `static` (e.g. on loading screens).
export default function Logo({ static: isStatic = false }) {
  const content = (
    <>
      <span className="brand-mark" aria-hidden="true">MNL</span>
      <span className="brand-name">MyNovelList</span>
    </>
  );

  return isStatic ? (
    <span className="brand">{content}</span>
  ) : (
    <Link to="/" className="brand" aria-label="MyNovelList home">
      {content}
    </Link>
  );
}
