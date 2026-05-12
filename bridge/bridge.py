"""
StressWatch — Bridge
====================
Reads raw JSON from the Arduino over serial (or Bluetooth COM port),
validates each field, and POSTs raw sensor values to the backend.

The backend (server.js) is the single source of truth for stress
calculation. This script sends only raw sensor values and never
calculates or guesses a stress level.

Arduino JSON keys expected:
    hr           int    heart rate in BPM
    spo2         int    oxygen saturation %
    temp         float  temperature °C
    gsr          int    raw ADC value (0–1023)
    motion_value int    normalised motion 0–100
    movement     str    "MOVED" | "NOT_MOVED"

Falls back to simulated data if no serial device is found.
"""

import serial
from serial.tools import list_ports
import time
import requests
import random
import json

# ── Configuration ──────────────────────────────────────────────
SERIAL_PORT     = 'COM6'           # change to match Device Manager
BAUD_RATE       = 9600
SERVER_URL      = 'http://localhost:5000/api/data'
REQUEST_TIMEOUT = 1.5              # seconds before giving up on POST

# Exact set of keys the Arduino sends.
# "stress" is intentionally NOT here — stress is backend's job.
REQUIRED_KEYS = {"hr", "spo2", "temp", "gsr", "motion_value", "movement"}


# ── Helpers ────────────────────────────────────────────────────
def find_serial_port(preferred: str) -> str | None:
    """Return preferred port if available, else the first found port."""
    available = [p.device for p in list_ports.comports()]
    if preferred in available:
        return preferred
    return available[0] if available else None


def parse_arduino_json(line: str) -> dict | None:
    """
    Parse and validate a JSON line from Arduino.
    Returns a dict of clean values, or None if invalid.
    """
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        return None

    # Reject if any expected key is missing
    if not REQUIRED_KEYS.issubset(data.keys()):
        missing = REQUIRED_KEYS - data.keys()
        print(f"[WARN] Missing keys: {missing}")
        return None

    try:
        hr         = int(data["hr"])
        spo2_val   = int(data["spo2"])
        temp       = float(data["temp"])
        raw_gsr    = int(data["gsr"])
        motion_val = int(data["motion_value"])
        movement   = str(data["movement"])
    except (TypeError, ValueError) as e:
        print(f"[WARN] Type error in payload: {e}")
        return None

    # Sanity bounds
    if not (0 <= hr <= 220):
        return None
    if not (0 <= spo2_val <= 100):
        return None
    if not (25.0 <= temp <= 45.0):
        return None
    if raw_gsr < 0:
        return None
    if not (0 <= motion_val <= 100):
        return None
    if movement not in ("MOVED", "NOT_MOVED"):
        return None

    return {
        "hr":           hr,
        "spo2":         spo2_val,
        "temp":         temp,
        "gsr":          raw_gsr,
        "motion_value": motion_val,
        "movement":     movement,
    }


def build_payload(parsed: dict, is_hardware: bool) -> dict:
    """
    Convert parsed Arduino data into the backend API payload.
    Motion status is derived from motion_value (consistent with
    Arduino's MOTION_THRESHOLD of 8).
    """
    motion_status = "Active" if parsed["motion_value"] > 8 else "Inactive"

    return {
        "heartRate":   parsed["hr"],
        "spo2":        parsed["spo2"],
        "temperature": parsed["temp"],
        "gsr":         parsed["gsr"],
        "motion":      motion_status,
        "isHardware":  is_hardware,
        # No stressLevel here — backend calculates it
    }


def post_payload(payload: dict) -> bool:
    """POST payload to backend. Returns True on success."""
    try:
        requests.post(SERVER_URL, json=payload, timeout=REQUEST_TIMEOUT)
        return True
    except requests.exceptions.RequestException as e:
        print(f"[WARN] POST failed: {e}")
        return False


# ── Connect to hardware ────────────────────────────────────────
connected_to_hardware = False
ser = None

try:
    resolved_port = find_serial_port(SERIAL_PORT)
    if not resolved_port:
        raise RuntimeError("No serial ports found")
    print(f"[INFO] Connecting to {resolved_port} @ {BAUD_RATE} baud…")
    ser = serial.Serial(resolved_port, BAUD_RATE, timeout=1)
    time.sleep(2)   # let Arduino reset after serial open
    connected_to_hardware = True
    print(f"[OK]   Connected to hardware on {resolved_port}")
except Exception as e:
    print(f"[WARN] Hardware connection failed: {e}")
    print("[INFO] Falling back to DEMO MODE (simulated data)")


# ── Main loop ─────────────────────────────────────────────────
while True:
    if connected_to_hardware:
        # ── Real hardware path ─────────────────────────────────
        try:
            if ser.in_waiting > 0:
                raw_line = ser.readline().decode("utf-8", errors="ignore").strip()

                if not (raw_line.startswith("{") and raw_line.endswith("}")):
                    continue    # skip non-JSON lines (startup messages etc.)

                parsed = parse_arduino_json(raw_line)
                if parsed is None:
                    print(f"[WARN] Dropped invalid payload: {raw_line}")
                    continue

                payload = build_payload(parsed, is_hardware=True)
                post_payload(payload)
                print(
                    f"[REAL] HR={payload['heartRate']} bpm  "
                    f"SpO2={payload['spo2']}%  "
                    f"Temp={payload['temperature']}°C  "
                    f"GSR={payload['gsr']}  "
                    f"Motion={payload['motion']}"
                )

        except Exception as e:
            print(f"[ERROR] Hardware read error: {e}")
            connected_to_hardware = False
            if ser:
                ser.close()

    else:
        # ── Demo / fail-safe path ──────────────────────────────
        # Sends plausible resting values so the frontend stays active.
        # Stress level will be calculated by the backend from these values.
        demo_payload = {
            "heartRate":   random.randint(70, 85),
            "spo2":        random.randint(97, 99),
            "temperature": round(random.uniform(36.5, 37.0), 1),
            "gsr":         random.randint(300, 500),
            "motion":      "Inactive",
            "isHardware":  False,
        }
        print(f"[DEMO] HR={demo_payload['heartRate']} bpm  GSR={demo_payload['gsr']} SPO2={demo_payload['spo2']}%  Temp={demo_payload['temperature']}°C")
        post_payload(demo_payload)
        time.sleep(1)
