import { useFilters } from "../../context/FilterContext";
import { useEffect, useState } from "react";
import { getFilterOptions } from "../../api";

export default function GlobalFilters() {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [options, setOptions] = useState(null);

  useEffect(() => {
    getFilterOptions().then(setOptions).catch(console.error);
  }, []);

  return (
    <div style={{
      background: "#1e1e2e",
      borderBottom: "1px solid #313244",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
    }}>
      <span style={{ color: "#cdd6f4", fontWeight: 600, fontSize: 13 }}>
        Фильтры:
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ color: "#a6adc8", fontSize: 12 }}>От:</label>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => updateFilter("date_from", e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ color: "#a6adc8", fontSize: 12 }}>До:</label>
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => updateFilter("date_to", e.target.value)}
          style={inputStyle}
        />
      </div>

      <select
        value={filters.source}
        onChange={(e) => updateFilter("source", e.target.value)}
        style={inputStyle}
      >
        <option value="">Все источники</option>
        {options?.sources.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.region_id}
        onChange={(e) => updateFilter("region_id", e.target.value)}
        style={inputStyle}
      >
        <option value="">Все регионы</option>
        {options?.regions.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <select
        value={filters.salon_id}
        onChange={(e) => updateFilter("salon_id", e.target.value)}
        style={inputStyle}
      >
        <option value="">Все салоны</option>
        {options?.salons.map((s) => (
          <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
        ))}
      </select>

      <button onClick={resetFilters} style={resetBtnStyle}>
        Сбросить
      </button>
    </div>
  );
}

const inputStyle = {
  background: "#313244",
  border: "1px solid #45475a",
  borderRadius: 6,
  color: "#cdd6f4",
  padding: "5px 10px",
  fontSize: 12,
  outline: "none",
  cursor: "pointer",
};

const resetBtnStyle = {
  background: "#f38ba8",
  border: "none",
  borderRadius: 6,
  color: "#1e1e2e",
  padding: "5px 14px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  marginLeft: "auto",
};
