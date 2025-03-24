from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Database URLs
INVOICE_DATABASE_URL = "sqlite:///./data/invoices.db"
RATE_LIMIT_DATABASE_URL = "sqlite:///./data/rate_limits.db"

# Invoice database setup
invoice_engine = create_engine(INVOICE_DATABASE_URL, connect_args={"check_same_thread": False})
InvoiceSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=invoice_engine)

# Rate limit database setup
rate_limit_engine = create_engine(RATE_LIMIT_DATABASE_URL, connect_args={"check_same_thread": False})
RateLimitSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=rate_limit_engine)

Base = declarative_base()

class Invoice(Base):
    __tablename__ = "invoices"

    email = Column(String, primary_key=True)
    payment_type = Column(String, nullable=False)
    order_id = Column(String, nullable=False, index=True)
    order_state = Column(String, nullable=False)
    checkout_link= Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    fulfillment_time = Column(String, nullable=True)
    stripe_session_id = Column(String, nullable=True, index=True)
    stripe_invoice_state = Column(String, nullable=True)
    btcpay_invoice_id = Column(String, nullable=True, index=True)
    btcpay_invoice_state = Column(String, nullable=True)
    btcpay_city = Column(String, nullable=True)
    btcpay_state = Column(String, nullable=True)
    btcpay_postal_code = Column(String, nullable=True)
    btcpay_country = Column(String, nullable=True)

class RateLimit(Base):
    __tablename__ = "rate_limits"
    
    email = Column(String, primary_key=True)
    product_id = Column(String, nullable=False)
    request_count = Column(Integer, nullable=False, default=0)
    
# Create tables in both databases
Base.metadata.create_all(bind=invoice_engine)
Base.metadata.create_all(bind=rate_limit_engine)

# Database session management
def get_invoice_db():
    db = InvoiceSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_rate_limit_db():
    db = RateLimitSessionLocal()
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
