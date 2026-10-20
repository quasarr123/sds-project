import { AdminPanel } from "./features/admin/AdminPanel";
import "./index.css";

export function App() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AdminPanel />
    </div>
  );
}

export default App;

