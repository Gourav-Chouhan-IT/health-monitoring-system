import requests
import random
import time

MODE = "mock"  # change to "live" when ESP32 is connected
URL = "http://localhost:8000/data"

def generate_mock_data():
    return {
        "bpm": round(random.uniform(60, 100), 1),
        "temp": round(random.uniform(36.1, 37.2), 1),
        "spo2": round(random.uniform(95, 100), 1),
        "gsr": round(random.uniform(300, 600), 1),
        "timestamp": int(time.time())
    }

while True:
    if MODE == "mock":
        data = generate_mock_data()
        response = requests.post(URL, json=data)
        print(f"Sent: {data} | Status: {response.status_code}")
    time.sleep(1)