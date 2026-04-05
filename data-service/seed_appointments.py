import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

SOURCES = ["web", "ios", "android", "walk-in", "phone"]
SOURCE_WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10]
STATUSES = ["completed", "cancelled", "no-show"]
STATUS_WEIGHTS = [0.78, 0.16, 0.06]
PAYMENT_METHODS = ["card", "cash", "online"]
PAYMENT_WEIGHTS = [0.55, 0.25, 0.20]

FORMAT_PRICE_MULT = {"премиум": 1.8, "стандарт": 1.0, "эконом": 0.65}

def generate_appointments():
    db = SessionLocal()
    print("Загружаем справочники...")

    salons = db.query(models.Salon).all()
    services = db.query(models.Service).all()
    clients = db.query(models.Client).all()

    # Мастера по салону
    masters_by_salon = {}
    for m in db.query(models.Master).all():
        masters_by_salon.setdefault(m.salon_id, []).append(m)

    client_ids = [c.id for c in clients]
    service_list = [(s.id, s.base_price, s.duration_min) for s in services]

    # Период: 2024-01-01 по 2026-12-31
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2026, 12, 31)

    total = 0
    batch = []
    BATCH_SIZE = 5000

    print("Генерируем записи (это займёт 3-7 минут)...")

    current_date = start_date
    while current_date <= end_date:
        dow = current_date.weekday()  # 0=пн 6=вс
        is_weekend = dow >= 5

        for salon in salons:
            fmt = salon.format
            price_mult = FORMAT_PRICE_MULT.get(fmt, 1.0)
            masters = masters_by_salon.get(salon.id, [])
            if not masters:
                continue

            # Количество записей в день зависит от формата и дня
            if fmt == "премиум":
                base_count = random.randint(8, 18)
            elif fmt == "стандарт":
                base_count = random.randint(12, 28)
            else:
                base_count = random.randint(6, 15)

            if is_weekend:
                base_count = int(base_count * 1.3)

            for _ in range(base_count):
                hour = random.randint(9, 20)
                minute = random.choice([0, 30])
                start_time = current_date.replace(
                    hour=hour, minute=minute, second=0, microsecond=0
                )

                svc_id, base_price, dur = random.choice(service_list)
                price = round(base_price * price_mult * random.uniform(0.9, 1.1), 0)
                end_time = start_time + timedelta(minutes=dur)

                status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
                source = random.choices(SOURCES, weights=SOURCE_WEIGHTS)[0]
                payment = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS)[0]

                # Скидки и бонусы
                discount_pct = random.choices(
                    [0, 5, 10, 15, 20],
                    weights=[60, 15, 12, 8, 5]
                )[0]
                discount_amount = round(price * discount_pct / 100, 0)
                bonus_spent = round(random.uniform(0, min(price * 0.1, 500)), 0) \
                    if random.random() < 0.2 else 0
                final_price = max(0, price - discount_amount - bonus_spent)
                bonus_earned = round(final_price * 0.05, 0) \
                    if status == "completed" else 0

                apt = models.Appointment(
                    salon_id=salon.id,
                    master_id=random.choice(masters).id,
                    client_id=random.choice(client_ids),
                    service_id=svc_id,
                    start_time=start_time,
                    end_time=end_time,
                    year=current_date.year,
                    month=current_date.month,
                    day_of_week=dow,
                    source=source,
                    status=status,
                    payment_method=payment,
                    price=price,
                    discount_pct=discount_pct,
                    discount_amount=discount_amount,
                    bonus_spent=bonus_spent,
                    bonus_earned=bonus_earned,
                    final_price=final_price,
                )
                batch.append(apt)
                total += 1

        if len(batch) >= BATCH_SIZE:
            db.bulk_save_objects(batch)
            db.commit()
            batch = []
            print(f"  Записей добавлено: {total:,} | Дата: {current_date.date()}")

        current_date += timedelta(days=1)

    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    print(f"\nГотово! Всего записей: {total:,}")
    db.close()

if __name__ == "__main__":
    generate_appointments()