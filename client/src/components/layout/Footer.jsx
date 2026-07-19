import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-content">
        <div>
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Compass size={20} />
            </span>
            <span className="brand-name">
              Pathly
            </span>
          </Link>

          <p className="footer-description">
            Collaborative travel journals for
            the places, people and moments you
            never want to forget.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/trips">My trips</Link>
          <Link to="/trips/new">Create a trip</Link>
        </div>

        <p className="footer-copyright">
          © 2026 Pathly. Every journey deserves
          a story.
        </p>
      </div>
    </footer>
  );
}

export default Footer;