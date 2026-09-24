import BrandHeader from "../components/BrandHeader";

const GITHUB_REPO_URL = "https://github.com/pauloremoli/planning-poker";
const GITHUB_SPONSORS_URL = "https://github.com/sponsors/pauloremoli";

export default function About() {
  return (
    <div className="shell">
      <BrandHeader />

      <div className="card stack">
        <h2>About Planning Poker</h2>
        <p>A free, anonymous, link-only planning poker tool for agile teams. There are no accounts.</p>
        <p className="muted">
          Open source, built as a small side project —{" "}
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
            view the code on GitHub
          </a>
          .
        </p>
      </div>

      <div className="card stack">
        <h3>Support this project</h3>
        <p className="muted">Runs on Node.js and coffee. Mostly coffee.</p>
        <a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer">
          <button className="primary">💜 Sponsor on GitHub</button>
        </a>
      </div>
    </div>
  );
}
