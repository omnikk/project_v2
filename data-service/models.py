from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base

class Region(Base):
    __tablename__ = "regions"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    salons = relationship("Salon", back_populates="region")

class Salon(Base):
    __tablename__ = "salons"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"))
    address = Column(String)
    format = Column(String)        # премиум / стандарт / эконом
    open_date = Column(String)
    area_sqm = Column(Integer)
    rating = Column(Float)

    region = relationship("Region", back_populates="salons")
    masters = relationship("Master", back_populates="salon")

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String)      # волосы / ногти / лицо / тело / брови
    base_price = Column(Float)
    duration_min = Column(Integer)

class Master(Base):
    __tablename__ = "masters"
    id = Column(Integer, primary_key=True)
    salon_id = Column(Integer, ForeignKey("salons.id"))
    name = Column(String)
    specialization = Column(String)
    experience_years = Column(Integer)
    hourly_rate = Column(Float)
    rating = Column(Float)

    salon = relationship("Salon", back_populates="masters")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True)
    gender = Column(String)
    age_group = Column(String)     # 18-24 / 25-34 / 35-44 / 45+
    city = Column(String)
    registration_source = Column(String)
    bonus_balance = Column(Float, default=0)
    total_visits = Column(Integer, default=0)
    total_spent = Column(Float, default=0)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    master_id = Column(Integer, ForeignKey("masters.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    day_of_week = Column(Integer)  # 0=пн, 6=вс

    source = Column(String)        # web / ios / android / walk-in / phone
    status = Column(String)        # completed / cancelled / no-show
    payment_method = Column(String) # cash / card / online

    price = Column(Float)
    discount_pct = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    bonus_spent = Column(Float, default=0)
    bonus_earned = Column(Float, default=0)
    final_price = Column(Float)

    __table_args__ = (
        Index("idx_apt_salon_year_month", "salon_id", "year", "month"),
        Index("idx_apt_start_time", "start_time"),
        Index("idx_apt_source", "source"),
        Index("idx_apt_status", "status"),
    )

class DailySalonStat(Base):
    __tablename__ = "daily_salon_stats"
    id = Column(Integer, primary_key=True)
    salon_id = Column(Integer, ForeignKey("salons.id"), nullable=False)
    date = Column(String, nullable=False)
    year = Column(Integer)
    month = Column(Integer)
    appointments_count = Column(Integer, default=0)
    completed_count = Column(Integer, default=0)
    cancelled_count = Column(Integer, default=0)
    revenue = Column(Float, default=0)
    discount_total = Column(Float, default=0)
    bonus_spent_total = Column(Float, default=0)
    avg_check = Column(Float, default=0)

    __table_args__ = (
        Index("idx_daily_salon_date", "salon_id", "date"),
    )