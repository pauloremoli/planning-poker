import CreateRoomForm from "../components/CreateRoomForm";
import BrandHeader from "../components/BrandHeader";

export default function Home() {
  return (
    <div className="shell">
      <BrandHeader />
      <p className="muted">
        Anonymous, link-only planning poker. No data is ever stored on a server — rooms live only in
        the browsers connected to them.
      </p>
      <CreateRoomForm />
    </div>
  );
}
