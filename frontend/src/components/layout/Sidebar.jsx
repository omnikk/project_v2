import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV = [
  { path: "/",          icon: null, label: "Обзор" },
  { path: "/dashboards",icon: null, label: "Дашборды" },
  { path: "/salons",    icon: null, label: "Салоны" },
  { path: "/services",  icon: null, label: "Услуги" },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      width: collapsed ? 60 : 220,
      minHeight: "100vh",
      background: "#181825",
      borderRight: "1px solid #313244",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.2s",
      flexShrink: 0,
    }}>
      {/* Лого */}
      <div style={{
        padding: "20px 16px",
        borderBottom: "1px solid #313244",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {!collapsed && (
          <span style={{ color: "#cba6f7", fontWeight: 800, fontSize: 16 }}>
            Beauty BI
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "none", border: "none",
            color: "#a6adc8", cursor: "pointer", fontSize: 18,
          }}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      {/* Навигация */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 4,
                background: active ? "#313244" : "transparent",
                color: active ? "#cba6f7" : "#a6adc8",
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "#23232e";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              {!collapsed && <span>{item.label}</span>}
              {collapsed && <span style={{ fontSize: 13 }}>{item.label.slice(0, 2)}</span>}
            </div>
          );
        })}
      </nav>

      {/* Версия */}
      {!collapsed && (
        <div style={{
          padding: "16px",
          borderTop: "1px solid #313244",
          color: "#585b70",
          fontSize: 11,
        }}>
          Beauty BI v1.0 · 200 салонов
        </div>
      )}
    </div>
  );
}
