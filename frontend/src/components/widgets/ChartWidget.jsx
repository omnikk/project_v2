import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { formatMoney, formatNumber, SOURCE_COLORS } from "../../utils/formatters";

const COLORS = ["#cba6f7","#89b4fa","#94e2d5","#a6e3a1","#fab387","#f38ba8","#f9e2af","#89dceb"];

const formatValue = (metric, value) => {
  if (metric === "revenue" || metric === "avg_check") return formatMoney(value);
  return formatNumber(value);
};

export default function ChartWidget({ chartType, data, metric, dimension, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#585b70" }}>
        Нет данных
      </div>
    );
  }

  // Определяем ключи данных
  const getDataKey = () => {
    if (metric === "revenue") return "revenue";
    if (metric === "avg_check") return "avg_check";
    return "count";
  };

  const getLabelKey = () => {
    if (dimension === "time") return "period";
    if (dimension === "source") return "source";
    if (dimension === "salon") return "name";
    if (dimension === "service") return "service";
    if (dimension === "payment") return "method";
    if (dimension === "weekday") return "day";
    return Object.keys(data[0])[0];
  };

  const dataKey  = getDataKey();
  const labelKey = getLabelKey();

  const tooltipFormatter = (value) => formatValue(metric, value);

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
          <XAxis dataKey={labelKey} tick={{ fill: "#a6adc8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#a6adc8", fontSize: 11 }} tickFormatter={(v) => formatValue(metric, v)} />
          <Tooltip
            contentStyle={{ background: "#181825", border: "1px solid #45475a", borderRadius: 8 }}
            labelStyle={{ color: "#cdd6f4" }}
            formatter={tooltipFormatter}
          />
          <Line type="monotone" dataKey={dataKey} stroke="#cba6f7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#313244" />
          <XAxis dataKey={labelKey} tick={{ fill: "#a6adc8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#a6adc8", fontSize: 11 }} tickFormatter={(v) => formatValue(metric, v)} />
          <Tooltip
            contentStyle={{ background: "#181825", border: "1px solid #45475a", borderRadius: 8 }}
            labelStyle={{ color: "#cdd6f4" }}
            formatter={tooltipFormatter}
          />
          <Bar dataKey={dataKey} fill="#cba6f7" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={labelKey}
            cx="50%" cy="50%"
            outerRadius="70%"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: "#a6adc8" }}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={SOURCE_COLORS[data[i][labelKey]] || COLORS[i % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#181825", border: "1px solid #45475a", borderRadius: 8 }}
            formatter={tooltipFormatter}
          />
          <Legend wrapperStyle={{ color: "#a6adc8", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "table") {
    const columns = Object.keys(data[0]);
    return (
      <div style={{ overflowY: "auto", height: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  color: "#a6adc8",
                  borderBottom: "1px solid #45475a",
                  background: "#181825",
                  position: "sticky",
                  top: 0,
                  textTransform: "uppercase",
                  fontSize: 11,
                  letterSpacing: 0.5,
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#23232e" }}>
                {columns.map((col) => (
                  <td key={col} style={{
                    padding: "7px 12px",
                    color: "#cdd6f4",
                    borderBottom: "1px solid #313244",
                  }}>
                    {typeof row[col] === "number" && (col === "revenue" || col === "avg_check")
                      ? formatMoney(row[col])
                      : typeof row[col] === "number"
                        ? formatNumber(row[col])
                        : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}