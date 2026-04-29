import { useEffect, useState } from "react";
import { getBySalon, exportSalonsSummary } from "../api";
import { useFilters } from "../context/FilterContext";
import { formatMoney, formatNumber } from "../utils/formatters";

export default function Salons() {
  const { activeFilters } = useFilters();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState("revenue");

  useEffect(() => {
    setLoading(true);
    getBySalon({ ...activeFilters, limit: 200 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [activeFilters]);

  const sorted = [...data].sort((a, b) => b[sort] - a[sort]);

  const FORMAT_COLOR = { премиум: "#f9e2af", стандарт: "#89b4fa", эконом: "#a6e3a1" };

  return (
    <div>
      <h1 style={{ color: "#cba6f7", marginBottom: 8, fontSize: 22, fontWeight: 800 }}>
        Рейтинг салонов
      </h1>
      <p style={{ color: "#585b70", marginBottom: 24, fontSize: 13 }}>
        Топ по выбранным фильтрам · {data.length} салонов
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        {[["revenue","Выручка"],["count","Записей"],["avg_check","Средний чек"]].map(([key, label]) => (
          <button key={key} onClick={() => setSort(key)} style={{
            background: sort === key ? "#cba6f7" : "#313244",
            color: sort === key ? "#1e1e2e" : "#a6adc8",
            border: "none", borderRadius: 20, padding: "6px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {label}
          </button>
        ))}
        <button
          onClick={() => exportSalonsSummary(activeFilters)}
          style={{
            marginLeft: "auto",
            background: "#313244", border: "1px solid #45475a",
            borderRadius: 8, color: "#89b4fa", padding: "6px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Экспорт CSV
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#585b70", textAlign: "center", marginTop: 60 }}>Загрузка...</div>
      ) : (
        <div style={{ background: "#181825", border: "1px solid #313244", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#1e1e2e" }}>
                {["#","Салон","Город","Формат","Записей","Выручка","Средний чек"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    color: "#a6adc8", fontSize: 11, textTransform: "uppercase",
                    letterSpacing: 0.5, borderBottom: "1px solid #313244",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #313244" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#23232e"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 16px", color: "#585b70" }}>{i + 1}</td>
                  <td style={{ padding: "10px 16px", color: "#cdd6f4", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "10px 16px", color: "#a6adc8" }}>{s.city}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      background: FORMAT_COLOR[s.format] + "22",
                      color: FORMAT_COLOR[s.format],
                      padding: "2px 10px", borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                    }}>{s.format}</span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#cdd6f4" }}>{formatNumber(s.count)}</td>
                  <td style={{ padding: "10px 16px", color: "#a6e3a1", fontWeight: 700 }}>{formatMoney(s.revenue)}</td>
                  <td style={{ padding: "10px 16px", color: "#89b4fa" }}>{formatMoney(s.avg_check)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
