from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

DATABASE_URL = "sqlite:///./invoices.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Invoice(Base):
    __tablename__ = "invoices"

    email = Column(String, primary_key=True)
    payment_type = Column(String, nullable=False)
    btcpay_invoice_id = Column(String, nullable=True, index=True)
    btcpay_invoice_state = Column(String, nullable=True)
    
Base.metadata.create_all(bind=engine)

# DB init
def get_invoice_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def dump_invoice_db(db: Session):
    invoices = db.query(Invoice).all()
    print([invoice.__dict__ for invoice in invoices])
