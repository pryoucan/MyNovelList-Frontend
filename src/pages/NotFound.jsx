import { Link } from "react-router-dom";
import "../design/NotFound.css";

export default function NotFound() {
  return (
    <main className="notfound">
      <h1 className="notfound-code">404</h1>

      <p className="notfound-text">
        Page not found
      </p>

      <Link to="/" className="notfound-link">
        Go back home
      </Link>
    </main>
  );
}