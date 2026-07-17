import {
  ArrowLeft,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";

function PlaceholderPage({ title, description }) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-card">
        <span className="placeholder-icon">
          <Compass size={28} />
        </span>

        <span className="section-kicker">
          Coming next
        </span>

        <h1>{title}</h1>
        <p>{description}</p>

        <Link
          to="/"
          className="button button-secondary"
        >
          <ArrowLeft size={17} />
          Back home
        </Link>
      </div>
    </section>
  );
}

export default PlaceholderPage;