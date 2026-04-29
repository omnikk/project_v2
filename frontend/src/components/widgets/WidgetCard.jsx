import { useState, useEffect } from "react";
import { getRevenueOverTime, getBySource, getBySalon, getByService, getByPayment, getByWeekday, getKPI, getFilterOptions } from "../../api";
import ChartWidget from "./ChartWidget";
import KPICard from "./KPICard";
import { METRIC_LABELS, DIMENSION_LABELS, CHART_LABELS } from "../../utils/formatters";

const fetchData = async (widget, filters) => {
  const params = { ...filters };
  if (widget.dimension === "time") {
    params.group_by = widget.time_group || "month";
    return getRevenueOverTime(params);
  }
  if (widget.dimension === "source")  return getBySource(params);
  if (widget.dimension === "salon")   return getBySalon({ ...params, limit: 20 });
  if (widget.dimension === "service") return getByService(params);
  if (widget.dimension === "payment") return getByPayment(params);
  if (widget.dimension === "weekday") return getByWeekday(params);
  return [];
};

const getKPIValue = (kpi, metric) => {
  if (metric === "revenue")   return kpi.revenue;
  if (metric === "count")     return kpi.completed;
  if (metric === "avg_check") return kpi.avg_check;
  if (metric === "discount")  return kpi.discount_total;
  if (metric === "bonus")     return kpi.bonus_spent_total;
  return null;
};

const DEFAULT_FILTERS = {
  date_from: "2024-01-01",
  date_to: "2026-12-31",
  source: "",
  region_id: "",
  salon_id: "",
};

export default function WidgetCard({ widget, onDelete }) {
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters]   = useState(false);
  const [options, setOptions]           = useState(null);
  const [data, setData]                 = useState(null);
  const [kpi,  setKpi]                  = useState(null);
  const [loading, setLoading]           = useState(true);

  // Загружаем справочники один раз
  useEffect(() => {
    getFilterOptions().then(setOptions).catch(console.error);
  }, []);

  // Загружаем данные при изменении фильтров
  useEffect(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(localFilters).filter(([_, v]) => v !== "")
    );
    setLoading(true);
    if (widget.chart_type === "kpi") {
      getKPI(activeFilters).then(setKpi).finally(() => setLoading(false));
    } else {
      fetchData(widget, activeFilters).then(setData).finally(() => setLoading(false));
    }
  }, [widget, localFilters]);

  const setFilter = (key, val) =>
    setLocalFilters(prev => ({ ...prev, [key]: val }));

  const resetFilters = () => setLocalFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    localFilters.date_from !== DEFAULT_FILTERS.date_from ||
    localFilters.date_to   !== DEFAULT_FILTERS.date_to   ||
    localFilters.source    !== "" ||
    localFilters.region_id !== "" ||
    localFilters.salon_id  !== "";

  return (
    <div style={{
      background: "#181825",
      border: "1px solid #313244",
      borderRadius: 12,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Заголовок */}
      <div style={{
        padding: "10px 14px",
        borderBottom: showFilters ? "1px solid #313244" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1e1e2e",
        gap: 8,
      }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ color: "#cdd6f4", fontWeight: 700, fontSize: 13 }}>
            {widget.title}
          </span>
          <span style={{ color: "#585b70", fontSize: 11, marginLeft: 8 }}>
            {METRIC_LABELS[widget.metric]} · {DIMENSION_LABELS[widget.dimension]}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {/* Кнопка фильтров */}
          <button
            onClick={() => setShowFilters(f => !f)}
            title="Фильтры виджета"
            style={{
              background: hasActiveFilters ? "#cba6f722" : "none",
              border: hasActiveFilters ? "1px solid #cba6f7" : "1px solid #45475a",
              borderRadius: 6,
              color: hasActiveFilters ? "#cba6f7" : "#585b70",
              cursor: "pointer",
              fontSize: 11,
              padding: "3px 8px",
              fontWeight: 600,
            }}
          >
            {hasActiveFilters ? "Фильтры *" : "Фильтры"}
          </button>
          {/* Удалить */}
          <button
            onClick={() => onDelete(widget.id)}
            style={{
              background: "none", border: "none",
              color: "#585b70", cursor: "pointer", fontSize: 14,
              padding: "2px 4px", borderRadius: 4,
            }}
            title="Удалить виджет"
          >
            x
          </button>
        </div>
      </div>

      {/* Панель фильтров — раскрывается по клику */}
      {showFilters && (
        <div style={{
          background: "#13131f",
          borderBottom: "1px solid #313244",
          padding: "10px 14px",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}>
          {/* Дата от */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>От:</span>
            <input
              type="date"
              value={localFilters.date_from}
              onChange={e => setFilter("date_from", e.target.value)}
              style={inputStyle}
            />
          </div>
          {/* Дата до */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={labelStyle}>До:</span>
            <input
              type="date"
              value={localFilters.date_to}
              onChange={e => setFilter("date_to", e.target.value)}
              style={inputStyle}
            />
          </div>
          {/* Источник */}
          <select
            value={localFilters.source}
            onChange={e => setFilter("source", e.target.value)}
            style={inputStyle}
          >
            <option value="">Все источники</option>
            {options?.sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {/* Регион */}
          <select
            value={localFilters.region_id}
            onChange={e => setFilter("region_id", e.target.value)}
            style={inputStyle}
          >
            <option value="">Все регионы</option>
            {options?.regions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {/* Салон */}
          <select
            value={localFilters.salon_id}
            onChange={e => setFilter("salon_id", e.target.value)}
            style={inputStyle}
          >
            <option value="">Все салоны</option>
            {options?.salons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {/* Сброс */}
          {hasActiveFilters && (
            <button onClick={resetFilters} style={resetStyle}>
              Сбросить
            </button>
          )}
        </div>
      )}

      {/* Контент */}
      <div style={{ flex: 1, padding: 14, minHeight: 0 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#585b70", fontSize:13 }}>
            Загрузка...
          </div>
        ) : widget.chart_type === "kpi" ? (
          <KPICard
            title={widget.title}
            metric={widget.metric}
            value={kpi ? getKPIValue(kpi, widget.metric) : null}
          />
        ) : (
          <ChartWidget
            chartType={widget.chart_type}
            data={data}
            metric={widget.metric}
            dimension={widget.dimension}
            title={widget.title}
          />
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  color: "#585b70",
  fontSize: 11,
};

const inputStyle = {
  background: "#1e1e2e",
  border: "1px solid #313244",
  borderRadius: 5,
  color: "#cdd6f4",
  padding: "4px 8px",
  fontSize: 11,
  outline: "none",
  cursor: "pointer",
};

const resetStyle = {
  background: "none",
  border: "1px solid #f38ba8",
  borderRadius: 5,
  color: "#f38ba8",
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
