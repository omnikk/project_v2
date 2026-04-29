import { useState } from "react";
import { METRIC_LABELS, DIMENSION_LABELS, CHART_LABELS } from "../../utils/formatters";

const ALLOWED_CHARTS = {
  time:    ["line", "bar", "table"],
  source:  ["bar", "pie", "table"],
  salon:   ["bar", "table"],
  service: ["bar", "pie", "table"],
  payment: ["bar", "pie", "table"],
  weekday: ["bar", "table"],
};

const ALLOWED_METRICS = {
  time:    ["revenue", "count", "avg_check"],
  source:  ["revenue", "count"],
  salon:   ["revenue", "count", "avg_check"],
  service: ["revenue", "count"],
  payment: ["revenue", "count"],
  weekday: ["revenue", "count"],
};

const METRICS    = Object.keys(METRIC_LABELS);
const DIMENSIONS = Object.keys(DIMENSION_LABELS);
const CHARTS     = Object.keys(CHART_LABELS);

export default function WidgetConstructor({ onAdd, onClose }) {
  const [form, setForm] = useState({
    title:      "Новый виджет",
    chart_type: "bar",
    metric:     "revenue",
    dimension:  "time",
    time_group: "month",
  });

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "dimension") {
        const allowed_c = ALLOWED_CHARTS[val] || CHARTS;
        const allowed_m = ALLOWED_METRICS[val] || METRICS;
        if (!allowed_c.includes(next.chart_type)) next.chart_type = allowed_c[0];
        if (!allowed_m.includes(next.metric))     next.metric     = allowed_m[0];
      }
      return next;
    });
  };

  const allowedCharts  = ALLOWED_CHARTS[form.dimension]  || CHARTS;
  const allowedMetrics = ALLOWED_METRICS[form.dimension] || METRICS;
  const finalCharts = [...new Set([...allowedCharts, "kpi"])];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#1e1e2e",
        border: "1px solid #45475a",
        borderRadius: 16,
        padding: 32,
        width: 500,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <h2 style={{ color: "#cba6f7", marginBottom: 24, fontSize: 18 }}>
          Создать виджет
        </h2>

        <div style={fieldStyle}>
          <label style={labelStyle}>Название</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Разбивка данных</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DIMENSIONS.map((d) => (
              <button
                key={d}
                onClick={() => set("dimension", d)}
                style={{
                  ...chipStyle,
                  background: form.dimension === d ? "#89b4fa" : "#313244",
                  color:      form.dimension === d ? "#1e1e2e" : "#a6adc8",
                }}
              >
                {DIMENSION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Метрика</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {METRICS.map((m) => {
              const disabled = !allowedMetrics.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => !disabled && set("metric", m)}
                  style={{
                    ...chipStyle,
                    background: form.metric === m ? "#cba6f7" : "#313244",
                    color:      form.metric === m ? "#1e1e2e" : disabled ? "#3d3d52" : "#a6adc8",
                    cursor:     disabled ? "not-allowed" : "pointer",
                    opacity:    disabled ? 0.4 : 1,
                  }}
                >
                  {METRIC_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>

        {form.dimension === "time" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Группировка по времени</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["day", "month", "year"].map((g) => (
                <button
                  key={g}
                  onClick={() => set("time_group", g)}
                  style={{
                    ...chipStyle,
                    background: form.time_group === g ? "#94e2d5" : "#313244",
                    color:      form.time_group === g ? "#1e1e2e" : "#a6adc8",
                  }}
                >
                  {g === "day" ? "День" : g === "month" ? "Месяц" : "Год"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Тип визуализации</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CHARTS.map((c) => {
              const disabled = !finalCharts.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => !disabled && set("chart_type", c)}
                  style={{
                    ...chipStyle,
                    background: form.chart_type === c ? "#a6e3a1" : "#313244",
                    color:      form.chart_type === c ? "#1e1e2e" : disabled ? "#3d3d52" : "#a6adc8",
                    cursor:     disabled ? "not-allowed" : "pointer",
                    opacity:    disabled ? 0.4 : 1,
                  }}
                >
                  {CHART_LABELS[c]}
                </button>
              );
            })}
          </div>
          {form.chart_type === "kpi" && (
            <div style={{ marginTop: 8, color: "#585b70", fontSize: 11 }}>
              KPI показывает одно число за выбранный период
            </div>
          )}
        </div>

        <div style={{
          background: "#181825", borderRadius: 8, padding: "12px 16px",
          marginBottom: 24, border: "1px solid #313244",
        }}>
          <div style={{ color: "#585b70", fontSize: 11, marginBottom: 6 }}>ИТОГОВАЯ КОНФИГУРАЦИЯ</div>
          <div style={{ color: "#cdd6f4", fontSize: 13 }}>
            <span style={{ color: "#cba6f7" }}>{METRIC_LABELS[form.metric]}</span>
            {" · "}
            <span style={{ color: "#89b4fa" }}>{DIMENSION_LABELS[form.dimension]}</span>
            {form.dimension === "time" && (
              <span style={{ color: "#94e2d5" }}> ({form.time_group === "day" ? "по дням" : form.time_group === "month" ? "по месяцам" : "по годам"})</span>
            )}
            {" · "}
            <span style={{ color: "#a6e3a1" }}>{CHART_LABELS[form.chart_type]}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => onAdd(form)}
            style={{
              flex: 1, background: "#cba6f7", border: "none",
              borderRadius: 8, padding: "12px",
              color: "#1e1e2e", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}
          >
            Добавить на дашборд
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: "#313244", border: "none",
              borderRadius: 8, padding: "12px",
              color: "#a6adc8", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldStyle = { marginBottom: 20 };
const labelStyle = {
  display: "block", color: "#a6adc8", fontSize: 12,
  fontWeight: 600, marginBottom: 8,
  textTransform: "uppercase", letterSpacing: 0.5,
};
const inputStyle = {
  width: "100%", background: "#313244", border: "1px solid #45475a",
  borderRadius: 8, color: "#cdd6f4", padding: "10px 14px",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const chipStyle = {
  border: "none", borderRadius: 20, padding: "6px 14px",
  fontSize: 12, fontWeight: 600, transition: "all 0.15s",
};
