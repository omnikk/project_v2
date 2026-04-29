import { useEffect, useState } from "react";
import { getDashboards, createDashboard, getDashboard, deleteDashboard, createWidget, deleteWidget } from "../api";
import WidgetConstructor from "../components/widgets/WidgetConstructor";
import WidgetCard from "../components/widgets/WidgetCard";

export default function Dashboards() {
  const [dashboards,  setDashboards]  = useState([]);
  const [active,      setActive]      = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showWidget,  setShowWidget]  = useState(false);
  const [newName,     setNewName]     = useState("");
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadDashboards(); }, []);

  const loadDashboards = async () => {
    setLoading(true);
    const list = await getDashboards();
    setDashboards(list);
    if (list.length > 0 && !active) {
      loadActive(list[0].id);
    } else {
      setLoading(false);
    }
  };

  const loadActive = async (id) => {
    setLoading(true);
    const d = await getDashboard(id);
    setActive(d);
    setLoading(false);
  };

  const handleCreateDashboard = async () => {
    if (!newName.trim()) return;
    const d = await createDashboard({ name: newName, description: "" });
    setNewName("");
    setShowCreate(false);
    await loadDashboards();
    loadActive(d.id);
  };

  const handleDeleteDashboard = async (id) => {
    if (!confirm("Удалить дашборд?")) return;
    await deleteDashboard(id);
    setActive(null);
    loadDashboards();
  };

  const handleAddWidget = async (form) => {
    if (!active) return;
    await createWidget(active.id, form);
    setShowWidget(false);
    loadActive(active.id);
  };

  const handleDeleteWidget = async (widgetId) => {
    await deleteWidget(widgetId);
    loadActive(active.id);
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 120px)" }}>

      <div style={{
        width: 240, flexShrink: 0,
        background: "#181825", border: "1px solid #313244",
        borderRadius: 12, padding: 16,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ color: "#a6adc8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Дашборды
        </div>

        {dashboards.map((d) => (
          <div
            key={d.id}
            onClick={() => loadActive(d.id)}
            style={{
              padding: "10px 12px", borderRadius: 8, cursor: "pointer",
              background: active?.id === d.id ? "#313244" : "transparent",
              color: active?.id === d.id ? "#cba6f7" : "#a6adc8",
              fontSize: 13, fontWeight: active?.id === d.id ? 700 : 400,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (active?.id !== d.id) e.currentTarget.style.background = "#23232e"; }}
            onMouseLeave={(e) => { if (active?.id !== d.id) e.currentTarget.style.background = "transparent"; }}
          >
            <span>{d.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteDashboard(d.id); }}
              style={{ background: "none", border: "none", color: "#585b70", cursor: "pointer", fontSize: 14 }}
            >x</button>
          </div>
        ))}

        {showCreate ? (
          <div style={{ marginTop: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateDashboard()}
              placeholder="Название..."
              autoFocus
              style={{
                width: "100%", background: "#313244", border: "1px solid #45475a",
                borderRadius: 8, color: "#cdd6f4", padding: "8px 12px",
                fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8,
              }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleCreateDashboard} style={{
                flex: 1, background: "#cba6f7", border: "none", borderRadius: 6,
                color: "#1e1e2e", padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Создать</button>
              <button onClick={() => setShowCreate(false)} style={{
                flex: 1, background: "#313244", border: "none", borderRadius: 6,
                color: "#a6adc8", padding: "7px", fontSize: 12, cursor: "pointer",
              }}>Отмена</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} style={{
            marginTop: 8, background: "#313244", border: "1px dashed #45475a",
            borderRadius: 8, color: "#a6adc8", padding: "10px",
            fontSize: 12, cursor: "pointer", width: "100%",
          }}>
            + Новый дашборд
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {active ? (
          <>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16,
            }}>
              <div>
                <h2 style={{ color: "#cdd6f4", fontSize: 18, fontWeight: 800, margin: 0 }}>
                  {active.name}
                </h2>
                <span style={{ color: "#585b70", fontSize: 12 }}>
                  {active.widgets?.length || 0} виджетов
                </span>
              </div>
              <button onClick={() => setShowWidget(true)} style={{
                background: "#cba6f7", border: "none", borderRadius: 8,
                color: "#1e1e2e", padding: "10px 20px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                + Добавить виджет
              </button>
            </div>

            {loading ? (
              <div style={{ color: "#585b70", textAlign: "center", marginTop: 60 }}>Загрузка...</div>
            ) : active.widgets?.length === 0 ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#585b70", gap: 16,
              }}>
                <div style={{ fontSize: 16 }}>Дашборд пуст</div>
                <div style={{ fontSize: 13 }}>Нажмите «Добавить виджет» чтобы начать</div>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
                gap: 16,
                overflowY: "auto",
                flex: 1,
              }}>
                {active.widgets.map((w) => (
                  <div key={w.id} style={{ height: 340 }}>
                    <WidgetCard widget={w} onDelete={handleDeleteWidget} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#585b70", gap: 16,
          }}>
            <div style={{ fontSize: 16 }}>Выберите дашборд слева</div>
            <div style={{ fontSize: 13 }}>или создайте новый</div>
          </div>
        )}
      </div>

      {showWidget && (
        <WidgetConstructor
          onAdd={handleAddWidget}
          onClose={() => setShowWidget(false)}
        />
      )}
    </div>
  );
}
