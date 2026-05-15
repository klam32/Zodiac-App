def get_coordinates(city: str, country: str):
    """
    Trả về (lat, lng) cho các thành phố phổ biến để tránh treo khi gọi Geonames.
    """
    city = city.lower().strip()
    country = country.upper().strip()

    # MAPPING CÁC THÀNH PHỐ LỚN TẠI VIỆT NAM
    vietnam_cities = {
        "hanoi": (21.0285, 105.8542),
        "ha noi": (21.0285, 105.8542),
        "hà nội": (21.0285, 105.8542),
        "ho chi minh": (10.8231, 106.6297),
        "hồ chí minh": (10.8231, 106.6297),
        "sai gon": (10.8231, 106.6297),
        "sài gòn": (10.8231, 106.6297),
        "da nang": (16.0544, 108.2022),
        "đà nẵng": (16.0544, 108.2022),
        "can tho": (10.0452, 105.7469),
        "cần thơ": (10.0452, 105.7469),
        "hai phong": (20.8449, 106.6881),
        "hải phòng": (20.8449, 106.6881),
        "hue": (16.4637, 107.5909),
        "huế": (16.4637, 107.5909),
        "nha trang": (12.2461, 109.1942),
        "vung tau": (10.3460, 107.0843),
        "vũng tàu": (10.3460, 107.0843),
        "da lat": (11.9404, 108.4583),
        "đà lạt": (11.9404, 108.4583),
    }

    if country == "VN" or "vietnam" in country.lower():
        if city in vietnam_cities:
            return vietnam_cities[city]

    # Default fallback to Hanoi if unknown in VN
    if country == "VN":
        return (21.0285, 105.8542)

    return None, None
