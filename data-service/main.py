from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct, case
from typing import Optional
from datetime import datetime
from database import get_db
import models

app = FastAPI(title="Beauty BI — Data Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Вспомогательная функция фильтров ──────────────────────────
def apply_filters(query, model, date_from, date_to, source, region_id, salon_id, db=None):
    if date_from:
        query = query.filter(model.start_time >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(model.start_time <= datetime.fromisoformat(date_to))
    if source:
        query = query.filter(model.source == source)
    if salon_id:
        query = query.filter(model.salon_id == int(salon_id))
    if region_id and db:
        salon_ids = [s.id for s in db.query(models.Salon.id).filter(
            models.Salon.region_id == int(region_id)
        ).all()]
        query = query.filter(model.salon_id.in_(salon_ids))
    return query

# ─── Справочники ───────────────────────────────────────────────
@app.get("/api/filters/options")
def get_filter_options(db: Session = Depends(get_db)):
    salons = db.query(models.Salon.id, models.Salon.name, models.Salon.city,
                      models.Salon.format).all()
    regions = db.query(models.Region.id, models.Region.name).all()
    return {
        "sources":  ["web", "ios", "android", "walk-in", "phone"],
        "statuses": ["completed", "cancelled", "no-show"],
        "formats":  ["премиум", "стандарт", "эконом"],
        "years":    [2024, 2025, 2026],
        "regions":  [{"id": r.id, "name": r.name} for r in regions],
        "salons":   [{"id": s.id, "name": s.name,
                      "city": s.city, "format": s.format} for s in salons],
    }

@app.get("/api/salons")
def get_salons(db: Session = Depends(get_db)):
    salons = db.query(models.Salon).all()
    return [
        {
            "id": s.id, "name": s.name, "city": s.city,
            "format": s.format, "rating": s.rating,
            "region_id": s.region_id
        }
        for s in salons
    ]

@app.get("/api/services")
def get_services(db: Session = Depends(get_db)):
    return db.query(models.Service).all()

# ─── KPI Overview ──────────────────────────────────────────────
@app.get("/api/analytics/kpi")
def get_kpi(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    region_id: Optional[int] = None,
    salon_id:  Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(models.Appointment)
    q = apply_filters(q, models.Appointment, date_from, date_to,
                      source, region_id, salon_id, db=db)

    total     = q.count()
    completed = q.filter(models.Appointment.status == "completed").count()
    cancelled = q.filter(models.Appointment.status == "cancelled").count()
    noshow    = q.filter(models.Appointment.status == "no-show").count()

    revenue_q = db.query(func.sum(models.Appointment.final_price))
    revenue_q = apply_filters(revenue_q, models.Appointment,
                              date_from, date_to, source, region_id, salon_id, db=db)
    revenue_q = revenue_q.filter(models.Appointment.status == "completed")
    revenue   = revenue_q.scalar() or 0

    discount_q = db.query(func.sum(models.Appointment.discount_amount))
    discount_q = apply_filters(discount_q, models.Appointment,
                               date_from, date_to, source, region_id, salon_id, db=db)
    discount   = discount_q.scalar() or 0

    bonus_q = db.query(func.sum(models.Appointment.bonus_spent))
    bonus_q = apply_filters(bonus_q, models.Appointment,
                            date_from, date_to, source, region_id, salon_id, db=db)
    bonus   = bonus_q.scalar() or 0

    avg_check = round(revenue / completed, 2) if completed > 0 else 0

    return {
        "total_appointments": total,
        "completed":          completed,
        "cancelled":          cancelled,
        "no_show":            noshow,
        "revenue":            round(revenue, 2),
        "discount_total":     round(discount, 2),
        "bonus_spent_total":  round(bonus, 2),
        "avg_check":          avg_check,
        "conversion_rate":    round(completed / total * 100, 1) if total > 0 else 0,
    }

# ─── Выручка по времени ────────────────────────────────────────
@app.get("/api/analytics/revenue-over-time")
def revenue_over_time(
    group_by:  str = Query("month", enum=["day", "month", "year"]),
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    region_id: Optional[int] = None,
    salon_id:  Optional[int] = None,
    db: Session = Depends(get_db)
):
    if group_by == "year":
        label_col = func.strftime("%Y", models.Appointment.start_time)
    elif group_by == "month":
        label_col = func.strftime("%Y-%m", models.Appointment.start_time)
    else:
        label_col = func.strftime("%Y-%m-%d", models.Appointment.start_time)

    q = db.query(
        label_col.label("period"),
        func.sum(models.Appointment.final_price).label("revenue"),
        func.count(models.Appointment.id).label("count"),
    ).filter(models.Appointment.status == "completed")

    q = apply_filters(q, models.Appointment, date_from, date_to,
                      source, region_id, salon_id, db=db)

    rows = q.group_by(label_col).order_by(label_col).all()
    return [{"period": r.period, "revenue": round(r.revenue or 0, 2),
             "count": r.count} for r in rows]

# ─── По источникам ─────────────────────────────────────────────
@app.get("/api/analytics/by-source")
def by_source(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    salon_id:  Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Appointment.source,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.final_price).label("revenue"),
    ).filter(models.Appointment.status == "completed")
    q = apply_filters(q, models.Appointment, date_from, date_to,
                      None, None, salon_id, db=db)
    rows = q.group_by(models.Appointment.source).all()
    return [{"source": r.source, "count": r.count,
             "revenue": round(r.revenue or 0, 2)} for r in rows]

# ─── По салонам ────────────────────────────────────────────────
@app.get("/api/analytics/by-salon")
def by_salon(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    region_id: Optional[int] = None,
    limit:     int = 20,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Salon.name,
        models.Salon.city,
        models.Salon.format,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.final_price).label("revenue"),
        func.avg(models.Appointment.final_price).label("avg_check"),
    ).join(models.Appointment, models.Salon.id == models.Appointment.salon_id
    ).filter(models.Appointment.status == "completed")

    if date_from:
        q = q.filter(models.Appointment.start_time >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(models.Appointment.start_time <= datetime.fromisoformat(date_to))
    if source:
        q = q.filter(models.Appointment.source == source)
    if region_id:
        q = q.filter(models.Salon.region_id == region_id)

    rows = q.group_by(models.Salon.id).order_by(
        func.sum(models.Appointment.final_price).desc()
    ).limit(limit).all()

    return [
        {
            "name": r.name, "city": r.city, "format": r.format,
            "count": r.count,
            "revenue": round(r.revenue or 0, 2),
            "avg_check": round(r.avg_check or 0, 2),
        }
        for r in rows
    ]

# ─── По услугам ────────────────────────────────────────────────
@app.get("/api/analytics/by-service")
def by_service(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    salon_id:  Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Service.name,
        models.Service.category,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.final_price).label("revenue"),
    ).join(models.Appointment, models.Service.id == models.Appointment.service_id
    ).filter(models.Appointment.status == "completed")
    q = apply_filters(q, models.Appointment, date_from, date_to,
                      source, None, salon_id, db=db)
    rows = q.group_by(models.Service.id).order_by(
        func.sum(models.Appointment.final_price).desc()
    ).all()
    return [{"service": r.name, "category": r.category,
             "count": r.count, "revenue": round(r.revenue or 0, 2)} for r in rows]

# ─── По методу оплаты ──────────────────────────────────────────
@app.get("/api/analytics/by-payment")
def by_payment(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Appointment.payment_method,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.final_price).label("revenue"),
    ).filter(models.Appointment.status == "completed")
    q = apply_filters(q, models.Appointment, date_from, date_to,
                      source, None, None, db=db)
    rows = q.group_by(models.Appointment.payment_method).all()
    return [{"method": r.payment_method, "count": r.count,
             "revenue": round(r.revenue or 0, 2)} for r in rows]

