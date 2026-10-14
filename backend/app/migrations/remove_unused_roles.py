"""Remove the retired sign-in roles: Faculty, Assessment Coordinator and ERP Coordinator.

Run from backend: python -m app.migrations.remove_unused_roles
The portal now has four logins (Student, Class Tutor, HoD, Administrator). The roles are only
deleted when no user holds them; otherwise the script stops and lists who still has one.
"""
from sqlalchemy import text
from app.database import engine

RETIRED_ROLES = ["Faculty", "Assessment Coordinator", "ERP Coordinator"]


def migrate():
    with engine.begin() as connection:
        holders = connection.execute(text(
            "SELECT r.name, u.username FROM roles r JOIN user_roles ur ON ur.role_id = r.id "
            "JOIN users u ON u.id = ur.user_id WHERE r.name = ANY(:names)"
        ), {"names": RETIRED_ROLES}).fetchall()
        if holders:
            raise RuntimeError(f"Still assigned, reassign these users first: {holders}")
        deleted = connection.execute(text("DELETE FROM roles WHERE name = ANY(:names)"), {"names": RETIRED_ROLES}).rowcount
    print(f"Removed {deleted} retired role(s): {', '.join(RETIRED_ROLES)}.")


if __name__ == "__main__":
    migrate()
