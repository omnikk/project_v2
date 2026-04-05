import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

# ─── Справочники ───────────────────────────────────────────────
REGIONS = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург",
    "Казань", "Нижний Новгород", "Челябинск", "Самара",
    "Уфа", "Ростов-на-Дону"
]

CITIES_BY_REGION = {
    "Москва": ["Москва", "Зеленоград", "Химки", "Подольск"],
    "Санкт-Петербург": ["Санкт-Петербург", "Гатчина", "Пушкин"],
    "Новосибирск": ["Новосибирск", "Бердск"],
    "Екатеринбург": ["Екатеринбург", "Нижний Тагил"],
    "Казань": ["Казань", "Набережные Челны"],
    "Нижний Новгород": ["Нижний Новгород", "Дзержинск"],
    "Челябинск": ["Челябинск", "Магнитогорск"],
    "Самара": ["Самара", "Тольятти"],
    "Уфа": ["Уфа", "Стерлитамак"],
    "Ростов-на-Дону": ["Ростов-на-Дону", "Таганрог"],
}

FORMATS = ["премиум", "стандарт", "эконом"]
FORMAT_WEIGHTS = [0.2, 0.5, 0.3]

FORMAT_PRICE_MULT = {"премиум": 1.8, "стандарт": 1.0, "эконом": 0.65}

SALON_PREFIXES = [
    "Beauty", "Glamour", "Luxe", "Elite", "Stella",
    "Vogue", "Prima", "Belle", "Grace", "Charm",
    "Diamond", "Crystal", "Royal", "Grand", "Solo",
    "Aura", "Bloom", "Glow", "Velvet", "Pearl",
    "Iris", "Nova", "Opal", "Sage", "Zen"
]
SALON_SUFFIXES = [
    "Studio", "Salon", "Spa", "Club", "House",
    "Bar", "Space", "Place", "Point", "Center",
    "Lounge", "Atelier", "Lab", "Room", "Corner"
]

SERVICES = [
    ("Стрижка женская",    "волосы", 1800, 60),
    ("Стрижка мужская",    "волосы", 1200, 45),
    ("Окрашивание",        "волосы", 4500, 120),
    ("Мелирование",        "волосы", 5500, 150),
    ("Кератин",            "волосы", 7000, 180),
    ("Укладка",            "волосы", 1500, 45),
    ("Маникюр классик",    "ногти",  1800, 60),
    ("Маникюр гель",       "ногти",  2500, 90),
    ("Педикюр классик",    "ногти",  2200, 75),
    ("Педикюр гель",       "ногти",  3000, 90),
    ("Чистка лица",        "лицо",   3500, 60),
    ("Пилинг",             "лицо",   4000, 75),
    ("Массаж лица",        "лицо",   2800, 45),
    ("SPA-уход тело",      "тело",   5500, 90),
    ("Обертывание",        "тело",   4500, 75),
    ("Оформление бровей",  "брови",  1500, 30),
    ("Ламинирование бровей","брови", 2500, 45),
    ("Наращивание ресниц", "брови",  3500, 90),
]

SPECIALIZATIONS = {
    "волосы": "Парикмахер-стилист",
    "ногти":  "Мастер маникюра",
    "лицо":   "Косметолог",
    "тело":   "Массажист",
    "брови":  "Мастер бровей",
}

MASTER_NAMES = [
    "Анна Иванова", "Мария Петрова", "Елена Сидорова",
    "Ольга Смирнова", "Татьяна Козлова", "Наталья Волкова",
    "Ирина Соколова", "Екатерина Морозова", "Светлана Новикова",
    "Юлия Попова", "Людмила Лебедева", "Вера Семенова",
    "Галина Егорова", "Надежда Павлова", "Тамара Козлова",
    "Алина Степанова", "Диана Орлова", "Кристина Яковлева",
    "Полина Сергеева", "Валерия Захарова",
]

SOURCES = ["web", "ios", "android", "walk-in", "phone"]
SOURCE_WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10]

STATUSES = ["completed", "cancelled", "no-show"]
STATUS_WEIGHTS = [0.78, 0.16, 0.06]

PAYMENT_METHODS = ["card", "cash", "online"]
PAYMENT_WEIGHTS = [0.55, 0.25, 0.20]

AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"]
GENDERS = ["female", "male"]
GENDER_WEIGHTS = [0.75, 0.25]

# ─── Генераторы ────────────────────────────────────────────────
def rand_rating():
    return round(random.uniform(3.8, 5.0), 1)

