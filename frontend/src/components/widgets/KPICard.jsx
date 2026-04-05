import { formatMoney, formatNumber, formatPercent } from "../../utils/formatters";

export default function KPICard({ title, value, metric, trend }) {
  const format = (v) => {
    if (metric === "revenue" || metric === "avg_check" || metric === "discount" || metric === "bonus")
      return formatMoney(v);
    if (metric === "conversion")
      return formatPercent(v);
    return formatNumber(v);
  };

  return (
    <div style={{
      background: "#313244",
      borderRadius: 12,
      padding: "20px 24px",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      border: "1px solid #45475a",
    }}>
      <div style={{ color: "#a6adc8", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ color: "#cdd6f4", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
        {value !== undefined && value !== null ? format(value) : "—"}
      </div>
      {trend !== undefined && (
        <div style={{ fontSize: 12, color: trend >= 0 ? "#a6e3a1" : "#f38ba8" }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}