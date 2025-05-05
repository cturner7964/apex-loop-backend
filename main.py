from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
import uuid
import math

app = FastAPI()

# Replace this with your real OpenRouteService API key (set in Render as ORS_API_KEY)
ORS_API_KEY = os.getenv("ORS_API_KEY", "5b3ce3597851110001cf62484c6d95872ffc4351a8552731f4dec2d8")
ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-car"

class LoopRequest(BaseModel):
    latitude: float
    longitude: float
    duration_minutes: int

class LoopResponse(BaseModel):
    route_id: str
    polyline: dict
    distance_miles: float
    estimated_time: str

@app.post("/api/generate-loop", response_model=LoopResponse)
def generate_loop(data: LoopRequest):
    avg_speed_mph = 45
    target_distance_miles = (data.duration_minutes / 60) * avg_speed_mph
    half_distance_km = (target_distance_miles / 2) * 1.60934

    # Calculate a waypoint northeast of the user
    lat_offset = half_distance_km / 111
    lon_offset = half_distance_km / (111 * abs(math.cos(math.radians(data.latitude))))

    waypoint_lat = data.latitude + lat_offset / 1.5
    waypoint_lon = data.longitude + lon_offset / 1.5

    coords = [
        [data.longitude, data.latitude],
        [waypoint_lon, waypoint_lat],
        [data.longitude, data.latitude]
    ]

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": coords,
        "format": "geojson"
    }

    response = requests.post(ORS_BASE_URL, json=body, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Routing failed")

    geojson = response.json()
    segment = geojson["features"][0]["properties"]["segments"][0]
    distance_m = segment["distance"]
    duration_s = segment["duration"]
    polyline = geojson["features"][0]["geometry"]

    return LoopResponse(
        route_id=str(uuid.uuid4()),
        polyline=polyline,
        distance_miles=round(distance_m * 0.000621371, 2),
        estimated_time=f"{round(duration_s / 60)} mins"
    )
