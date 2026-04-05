import axios from "axios";

// В Docker запросы идут через nginx proxy
// В dev режиме — напрямую на порты
const IS_DEV = import.meta.env.DEV;

const dataAPI = axios.create({
  baseURL: IS_DEV ? "http://localhost:8001" : "",
});

const dashAPI = axios.create({
  baseURL: IS_DEV ? "http://localhost:8002" : "http://localhost:8002",
});

// ─── Фильтры / справочники ─────────────────────────────────────
export const getFilterOptions = () =>
  dataAPI.get("/api/filters/options").then((r) => r.data);

export const getSalons = () =>
  dataAPI.get("/api/salons").then((r) => r.data);

// ─── Аналитика ─────────────────────────────────────────────────
export const getKPI = (params) =>
  dataAPI.get("/api/analytics/kpi", { params }).then((r) => r.data);

export const getRevenueOverTime = (params) =>
  dataAPI.get("/api/analytics/revenue-over-time", { params }).then((r) => r.data);

export const getBySource = (params) =>
  dataAPI.get("/api/analytics/by-source", { params }).then((r) => r.data);

export const getBySalon = (params) =>
  dataAPI.get("/api/analytics/by-salon", { params }).then((r) => r.data);

export const getByService = (params) =>
  dataAPI.get("/api/analytics/by-service", { params }).then((r) => r.data);

export const getByPayment = (params) =>
  dataAPI.get("/api/analytics/by-payment", { params }).then((r) => r.data);

export const getByWeekday = (params) =>
  dataAPI.get("/api/analytics/by-weekday", { params }).then((r) => r.data);

export const getDiscounts = (params) =>
  dataAPI.get("/api/analytics/discounts", { params }).then((r) => r.data);

// ─── Дашборды ──────────────────────────────────────────────────
export const getDashboards = () =>
  dashAPI.get("/api/dashboards").then((r) => r.data);

export const createDashboard = (data) =>
  dashAPI.post("/api/dashboards", data).then((r) => r.data);

export const getDashboard = (id) =>
  dashAPI.get(`/api/dashboards/${id}`).then((r) => r.data);

export const updateDashboard = (id, data) =>
  dashAPI.put(`/api/dashboards/${id}`, data).then((r) => r.data);

export const deleteDashboard = (id) =>
  dashAPI.delete(`/api/dashboards/${id}`);

// ─── Виджеты ───────────────────────────────────────────────────
export const createWidget = (dashboardId, data) =>
  dashAPI.post(`/api/dashboards/${dashboardId}/widgets`, data).then((r) => r.data);

export const updateWidget = (widgetId, data) =>
  dashAPI.put(`/api/widgets/${widgetId}`, data).then((r) => r.data);

export const deleteWidget = (widgetId) =>
  dashAPI.delete(`/api/widgets/${widgetId}`);

// ─── Экспорт ───────────────────────────────────────────────────
export const exportAppointments = (params) => {
  const base = IS_DEV ? "http://localhost:8001" : "";
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v))
  ).toString();
  window.open(`${base}/api/export/appointments?${query}`, "_blank");
};

export const exportSalonsSummary = (params) => {
  const base = IS_DEV ? "http://localhost:8001" : "";
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v))
  ).toString();
  window.open(`${base}/api/export/salons-summary?${query}`, "_blank");
};

export const exportServices = (params) => {
  const base = IS_DEV ? "http://localhost:8001" : "";
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v))
  ).toString();
  window.open(`${base}/api/export/services?${query}`, "_blank");
};