def rand_open_date():
    y = random.randint(2015, 2022)
    m = random.randint(1, 12)
    return f"{y}-{m:02d}-01"

def make_salon_name(used, idx):
    for _ in range(1000):
        name = f"{random.choice(SALON_PREFIXES)} {random.choice(SALON_SUFFIXES)}"
        if name not in used:
            used.add(name)
            return name
    # Если всё занято — добавляем номер
    name = f"Salon #{idx + 1}"
    used.add(name)
    return name

# ─── Шаг 1: регионы ────────────────────────────────────────────
def seed_regions(db):
    print("  Регионы...")
    objs = [models.Region(name=r) for r in REGIONS]
    db.add_all(objs)
    db.commit()
    return {r.name: r for r in db.query(models.Region).all()}

# ─── Шаг 2: услуги ─────────────────────────────────────────────
def seed_services(db):
    print("  Услуги...")
    objs = [
        models.Service(name=n, category=c, base_price=p, duration_min=d)
        for n, c, p, d in SERVICES
    ]
    db.add_all(objs)
    db.commit()
    return db.query(models.Service).all()

# ─── Шаг 3: салоны (200 штук) ──────────────────────────────────
def seed_salons(db, regions):
    print("  Салоны (200)...")
    used_names = set()
    salons = []
    for i in range(200):
        region_name = random.choices(REGIONS, weights=[
            30,20,8,8,7,6,5,5,5,6
        ])[0]
        region = regions[region_name]
        city = random.choice(CITIES_BY_REGION[region_name])
        fmt = random.choices(FORMATS, weights=FORMAT_WEIGHTS)[0]
        salon = models.Salon(
            name=make_salon_name(used_names, i),
            city=city,
            region_id=region.id,
            address=f"ул. {random.choice(['Ленина','Мира','Советская','Пушкина','Гагарина'])}, д.{random.randint(1,150)}",
            format=fmt,
            open_date=rand_open_date(),
            area_sqm=random.randint(40, 300),
            rating=rand_rating(),
        )
        salons.append(salon)
    db.add_all(salons)
    db.commit()
    return db.query(models.Salon).all()

# ─── Шаг 4: мастера (~4-6 на салон) ───────────────────────────
def seed_masters(db, salons):
    print("  Мастера...")
    masters = []
    for salon in salons:
        count = random.randint(4, 6)
        names_used = set()
        for _ in range(count):
            name = random.choice(MASTER_NAMES)
            while name in names_used:
                name = random.choice(MASTER_NAMES)
            names_used.add(name)
            spec_cat = random.choice(list(SPECIALIZATIONS.keys()))
            master = models.Master(
                salon_id=salon.id,
                name=name,
                specialization=SPECIALIZATIONS[spec_cat],
                experience_years=random.randint(1, 15),
                hourly_rate=random.choice([280, 300, 320, 350, 380, 400]),
                rating=rand_rating(),
            )
            masters.append(master)
    db.add_all(masters)
    db.commit()
    return db.query(models.Master).all()

# ─── Шаг 5: клиенты (60 000) ───────────────────────────────────
def seed_clients(db):
    print("  Клиенты (60 000)...")
    clients = []
    all_cities = [c for cities in CITIES_BY_REGION.values() for c in cities]
    for _ in range(60_000):
        client = models.Client(
            gender=random.choices(GENDERS, weights=GENDER_WEIGHTS)[0],
            age_group=random.choice(AGE_GROUPS),
            city=random.choice(all_cities),
            registration_source=random.choices(SOURCES, weights=SOURCE_WEIGHTS)[0],
            bonus_balance=round(random.uniform(0, 5000), 2),
            total_visits=0,
            total_spent=0,
        )
        clients.append(client)
        if len(clients) % 10_000 == 0:
            db.add_all(clients)
            db.commit()
            clients = []
    if clients:
        db.add_all(clients)
        db.commit()
    return db.query(models.Client).all()

if __name__ == "__main__":
    print("Старт seed...")
    db = SessionLocal()
    regions = seed_regions(db)
    services = seed_services(db)
    salons = seed_salons(db, regions)
    masters = seed_masters(db, salons)
    clients = seed_clients(db)
    print(f"Базовые данные готовы.")
    print(f"Салонов: {len(salons)}, Мастеров: {len(masters)}, Клиентов: {len(clients)}")
    print("Теперь запускай seed_appointments.py")
    db.close()