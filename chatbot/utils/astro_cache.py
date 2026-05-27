from functools import lru_cache

from kerykeion import AstrologicalSubject

from chatbot.utils.geo import get_coordinates


def _safe_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


@lru_cache(maxsize=512)
def get_astrological_subject(
    name,
    year,
    month,
    day,
    hour=0,
    minute=0,
    city="Hanoi",
    country="VN",
):
    city = city or "Hanoi"
    country = country or "VN"
    lat, lng, tz_str = get_coordinates(city, country)

    return AstrologicalSubject(
        name or "User",
        _safe_int(year, 2000),
        _safe_int(month, 1),
        _safe_int(day, 1),
        _safe_int(hour, 0),
        _safe_int(minute, 0),
        city=city,
        nation=country,
        lat=lat,
        lng=lng,
        tz_str=tz_str,
        online=False,
    )
