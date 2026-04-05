import { createContext, useContext, useState } from "react";

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({
    date_from: "2024-01-01",
    date_to:   "2026-12-31",
    source:    "",
    region_id: "",
    salon_id:  "",
  });

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () =>
    setFilters({
      date_from: "2024-01-01",
      date_to:   "2026-12-31",
      source:    "",
      region_id: "",
      salon_id:  "",
    });

  // Убираем пустые значения для API запросов
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== "")
  );

  return (
    <FilterContext.Provider value={{ filters, activeFilters, updateFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);