# ─── По дням недели ────────────────────────────────────────────
@app.get("/api/analytics/by-weekday")
def by_weekday(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    db: Session = Depends(get_db)
):
    DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    q = db.query(
        models.Appointment.day_of_week,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.final_price).label("revenue"),
    ).filter(models.Appointment.status == "completed")
    q = apply_filters(q, models.Appointment, date_from, date_to,
                      source, None, None, db=db)
    rows = q.group_by(models.Appointment.day_of_week).order_by(
        models.Appointment.day_of_week
    ).all()
    return [{"day": DAYS[r.day_of_week], "dow": r.day_of_week,
             "count": r.count, "revenue": round(r.revenue or 0, 2)} for r in rows]

# ─── Скидки и бонусы ───────────────────────────────────────────
@app.get("/api/analytics/discounts")
def discounts(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Appointment.discount_pct,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.discount_amount).label("total_discount"),
        func.sum(models.Appointment.bonus_spent).label("total_bonus"),
    )
    q = apply_filters(q, models.Appointment, date_from, date_to,
                      source, None, None, db=db)
    rows = q.group_by(models.Appointment.discount_pct).order_by(
        models.Appointment.discount_pct
    ).all()
    return [
        {
            "discount_pct": r.discount_pct,
            "count": r.count,
            "total_discount": round(r.total_discount or 0, 2),
            "total_bonus": round(r.total_bonus or 0, 2),
        }
        for r in rows
    ]

