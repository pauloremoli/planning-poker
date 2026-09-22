import CreateRoomForm from "../components/CreateRoomForm";
import BrandHeader from "../components/BrandHeader";

export default function Home() {
  return (
    <div className="shell">
      <BrandHeader />
      <CreateRoomForm />
    </div>
  );
}
