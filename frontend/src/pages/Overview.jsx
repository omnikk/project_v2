import { useEffect, useState } from "react";
import { getKPI, getRevenueOverTime, getBySource, exportAppointments, exportSalonsSummary } from "../api";
import { useFilters } from "../context/FilterContext";
import { formatMoney, formatNumber, formatPercent } from "../utils/formatters";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const SOURCE_COLORS = {
  web: "#cba6f7", ios: "#89b4fa", android: "#94e2d5",
  "walk-in": "#fab387", phone: "#f38ba8"
};

const KPI = ({ label, value, color }) => (
  <div style={{
    background: "#181825", border: "1px solid #313244",
    borderRadius: 12, padding: "20px 24px",
    borderTop: `3px solid ${color}`,
  }}>
    <div style={{ color: "#a6adc8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ color: "#cdd6f4", fontSize: 26, fontWeight: 800 }}>{value}</div>
  </div>
);

export default function Overview() {
  const { activeFilters } = useFilters();
  const [kpi,      setKpi]      = useState(null);
  const [revenue,  setRevenue]  = useState([]);
  const [sources,  setSources]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getKPI(activeFilters),
      getRevenueOverTime({ ...activeFilters, group_by: "month" }),
      getBySource(activeFilters),
    ]).then(([k, r, s]) => {
      setKpi(k); setRevenue(r); setSources(s);
    }).finally(() => setLoading(false));
  }, [activeFilters]);

  if (loading) return (
    <div style={{ color: "#585b70", textAlign: "center", marginTop: 80, fontSize: 16 }}>
      Загрузка данных...
    </div>
  );

  return (
    <div>
      <h1 style={{ color: "#cba6f7", marginBottom: 8, fontSize: 22, fontWeight: 800 }}>
        Обзор сети
      </h1>
      <p style={{ color: "#585b70", marginBottom: 28, fontSize: 13 }}>
        200 салонов · данные за 2024–2026
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <button
          onClick={() => exportAppointments(activeFilters)}
          style={{
            background: "#313244", border: "1px solid #45475a",
            borderRadius: 8, color: "#a6e3a1", padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Экспорт записей CSV
        </button>
        <button
          onClick={() => exportSalonsSummary(activeFilters)}
          style={{
            background: "#313244", border: "1px solid #45475a",
            borderRadius: 8, color: "#89b4fa", padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          Экспорт салонов CSV
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16, marginBottom: 28,
      }}>
        <KPI label="Выручка"        value={formatMoney(kpi?.revenue)}          color="#cba6f7" />
        <KPI label="Завершено"      value={formatNumber(kpi?.completed)}        color="#a6e3a1" />
        <KPI label="Отменено"       value={formatNumber(kpi?.cancelled)}        color="#f38ba8" />
        <KPI label="Средний чек"    value={formatMoney(kpi?.avg_check)}         color="#89b4fa" />
        <KPI label="Конверсия"      value={formatPercent(kpi?.conversion_rate)} color="#fab387" />
        <KPI label="Скидки итого"   value={formatMoney(kpi?.discount_total)}    color="#f9e2af" />
        <KPI label="Бонусы списано" value={formatMoney(kpi?.bonus_spent_total)} color="#94e2d5" />
        <KPI label="Всего записей"  value={formatNumber(kpi?.total_appointments)} color="#cba6f7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <div style={{
          background: "#181825", border: "1px solid #313244",
          borderRadius: 12, padding: 24,
        }}>
          <h3 style={{ color: "#cdd6f4", marginBottom: 20, fontSize: 14, fontWeight: 700 }}>
            Выручка по месяцам
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
              <XAxis dataKey="period" tick={{ fill: "#a6adc8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#a6adc8", fontSize: 10 }}
                tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ background: "#181825", border: "1px solid #45475a", borderRadius: 8 }}
                formatter={(v) => formatMoney(v)}
              />
              <Line type="monotone" dataKey="revenue" stroke="#cba6f7"
                strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: "#181825", border: "1px solid #313244",
          borderRadius: 12, padding: 24,
        }}>
          <h3 style={{ color: "#cdd6f4", marginBottom: 20, fontSize: 14, fontWeight: 700 }}>
            Источники записей
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sources} dataKey="count" nameKey="source"
                cx="50%" cy="50%" outerRadius={90}
                label={({ source, percent }) => `${source} ${(percent*100).toFixed(0)}%`}
              >
                {sources.map((s, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[s.source] || "#cba6f7"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#181825", border: "1px solid #45475a", borderRadius: 8 }}
                formatter={(v) => formatNumber(v)}
              />
              <Legend wrapperStyle={{ color: "#a6adc8", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
