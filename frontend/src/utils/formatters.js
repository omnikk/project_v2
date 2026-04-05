export const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style:    "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
};

export const METRIC_LABELS = {
  revenue:   "Выручка",
  count:     "Количество записей",
  avg_check: "Средний чек",
  discount:  "Скидки",
  bonus:     "Бонусы",
};

export const DIMENSION_LABELS = {
  time:     "По времени",
  source:   "По источнику",
  salon:    "По салону",
  service:  "По услуге",
  payment:  "По оплате",
  weekday:  "По дням недели",
};

export const CHART_LABELS = {
  line:  "Линейный",
  bar:   "Столбчатый",
  pie:   "Круговой",
  kpi:   "KPI карточка",
  table: "Таблица",
};

export const SOURCE_COLORS = {
  web:      "#6366f1",
  ios:      "#06b6d4",
  android:  "#10b981",
  "walk-in":"#f59e0b",
  phone:    "#ef4444",
};