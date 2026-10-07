import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.models import (
    Role, User, AcademicYear, Semester, Batch, Section
)
from app.auth.jwt import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Initializing Clean Block 1 Academic Master Database...")
        
        # 1. Master System Roles
        role_names = [
            "Student", "Faculty", "Class Tutor", "HoD",
            "Assessment Coordinator", "ERP Coordinator", "Administrator"
        ]
        roles_dict = {}
        for rname in role_names:
            role = db.query(Role).filter(Role.name == rname).first()
            if not role:
                role = Role(name=rname, description=f"{rname} role permissions")
                db.add(role)
            roles_dict[rname] = role
        db.flush()
        
        # 2. Term Infrastructure Defaults
        ay = db.query(AcademicYear).filter(AcademicYear.year_code == "2025-2026").first()
        if not ay:
            ay = AcademicYear(year_code="2025-2026", is_current=True)
            db.add(ay)
            
        sem = db.query(Semester).filter(Semester.number == 4).first()
        if not sem:
            sem = Semester(number=4, name="Semester IV", academic_year="2025-2026")
            db.add(sem)

        batch = db.query(Batch).filter(Batch.name == "2023-2026").first()
        if not batch:
            batch = Batch(name="2023-2026", start_year=2023, end_year=2026)
            db.add(batch)

        sec = db.query(Section).filter(Section.name == "A").first()
        if not sec:
            sec = Section(name="A")
            db.add(sec)
        db.flush()

        # 3. Root Administrator Account ONLY
        u_admin = db.query(User).filter(User.username == "admin").first()
        if not u_admin:
            u_admin = User(
                username="admin",
                email="admin@nasccbe.ac.in",
                full_name="System Administrator",
                mobile="9876543210",
                hashed_password=get_password_hash("admin123"),
                is_active=True
            )
            u_admin.roles.append(roles_dict["Administrator"])
            db.add(u_admin)
        
        db.commit()
        print("Block 1 Database Seeding Completed Successfully!")
        print("=====================================================")
        print("Admin Login Credentials: admin / admin123")
        print("=====================================================")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
