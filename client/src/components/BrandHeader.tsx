import { Link } from "react-router-dom";

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="10" y="6" width="16" height="22" rx="3" transform="rotate(10 18 17)" fill="var(--accent-2)" />
      <rect x="6" y="4" width="16" height="22" rx="3" fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.2} />
      <text x="14" y="18.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="6" fontWeight="700" fill="#fff">
        P2P
      </text>
    </svg>
  );
}

export default function BrandHeader() {
  return (
    <div className="row between brand-row">
      <Link to="/" className="brand row">
        <LogoMark />
        <span className="brand-word">
          Planning<span>Poker</span>
        </span>
      </Link>
      <Link to="/about" className="muted about-link">
        About
      </Link>
    </div>
  );
}
