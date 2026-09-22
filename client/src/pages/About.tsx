import BrandHeader from "../components/BrandHeader";

const GITHUB_REPO_URL = "https://github.com/pauloremoli/planning-poker";
const GITHUB_SPONSORS_URL = "https://github.com/sponsors/pauloremoli";

export default function About() {
  return (
    <div className="shell">
      <BrandHeader />

      <div className="card stack">
        <h2>About Planning Poker</h2>
        <p>
          A free, anonymous, link-only planning poker tool for agile teams. There are no
          accounts and nothing about your name, votes, or tasks is ever stored on a server —
          everything is synced directly, peer-to-peer, between the browsers in a room over
          WebRTC. A tiny signaling server only helps browsers find each other, and forgets a
          room the instant everyone leaves.
        </p>
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
        <p className="muted">Runs on WebRTC and coffee. Mostly coffee.</p>
        <a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer">
          <button className="primary">💜 Sponsor on GitHub</button>
        </a>
      </div>
    </div>
  );
}
