import { useEffect, useState } from "react";
import { getByService, exportServices } from "../api";
import { useFilters } from "../context/FilterContext";
import { formatMoney, formatNumber } from "../utils/formatters";

const CAT_COLORS = {
  волосы: "#cba6f7", ногти: "#f38ba8",
  лицо: "#89b4fa", тело: "#94e2d5", брови: "#fab387",
};

export default function Services() {
  const { activeFilters } = useFilters();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getByService(activeFilters).then(setData).finally(() => setLoading(false));
  }, [activeFilters]);

  const maxRevenue = data[0]?.revenue || 1;

  return (
    <div>
      <h1 style={{ color: "#cba6f7", marginBottom: 8, fontSize: 22, fontWeight: 800 }}>
        Аналитика услуг
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <p style={{ color: "#585b70", fontSize: 13, margin: 0 }}>
          Топ услуг по выручке
        </p>
        <button
          onClick={() => exportServices(activeFilters)}
          style={{
            background: "#313244", border: "1px solid #45475a",
            borderRadius: 8, color: "#a6e3a1", padding: "6px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Экспорт CSV
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#585b70", textAlign: "center", marginTop: 60 }}>Загрузка...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((item, i) => (
            <div key={i} style={{
              background: "#181825", border: "1px solid #313244",
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#585b70", fontSize: 13, width: 24 }}>{i + 1}</span>
                  <span style={{ color: "#cdd6f4", fontWeight: 700, fontSize: 14 }}>{item.service}</span>
                  <span style={{
                    background: (CAT_COLORS[item.category] || "#cba6f7") + "22",
                    color: CAT_COLORS[item.category] || "#cba6f7",
                    padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                  }}>{item.category}</span>
                </div>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <span style={{ color: "#a6adc8", fontSize: 13 }}>{formatNumber(item.count)} записей</span>
                  <span style={{ color: "#a6e3a1", fontWeight: 800, fontSize: 15 }}>{formatMoney(item.revenue)}</span>
                </div>
              </div>
              <div style={{ background: "#313244", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${(item.revenue / maxRevenue) * 100}%`,
                  height: "100%",
                  background: CAT_COLORS[item.category] || "#cba6f7",
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
