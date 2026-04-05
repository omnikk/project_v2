import Sidebar from "./Sidebar";
import GlobalFilters from "./GlobalFilters";

export default function AppLayout({ children }) {
  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#1e1e2e",
      color: "#cdd6f4",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <GlobalFilters />
        <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}