from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Dashboard(Base):
    __tablename__ = "dashboards"

    id          = Column(Integer, primary_key=True)
    name        = Column(String, nullable=False)
    description = Column(String, default="")
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    widgets = relationship("Widget", back_populates="dashboard",
                           cascade="all, delete-orphan")

class Widget(Base):
    __tablename__ = "widgets"

    id           = Column(Integer, primary_key=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False)
    title        = Column(String, nullable=False)

    # Тип визуализации: line / bar / pie / kpi / table
    chart_type   = Column(String, nullable=False)

    # Что показываем: revenue / count / avg_check / discount / bonus
    metric       = Column(String, nullable=False)

    # Разбивка: time / source / salon / service / payment / weekday
    dimension    = Column(String, nullable=False)

    # Группировка по времени если dimension=time: day/month/year
    time_group   = Column(String, default="month")

    # Фильтры виджета (JSON строка)
    filters_json = Column(Text, default="{}")

    # Позиция на холсте
    pos_x        = Column(Integer, default=0)
    pos_y        = Column(Integer, default=0)
    width        = Column(Integer, default=6)
    height       = Column(Integer, default=4)

    created_at   = Column(DateTime, default=datetime.utcnow)

    dashboard    = relationship("Dashboard", back_populates="widgets")