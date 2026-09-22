import { Link } from "react-router-dom";

export default function BrandHeader() {
  return (
    <div className="row between brand-row">
      <Link to="/" className="brand">
        Planning<span>Poker</span>
      </Link>
      <Link to="/about" className="muted about-link">
        About
      </Link>
    </div>
  );
}