# ─── Экспорт CSV ───────────────────────────────────────────────
from fastapi.responses import StreamingResponse
import io
import csv

@app.get("/api/export/appointments")
def export_appointments(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    salon_id:  Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Appointment.id,
        models.Appointment.start_time,
        models.Appointment.source,
        models.Appointment.status,
        models.Appointment.payment_method,
        models.Appointment.price,
        models.Appointment.discount_pct,
        models.Appointment.discount_amount,
        models.Appointment.bonus_spent,
        models.Appointment.bonus_earned,
        models.Appointment.final_price,
        models.Salon.name.label("salon"),
        models.Salon.city,
        models.Salon.format,
        models.Service.name.label("service"),
        models.Service.category,
    ).join(models.Salon,   models.Appointment.salon_id   == models.Salon.id
    ).join(models.Service, models.Appointment.service_id == models.Service.id)

    q = apply_filters(q, models.Appointment, date_from, date_to, source, None, salon_id, db=db)
    q = q.limit(50000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID","Дата","Источник","Статус","Оплата",
        "Цена","Скидка %","Скидка руб","Бонусы списано",
        "Бонусы начислено","Итого","Салон","Город","Формат",
        "Услуга","Категория"
    ])
    for r in q.all():
        writer.writerow([
            r.id,
            r.start_time.strftime("%Y-%m-%d %H:%M"),
            r.source, r.status, r.payment_method,
            r.price, r.discount_pct, r.discount_amount,
            r.bonus_spent, r.bonus_earned, r.final_price,
            r.salon, r.city, r.format,
            r.service, r.category,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=appointments.csv"}
    )

@app.get("/api/export/salons-summary")
def export_salons_summary(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Salon.name,
        models.Salon.city,
        models.Salon.format,
        models.Region.name.label("region"),
        func.count(models.Appointment.id).label("total"),
        func.sum(
            case(
                (models.Appointment.status == "completed", 1),
                else_=0
            )
        ).label("completed"),
        func.sum(models.Appointment.final_price).label("revenue"),
        func.avg(models.Appointment.final_price).label("avg_check"),
        func.sum(models.Appointment.discount_amount).label("discounts"),
        func.sum(models.Appointment.bonus_spent).label("bonus_spent"),
    ).join(models.Master,      models.Salon.id == models.Master.salon_id
    ).join(models.Appointment, models.Master.id == models.Appointment.master_id
    ).join(models.Region,      models.Salon.region_id == models.Region.id)

    if date_from:
        q = q.filter(models.Appointment.start_time >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(models.Appointment.start_time <= datetime.fromisoformat(date_to))

    rows = q.group_by(models.Salon.id).order_by(
        func.sum(models.Appointment.final_price).desc()
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Салон","Город","Формат","Регион",
        "Всего записей","Завершено","Выручка",
        "Средний чек","Скидки","Бонусы списано"
    ])
    for r in rows:
        writer.writerow([
            r.name, r.city, r.format, r.region,
            r.total, r.completed,
            round(r.revenue or 0, 2),
            round(r.avg_check or 0, 2),
            round(r.discounts or 0, 2),
            round(r.bonus_spent or 0, 2),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=salons_summary.csv"}
    )

@app.get("/api/export/services")
def export_services(
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    source:    Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(
        models.Service.name,
        models.Service.category,
        func.count(models.Appointment.id).label("count"),
        func.sum(models.Appointment.final_price).label("revenue"),
        func.avg(models.Appointment.final_price).label("avg_check"),
        func.sum(models.Appointment.discount_amount).label("discounts"),
    ).join(models.Appointment, models.Service.id == models.Appointment.service_id
    ).filter(models.Appointment.status == "completed")
    q = apply_filters(q, models.Appointment, date_from, date_to, source, None, None, db=db)
    rows = q.group_by(models.Service.id).order_by(
        func.sum(models.Appointment.final_price).desc()
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Услуга","Категория","Записей","Выручка","Средний чек","Скидки"])
    for r in rows:
        writer.writerow([
            r.name, r.category, r.count,
            round(r.revenue or 0, 2),
            round(r.avg_check or 0, 2),
            round(r.discounts or 0, 2),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=services.csv"}
    )

# ─── Health check ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "data-service"}