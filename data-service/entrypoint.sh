#!/bin/sh
set -e
 
DB_PATH="/app/data/salon_data.db"
 
if [ ! -f "$DB_PATH" ]; then
  echo "=== База данных не найдена. Первый запуск — генерируем данные... ==="
  echo ">>> Шаг 1/2: Базовые данные (регионы, салоны, мастера, клиенты)..."
  python seed.py
  echo ">>> Шаг 2/2: Генерация 3.8 млн записей (займёт 5-10 минут)..."
  python seed_appointments.py
  echo "=== Данные сгенерированы успешно! ==="
else
  echo "=== База данных найдена, пропускаем генерацию ==="
fi
 
echo ">>> Запускаем data-service..."
exec uvicorn main:app --host 0.0.0.0 --port 8001