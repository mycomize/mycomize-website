from sqlalchemy import create_engine, Column, String, Integer, Date, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import date

# Database URLs
DEV_INVOICE_DATABASE_URL = "sqlite:///./data/dev/invoices.db"
DEV_RATE_LIMIT_DATABASE_URL = "sqlite:///./data/dev/rate_limits.db"
DEV_API_USAGE_DATABASE_URL = "sqlite:///./data/dev/api_usage.db"

PROD_INVOICE_DATABASE_URL = "sqlite:///./data/prod/invoices.db"
PROD_RATE_LIMIT_DATABASE_URL = "sqlite:///./data/prod/rate_limits.db"
PROD_API_USAGE_DATABASE_URL = "sqlite:///./data/prod/api_usage.db"

# Invoice database setup
prod_invoice_engine = create_engine(PROD_INVOICE_DATABASE_URL, connect_args={"check_same_thread": False})
ProdInvoiceSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=prod_invoice_engine)

# Rate limit database setup
prod_rate_limit_engine = create_engine(PROD_RATE_LIMIT_DATABASE_URL, connect_args={"check_same_thread": False})
ProdRateLimitSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=prod_rate_limit_engine)

# Invoice database setup
dev_invoice_engine = create_engine(DEV_INVOICE_DATABASE_URL, connect_args={"check_same_thread": False})
DevInvoiceSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=dev_invoice_engine)

# Rate limit database setup
dev_rate_limit_engine = create_engine(DEV_RATE_LIMIT_DATABASE_URL, connect_args={"check_same_thread": False})
DevRateLimitSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=dev_rate_limit_engine)

# API usage database setup
prod_api_usage_engine = create_engine(PROD_API_USAGE_DATABASE_URL, connect_args={"check_same_thread": False})
ProdApiUsageSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=prod_api_usage_engine)

# API usage database setup
dev_api_usage_engine = create_engine(DEV_API_USAGE_DATABASE_URL, connect_args={"check_same_thread": False})
DevApiUsageSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=dev_api_usage_engine)

Base = declarative_base()

class Invoice(Base):
    __tablename__ = "invoices"

    email = Column(String, primary_key=True)
    payment_type = Column(String, nullable=False)
    order_id = Column(String, nullable=False, index=True)
    order_state = Column(String, nullable=False)
    checkout_link= Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    created_at_time = Column(String, nullable=False)
    fulfillment_time = Column(String, nullable=True)
    stripe_session_id = Column(String, nullable=True, index=True)
    stripe_invoice_state = Column(String, nullable=True)
    btcpay_invoice_id = Column(String, nullable=True, index=True)
    btcpay_invoice_state = Column(String, nullable=True)
    btcpay_city = Column(String, nullable=True)
    btcpay_state = Column(String, nullable=True)
    btcpay_postal_code = Column(String, nullable=True)
    btcpay_country = Column(String, nullable=True)
    btcpay_sales_tax = Column(Float, nullable=True)

class RateLimit(Base):
    __tablename__ = "rate_limits"

    email = Column(String, primary_key=True)
    product_id = Column(String, nullable=False)
    request_count = Column(Integer, nullable=False, default=0)

class ApiUsage(Base):
    __tablename__ = "api_usage"

    # Composite primary key of date and api_type
    date = Column(Date, primary_key=True)
    api_type = Column(String, primary_key=True)  # 'address_validation' or 'email_sending'
    count = Column(Integer, nullable=False, default=0)

# Create tables in all databases
Base.metadata.create_all(bind=prod_invoice_engine)
Base.metadata.create_all(bind=prod_rate_limit_engine)
Base.metadata.create_all(bind=prod_api_usage_engine)
Base.metadata.create_all(bind=dev_invoice_engine)
Base.metadata.create_all(bind=dev_rate_limit_engine)
Base.metadata.create_all(bind=dev_api_usage_engine)

# Database session management
def get_prod_invoice_db():
    db = ProdInvoiceSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_dev_invoice_db():
    db = DevInvoiceSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_prod_rate_limit_db():
    db = ProdRateLimitSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_dev_rate_limit_db():
    db = DevRateLimitSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_prod_api_usage_db():
    db = ProdApiUsageSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_dev_api_usage_db():
    # These are the same
    db = ProdApiUsageSessionLocal()
    try:
        yield db
    finally:
        db.close()

def dump_invoice_db(db: Session):
    invoices = db.query(Invoice).all()
    print([invoice.__dict__ for invoice in invoices])

def dump_rate_limit_db(db: Session):
    rate_limits = db.query(RateLimit).all()
    print([rate_limit.__dict__ for rate_limit in rate_limits])

def dump_api_usage_db(db: Session):
    api_usages = db.query(ApiUsage).all()
    print([api_usage.__dict__ for api_usage in api_usages])

async def increment_api_usage(db, api_type: str):
    """
    Increment the API usage count for a specific API type on the current date.

    Args:
        db (Session): Database session
        api_type (str): Type of API ('address_validation' or 'email_sending')

    Returns:
        int: The new count after incrementing
    """
    today = date.today()
    api_usage = db.query(ApiUsage).filter(ApiUsage.date == today, ApiUsage.api_type == api_type).first()

    if api_usage is None:
        api_usage = ApiUsage(date=today, api_type=api_type, count=1)
        db.add(api_usage)
    else:
        api_usage.count += 1

    db.commit()

    # Check if count is a multiple of 500
    if api_usage.count > 0 and api_usage.count % 500 == 0:
        return api_usage.count, True

    return api_usage.count, False
