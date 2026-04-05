import { useState, useEffect } from "react";
import { useFilters } from "../../context/FilterContext";
import { getRevenueOverTime, getBySource, getBySalon, getByService, getByPayment, getByWeekday, getKPI } from "../../api";
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

export default function WidgetCard({ widget, onDelete }) {
  const { activeFilters } = useFilters();
  const [data, setData]   = useState(null);
  const [kpi,  setKpi]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (widget.chart_type === "kpi") {
      getKPI(activeFilters)
        .then(setKpi)
        .finally(() => setLoading(false));
    } else {
      fetchData(widget, activeFilters)
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [widget, activeFilters]);

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
        padding: "12px 16px",
        borderBottom: "1px solid #313244",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1e1e2e",
      }}>
        <div>
          <span style={{ color: "#cdd6f4", fontWeight: 700, fontSize: 13 }}>
            {widget.title}
          </span>
          <span style={{ color: "#585b70", fontSize: 11, marginLeft: 8 }}>
            {METRIC_LABELS[widget.metric]} · {DIMENSION_LABELS[widget.dimension]} · {CHART_LABELS[widget.chart_type]}
          </span>
        </div>
        <button
          onClick={() => onDelete(widget.id)}
          style={{
            background: "none", border: "none",
            color: "#585b70", cursor: "pointer", fontSize: 16,
            padding: "2px 6px", borderRadius: 4,
          }}
          title="Удалить виджет"
        >
          ✕
        </button>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, padding: 16, minHeight: 0 }}>
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