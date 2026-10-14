"""India Standard Time helpers. Timestamps are stored as naive UTC; the college runs on IST (no DST)."""
import datetime
from typing import Optional

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30), "IST")


def to_ist(dt: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
    return dt.replace(tzinfo=datetime.timezone.utc).astimezone(IST) if dt else None
