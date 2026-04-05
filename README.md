---

## 4. ИСПОЛЬЗУЕМЫЕ ТЕХНИЧЕСКИЕ СРЕДСТВА

### Минимальные требования к серверу:
- Процессор: 4 ядра, 2.0 ГГц
- Оперативная память: 4 ГБ
- Дисковое пространство: 2 ГБ
- ОС: Windows 10/11, Linux (Ubuntu 20.04+), macOS 11+
- Docker Desktop 4.0+

### Требования к клиентской части:
- Веб-браузер: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Разрешение экрана: минимум 1280×720

---

## 5. ВЫЗОВ И ЗАГРУЗКА

### Запуск через Docker (рекомендуется):
```bash
docker compose up --build
```
Приложение доступно на http://localhost

### Запуск для разработки (без Docker):

**Data Service:**
```bash
cd data-service
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
python seed.py                 # генерация базовых данных (1 раз)
python seed_appointments.py    # генерация 3,8 млн записей (1 раз, ~10 мин)
uvicorn main:app --port 8001 --reload
```

**Dashboard Service:**
```bash
cd dashboard-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --port 8002 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# открыть http://localhost:5173
```

---

## 6. ВХОДНЫЕ ДАННЫЕ

### Глобальные фильтры (применяются ко всем запросам):

| Параметр | Тип | Описание |
|---|---|---|
| date_from | ISO date | Начало периода |
| date_to | ISO date | Конец периода |
| source | string | Источник: web/ios/android/walk-in/phone |
| region_id | integer | ID региона |
| salon_id | integer | ID конкретного салона |

### Конфигурация виджета:
```json
{
  "title": "string",
  "chart_type": "line|bar|pie|kpi|table",
  "metric": "revenue|count|avg_check|discount|bonus",
  "dimension": "time|source|salon|service|payment|weekday",
  "time_group": "day|month|year",
  "filters_json": "{}",
  "pos_x": 0,
  "pos_y": 0,
  "width": 6,
  "height": 4
}
```

---

## 7. ВЫХОДНЫЕ ДАННЫЕ

### KPI Overview:
```json
{
  "total_appointments": 3866078,
  "completed": 3015000,
  "cancelled": 618000,
  "no_show": 233000,
  "revenue": 10333456986.0,
  "discount_total": 580041042.0,
  "bonus_spent_total": 123381566.0,
  "avg_check": 3431.0,
  "conversion_rate": 78.0
}
```

### Выручка по времени:
```json
[
  {"period": "2024-01", "revenue": 285000000.0, "count": 105432},
  {"period": "2024-02", "revenue": 271000000.0, "count": 98211}
]
```

### Экспорт CSV:
- `appointments.csv` — детальные данные по записям (до 50 000 строк)
- `salons_summary.csv` — сводная таблица по всем 200 салонам
- `services.csv` — аналитика по услугам

---

## 8. ТЕСТОВЫЕ ДАННЫЕ

| Объект | Количество |
|---|---|
| Регионы | 10 |
| Города | 22 |
| Салоны | 200 |
| Форматы | премиум (20%) / стандарт (50%) / эконом (30%) |
| Мастера | 1016 |
| Клиенты | 60 000 |
| Услуги | 18 (5 категорий) |
| Записи | 3 866 078 |
| Период | 01.01.2024 — 31.12.2026 |
| Источники | web / ios / android / walk-in / phone |
| Статусы | completed (78%) / cancelled (16%) / no-show (6%) |
| Оплата | card (55%) / cash (25%) / online (20%) |

### Диапазон цен услуг:
- Стрижка мужская: от 780 ₽ (эконом) до 2160 ₽ (премиум)
- Кератиновое выпрямление: от 4550 ₽ до 12 600 ₽
- Средний чек по сети: ~3 431 ₽

---

## В данном проекте реализовано

### 1. База данных

**Что используется:** SQLite 3 + SQLAlchemy 2.0 (ORM)

**Две независимые БД:**

| БД | Сервис | Содержимое |
|---|---|---|
| `salon_data.db` | data-service | Бизнес-данные: салоны, мастера, записи |
| `dashboards.db` | dashboard-service | Конфигурации дашбордов и виджетов |

**Индексы для производительности:**
```sql
idx_apt_salon_year_month (salon_id, year, month)
idx_apt_start_time (start_time)
idx_apt_source (source)
idx_apt_status (status)
```

**Команды для пересоздания БД:**
```bash
cd data-service
rm salon_data.db
python seed.py
python seed_appointments.py  # занимает ~10 минут
```

---

### 2. REST API

**Data Service endpoints:**

| Endpoint | Описание |
|---|---|
| GET /api/filters/options | Справочники для фильтров |
| GET /api/analytics/kpi | KPI показатели |
| GET /api/analytics/revenue-over-time | Выручка по времени |
| GET /api/analytics/by-source | По источникам записи |
| GET /api/analytics/by-salon | По салонам |
| GET /api/analytics/by-service | По услугам |
| GET /api/analytics/by-payment | По методам оплаты |
| GET /api/analytics/by-weekday | По дням недели |
| GET /api/analytics/discounts | Скидки и бонусы |
| GET /api/export/appointments | Экспорт записей CSV |
| GET /api/export/salons-summary | Экспорт салонов CSV |
| GET /api/export/services | Экспорт услуг CSV |

**Dashboard Service endpoints:**

| Endpoint | Описание |
|---|---|
| GET /api/dashboards | Список дашбордов |
| POST /api/dashboards | Создать дашборд |
| GET /api/dashboards/{id} | Дашборд с виджетами |
| PUT /api/dashboards/{id} | Обновить дашборд |
| DELETE /api/dashboards/{id} | Удалить дашборд |
| POST /api/dashboards/{id}/widgets | Добавить виджет |
| PUT /api/widgets/{id} | Обновить виджет |
| DELETE /api/widgets/{id} | Удалить виджет |

---

### 3. Docker

**Структура контейнеров:**

| Контейнер | Образ | Порт |
|---|---|---|
| beauty_data | python:3.11-slim | 8001 (внутренний) |
| beauty_dashboard | python:3.11-slim | 8002 (внутренний) |
| beauty_frontend | nginx:alpine | 80 (публичный) |

**nginx проксирует:**
- `/api/*` → `data-service:8001`
- `/` → React SPA

**Команды Docker:**
```bash
# Запуск
docker compose up --build

# Остановка
docker compose down

# Просмотр логов
docker compose logs -f

# Перезапуск одного сервиса
docker compose restart data-service
```