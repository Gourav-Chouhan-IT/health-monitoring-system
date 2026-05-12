/*
 * StressWatch — Sensor Node
 *
 * Reads raw sensor data and emits a JSON line every second via
 * Serial (USB) and SoftwareSerial (Bluetooth).
 *
 * Sensors
 *   MAX30102  — heart rate (BPM) + SpO2
 *   TMP117    — skin/ambient temperature (°C)
 *   MPU6050   — accelerometer → motion detection
 *   Analog A0 — GSR (galvanic skin response, raw ADC value)
 *
 * Output JSON keys (all lowercase, no stress field — stress is
 * calculated on the backend, not here):
 *   hr           int    beats per minute (0 if no finger detected)
 *   spo2         int    oxygen saturation in % (0 if no finger)
 *   temp         float  temperature in °C, 1 decimal place
 *   gsr          int    raw ADC reading from A0 (0–1023)
 *   motion_value int    normalised motion intensity 0–100
 *   movement     string "MOVED" | "NOT_MOVED"
 */

#include <Wire.h>
#include <MAX30105.h>
#include "heartRate.h"
#include <SoftwareSerial.h>
#include <SparkFun_TMP117.h>
#include <MPU6050.h>

// ── Bluetooth serial (RX=2, TX=3) ─────────────────────────────
SoftwareSerial bluetooth(2, 3);

// ── Sensor objects ─────────────────────────────────────────────
MAX30105 max30102;
TMP117   tempSensor;
MPU6050  mpu;

#define GSR_PIN A0
#define MOTION_THRESHOLD 8       // motion_value above this = "MOVED"
#define SEND_INTERVAL_MS 1000    // emit JSON every 1 s

// ── Heart-rate state ───────────────────────────────────────────
unsigned long lastBeatMs  = 0;
float         bpmAvg      = 0;
int           beatCount   = 0;
int           spo2        = 0;

// ── Motion state ───────────────────────────────────────────────
long prevMagnitude = 0;
int  motionValue   = 0;

// ── Temperature ────────────────────────────────────────────────
float bodyTemp = 0;

// ── Timing ─────────────────────────────────────────────────────
unsigned long lastSendMs = 0;

// ══════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  Wire.begin();

  // MAX30102 — heart rate & SpO2
  if (!max30102.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("[ERROR] MAX30102 not found");
    while (1);
  }
  max30102.setup();
  max30102.setPulseAmplitudeIR(0x3F);
  max30102.setPulseAmplitudeRed(0x2A);

  // TMP117 — temperature
  if (!tempSensor.begin()) {
    Serial.println("[ERROR] TMP117 not detected");
    while (1);
  }

  // MPU6050 — motion
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("[ERROR] MPU6050 not connected");
    while (1);
  }

  // Capture initial accelerometer magnitude for motion delta baseline
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  prevMagnitude = sqrt((long)ax*ax + (long)ay*ay + (long)az*az);

  Serial.println("[OK] All sensors initialised");
}

// ══════════════════════════════════════════════════════════════
void loop() {

  // ── Heart rate (runs continuously between sends) ────────────
  long irValue = max30102.getIR();

  if (irValue > 10000) {
    // Finger detected
    if (checkForBeat(irValue)) {
      unsigned long now = millis();
      float bpm = 60000.0 / (now - lastBeatMs);   // ms → BPM
      lastBeatMs = now;

      if (bpm > 45 && bpm < 150) {
        // Running average
        bpmAvg = (bpmAvg * beatCount + bpm) / (beatCount + 1);
        beatCount++;
      }
    }
    if (beatCount >= 2) spo2 = 98;   // simple fixed estimate once stable
  } else {
    // No finger — reset
    bpmAvg    = 0;
    beatCount = 0;
    spo2      = 0;
  }

  // ── Motion (runs continuously) ──────────────────────────────
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  long magnitude = sqrt((long)ax*ax + (long)ay*ay + (long)az*az);
  long delta     = abs(magnitude - prevMagnitude);
  prevMagnitude  = magnitude;

  // Normalise delta to 0–100
  motionValue = (int)map(delta, 0, 15000, 0, 100);
  motionValue = constrain(motionValue, 0, 100);

  // ── Temperature (runs continuously) ─────────────────────────
  bodyTemp = tempSensor.readTempC();

  // ── Send JSON once per SEND_INTERVAL_MS ─────────────────────
  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();

    int rawGSR = analogRead(GSR_PIN);
    bool moved = (motionValue > MOTION_THRESHOLD);

    // Build JSON — raw sensor values only.
    // Stress level is NOT calculated here; the backend does that.
    String json =
      String("{") +
      "\"hr\":"           + String((int)bpmAvg)    +
      ",\"spo2\":"        + String(spo2)            +
      ",\"temp\":"        + String(bodyTemp, 1)     +
      ",\"gsr\":"         + String(rawGSR)          +
      ",\"motion_value\":" + String(motionValue)   +
      ",\"movement\":\""  + (moved ? "MOVED" : "NOT_MOVED") + "\"" +
      "}";

    Serial.println(json);
    bluetooth.println(json);
  }
}
