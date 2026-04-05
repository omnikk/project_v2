
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json

from database import get_db, engine, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Beauty BI — Dashboard Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic схемы ────────────────────────────────────────────
class WidgetCreate(BaseModel):
    title:      str
    chart_type: str
    metric:     str
    dimension:  str
    time_group: Optional[str] = "month"
    filters_json: Optional[str] = "{}"
    pos_x:      Optional[int] = 0
    pos_y:      Optional[int] = 0
    width:      Optional[int] = 6
    height:     Optional[int] = 4

class WidgetUpdate(BaseModel):
    title:      Optional[str] = None
    chart_type: Optional[str] = None
    metric:     Optional[str] = None
    dimension:  Optional[str] = None
    time_group: Optional[str] = None
    filters_json: Optional[str] = None
    pos_x:      Optional[int] = None
    pos_y:      Optional[int] = None
    width:      Optional[int] = None
    height:     Optional[int] = None

class DashboardCreate(BaseModel):
    name:        str
    description: Optional[str] = ""

class DashboardUpdate(BaseModel):
    name:        Optional[str] = None
    description: Optional[str] = None

# ─── Дашборды ──────────────────────────────────────────────────
@app.get("/api/dashboards")
def list_dashboards(db: Session = Depends(get_db)):
    dashboards = db.query(models.Dashboard).all()
    return [
        {
            "id":          d.id,
            "name":        d.name,
            "description": d.description,
            "created_at":  d.created_at.isoformat(),
            "widget_count": len(d.widgets),
        }
        for d in dashboards
    ]

@app.post("/api/dashboards", status_code=201)
def create_dashboard(body: DashboardCreate, db: Session = Depends(get_db)):
    d = models.Dashboard(name=body.name, description=body.description)
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id, "name": d.name, "description": d.description}

@app.get("/api/dashboards/{dashboard_id}")
def get_dashboard(dashboard_id: int, db: Session = Depends(get_db)):
    d = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return {
        "id":          d.id,
        "name":        d.name,
        "description": d.description,
        "created_at":  d.created_at.isoformat(),
        "widgets": [
            {
                "id":           w.id,
                "title":        w.title,
                "chart_type":   w.chart_type,
                "metric":       w.metric,
                "dimension":    w.dimension,
                "time_group":   w.time_group,
                "filters_json": w.filters_json,
                "pos_x":        w.pos_x,
                "pos_y":        w.pos_y,
                "width":        w.width,
                "height":       w.height,
            }
            for w in d.widgets
        ],
    }

@app.put("/api/dashboards/{dashboard_id}")
def update_dashboard(dashboard_id: int, body: DashboardUpdate,
                     db: Session = Depends(get_db)):
    d = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if body.name is not None:
        d.name = body.name
    if body.description is not None:
        d.description = body.description
    d.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(d)
    return {"id": d.id, "name": d.name, "description": d.description}

@app.delete("/api/dashboards/{dashboard_id}", status_code=204)
def delete_dashboard(dashboard_id: int, db: Session = Depends(get_db)):
    d = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.delete(d)
    db.commit()

# ─── Виджеты ───────────────────────────────────────────────────
@app.post("/api/dashboards/{dashboard_id}/widgets", status_code=201)
def create_widget(dashboard_id: int, body: WidgetCreate,
                  db: Session = Depends(get_db)):
    d = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id
    ).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    w = models.Widget(
        dashboard_id=dashboard_id,
        title=body.title,
        chart_type=body.chart_type,
        metric=body.metric,
        dimension=body.dimension,
        time_group=body.time_group,
        filters_json=body.filters_json,
        pos_x=body.pos_x,
        pos_y=body.pos_y,
        width=body.width,
        height=body.height,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return {"id": w.id, "title": w.title}

@app.put("/api/widgets/{widget_id}")
def update_widget(widget_id: int, body: WidgetUpdate,
                  db: Session = Depends(get_db)):
    w = db.query(models.Widget).filter(
        models.Widget.id == widget_id
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(w, field, val)
    db.commit()
    db.refresh(w)
    return {"id": w.id, "title": w.title}

@app.delete("/api/widgets/{widget_id}", status_code=204)
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    w = db.query(models.Widget).filter(
        models.Widget.id == widget_id
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Widget not found")
    db.delete(w)
    db.commit()

# ─── Health check ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "dashboard-service"}