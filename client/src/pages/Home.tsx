import CreateRoomForm from "../components/CreateRoomForm";

export default function Home() {
  return (
    <div className="shell">
      <div className="brand">
        Planning<span>Poker</span>
      </div>
      <p className="muted">
        Anonymous, link-only planning poker. Nothing about you or your votes is ever stored on a server — rooms live only in
        the browsers connected to them.
      </p>
      <CreateRoomForm />
    </div>
  );
}
